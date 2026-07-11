import { useState } from "react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { supabase } from "@/lib/supabase"
import { useDemoGuard } from "@/demo/useDemoGuard"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { ConfirmDialog } from "@/components/common/ConfirmDialog"
import { minutesToTime, timeToMinutes, SCHEDULE_END, SLOT_MINUTES } from "./schedule-helpers"
import type { ProgramItem, Room } from "@/types"

interface EventFormSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  event: ProgramItem | null
  rooms: Room[]
  defaultRoomId?: string
  defaultColumnName?: string
  defaultStartTime?: string
}

function pad(n: number) {
  return String(n).padStart(2, "0")
}

function addSlot(time: string) {
  return minutesToTime(Math.min(timeToMinutes(time) + SLOT_MINUTES, SCHEDULE_END))
}

const TIME_OPTIONS = Array.from({ length: 17 }, (_, i) => {
  const totalMin = 14 * 60 + i * 15
  const h = Math.floor(totalMin / 60)
  const m = totalMin % 60
  const h12 = h > 12 ? h - 12 : h
  const period = h >= 12 ? "PM" : "AM"
  return {
    value: `${pad(h)}:${pad(m)}`,
    label: `${h12}:${pad(m)} ${period}`,
  }
})

export function EventFormSheet({
  open,
  onOpenChange,
  event,
  rooms,
  defaultRoomId,
  defaultColumnName,
  defaultStartTime,
}: EventFormSheetProps) {
  const [roomId, setRoomId] = useState(event?.room_id ?? defaultRoomId ?? rooms[0]?.id ?? "")
  const [columnName, setColumnName] = useState(event?.column_name ?? defaultColumnName ?? "")
  const [startTime, setStartTime] = useState(event?.start_time?.slice(0, 5) ?? defaultStartTime ?? "14:00")
  const [endTime, setEndTime] = useState(
    event?.end_time?.slice(0, 5) ?? addSlot(defaultStartTime ?? "14:00")
  )
  // Existing events keep their saved end time as-is; only a fresh "Add event"
  // default should auto-follow the start time until the user edits it directly.
  const [endTimeTouched, setEndTimeTouched] = useState(Boolean(event))
  const [activityName, setActivityName] = useState(event?.activity_name ?? "")
  const [description, setDescription] = useState(event?.description ?? "")
  const [confirmOpen, setConfirmOpen] = useState(false)

  const demoGuard = useDemoGuard()
  const queryClient = useQueryClient()
  const selectedRoom = rooms.find((r) => r.id === roomId)

  const roomItems = rooms.map((r) => ({ value: r.id, label: r.name }))

  const columnItems = (selectedRoom?.columns ?? []).map((c) => ({
    value: c,
    label: c,
  }))

  const mutation = useMutation({
    mutationFn: async () => {
      const payload = {
        room_id: roomId,
        column_name: columnName || (selectedRoom?.columns[0] ?? null),
        start_time: startTime,
        end_time: endTime,
        activity_name: activityName.trim(),
        description: description.trim() || null,
      }

      if (event) {
        const { error } = await supabase
          .from("program_items")
          .update(payload)
          .eq("id", event.id)
        if (error) throw error
      } else {
        const { error } = await supabase.from("program_items").insert(payload)
        if (error) throw error
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["program_items"] })
      toast.success(event ? "Event updated" : "Event added")
      onOpenChange(false)
    },
    onError: (error) => toast.error(error.message),
  })

  const deleteMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("program_items")
        .delete()
        .eq("id", event!.id)
      if (error) throw error
    },
    onSuccess: () => {
      setConfirmOpen(false)
      queryClient.invalidateQueries({ queryKey: ["program_items"] })
      toast.success("Event deleted")
      onOpenChange(false)
    },
    onError: (error) => toast.error(error.message),
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (demoGuard(() => onOpenChange(false))) return
    if (!activityName.trim()) {
      toast.error("Event name is required")
      return
    }
    if (!roomId) {
      toast.error("Select a room")
      return
    }
    if (startTime >= endTime) {
      toast.error("End time must be after start time")
      return
    }
    mutation.mutate()
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>{event ? "Edit event" : "Add event"}</SheetTitle>
          <SheetDescription>
            {event ? "Update this schedule event." : "Add a new event to the program."}
          </SheetDescription>
        </SheetHeader>

        <form id="event-form" className="min-h-0 flex-1 overflow-y-auto px-4" onSubmit={handleSubmit} noValidate>
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="event-name">Event name</FieldLabel>
              <Input
                id="event-name"
                value={activityName}
                onChange={(e) => setActivityName(e.target.value)}
                placeholder="e.g. Family Carnival, Kirtan"
              />
            </Field>

            <Field>
              <FieldLabel>Room</FieldLabel>
              <Select
                value={roomId}
                onValueChange={(v) => {
                  if (!v) return
                  setRoomId(v)
                  const room = rooms.find((r) => r.id === v)
                  if (room) setColumnName(room.columns[0] ?? "")
                }}
                items={roomItems}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {roomItems.map((item) => (
                    <SelectItem key={item.value} value={item.value}>
                      {item.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>

            {columnItems.length > 1 && (
              <Field>
                <FieldLabel>Column</FieldLabel>
                <Select
                  value={columnName || columnItems[0]?.value}
                  onValueChange={(v) => v && setColumnName(v)}
                  items={columnItems}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {columnItems.map((item) => (
                      <SelectItem key={item.value} value={item.value}>
                        {item.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
            )}

            <div className="grid grid-cols-2 gap-4">
              <Field>
                <FieldLabel>Start time</FieldLabel>
                <Select
                  value={startTime}
                  onValueChange={(v) => {
                    if (!v) return
                    setStartTime(v)
                    if (!endTimeTouched) setEndTime(addSlot(v))
                  }}
                  items={TIME_OPTIONS}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {TIME_OPTIONS.map((item) => (
                      <SelectItem key={item.value} value={item.value}>
                        {item.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>

              <Field>
                <FieldLabel>End time</FieldLabel>
                <Select
                  value={endTime}
                  onValueChange={(v) => {
                    if (!v) return
                    setEndTime(v)
                    setEndTimeTouched(true)
                  }}
                  items={TIME_OPTIONS}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {TIME_OPTIONS.map((item) => (
                      <SelectItem key={item.value} value={item.value}>
                        {item.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
            </div>

            <Field>
              <FieldLabel htmlFor="event-notes">Notes (optional)</FieldLabel>
              <Textarea
                id="event-notes"
                rows={2}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Any additional details"
              />
            </Field>
          </FieldGroup>
        </form>

        <SheetFooter className="flex-row justify-end gap-2">
          {event && (
            <Button
              type="button"
              variant="destructive"
              onClick={() => setConfirmOpen(true)}
              disabled={mutation.isPending || deleteMutation.isPending}
              className="mr-auto"
            >
              Delete
            </Button>
          )}
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={mutation.isPending}
          >
            Cancel
          </Button>
          <Button type="submit" form="event-form" disabled={mutation.isPending}>
            {mutation.isPending ? "Saving..." : "Save"}
          </Button>
        </SheetFooter>
      </SheetContent>

      {event && (
        <ConfirmDialog
          open={confirmOpen}
          onOpenChange={setConfirmOpen}
          title="Delete event?"
          description={`"${event.activity_name}" will be permanently deleted from the schedule.`}
          onConfirm={() => deleteMutation.mutate()}
          loading={deleteMutation.isPending}
        />
      )}
    </Sheet>
  )
}
