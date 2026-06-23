import { useState } from "react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { Plus, Trash2, X } from "lucide-react"
import { supabase } from "@/lib/supabase"
import { cn } from "@/lib/utils"
import { ConfirmDialog } from "@/components/common/ConfirmDialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Badge } from "@/components/ui/badge"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import type { Room } from "@/types"

const COLORS = [
  { value: "blue", label: "Blue", class: "bg-blue-500" },
  { value: "purple", label: "Purple", class: "bg-purple-500" },
  { value: "emerald", label: "Green", class: "bg-emerald-500" },
  { value: "amber", label: "Amber", class: "bg-amber-500" },
  { value: "rose", label: "Rose", class: "bg-rose-500" },
  { value: "cyan", label: "Cyan", class: "bg-cyan-500" },
]

interface RoomSettingsSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  rooms: Room[]
}

export function RoomSettingsSheet({ open, onOpenChange, rooms }: RoomSettingsSheetProps) {
  const [editingRoom, setEditingRoom] = useState<Room | null>(null)
  const [isAdding, setIsAdding] = useState(false)

  const [name, setName] = useState("")
  const [color, setColor] = useState("blue")
  const [columns, setColumns] = useState<string[]>(["Event"])
  const [newColumn, setNewColumn] = useState("")
  const [confirmDelete, setConfirmDelete] = useState<Room | null>(null)

  const queryClient = useQueryClient()

  const resetForm = () => {
    setName("")
    setColor("blue")
    setColumns(["Event"])
    setNewColumn("")
    setEditingRoom(null)
    setIsAdding(false)
  }

  const startEdit = (room: Room) => {
    setName(room.name)
    setColor(room.color)
    setColumns([...(room.columns as string[])])
    setNewColumn("")
    setEditingRoom(room)
    setIsAdding(false)
  }

  const startAdd = () => {
    resetForm()
    setIsAdding(true)
  }

  const addColumn = () => {
    const trimmed = newColumn.trim()
    if (!trimmed) return
    if (columns.includes(trimmed)) {
      toast.error("Column already exists")
      return
    }
    setColumns([...columns, trimmed])
    setNewColumn("")
  }

  const removeColumn = (col: string) => {
    if (columns.length <= 1) {
      toast.error("A room needs at least one column")
      return
    }
    setColumns(columns.filter((c) => c !== col))
  }

  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        name: name.trim(),
        color,
        columns,
      }

      if (editingRoom) {
        const { error } = await supabase
          .from("rooms")
          .update(payload)
          .eq("id", editingRoom.id)
        if (error) throw error
      } else {
        const { error } = await supabase
          .from("rooms")
          .insert({ ...payload, sort_order: rooms.length })
        if (error) throw error
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["rooms"] })
      toast.success(editingRoom ? "Room updated" : "Room added")
      resetForm()
    },
    onError: (error) => toast.error(error.message),
  })

  const deleteMutation = useMutation({
    mutationFn: async (roomId: string) => {
      const { error } = await supabase.from("rooms").delete().eq("id", roomId)
      if (error) throw error
    },
    onSuccess: () => {
      setConfirmDelete(null)
      queryClient.invalidateQueries({ queryKey: ["rooms"] })
      queryClient.invalidateQueries({ queryKey: ["program_items"] })
      toast.success("Room deleted")
    },
    onError: (error) => toast.error(error.message),
  })

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) {
      toast.error("Room name is required")
      return
    }
    if (columns.length === 0) {
      toast.error("Add at least one column")
      return
    }
    saveMutation.mutate()
  }

  const showForm = isAdding || editingRoom

  return (
    <Sheet open={open} onOpenChange={(v) => { onOpenChange(v); if (!v) resetForm() }}>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>Room Settings</SheetTitle>
          <SheetDescription>
            Add, edit, or remove rooms and their column layouts.
          </SheetDescription>
        </SheetHeader>

        <div className="min-h-0 flex-1 overflow-y-auto px-4">
          {/* Room list */}
          {!showForm && (
            <div className="space-y-2">
              {rooms.map((room) => (
                <div
                  key={room.id}
                  className="flex items-center gap-3 rounded-lg border border-border p-3"
                >
                  <div className={cn("size-3 shrink-0 rounded-full", `bg-${room.color}-500`)} />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-foreground">{room.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {(room.columns as string[]).join(", ")}
                    </p>
                  </div>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon-sm" onClick={() => startEdit(room)}>
                      <span className="text-xs">Edit</span>
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      onClick={() => setConfirmDelete(room)}
                    >
                      <Trash2 />
                    </Button>
                  </div>
                </div>
              ))}
              <Button variant="outline" className="w-full" onClick={startAdd}>
                <Plus />
                Add room
              </Button>
            </div>
          )}

          {/* Add/edit form */}
          {showForm && (
            <form id="room-form" onSubmit={handleSave} noValidate>
              <FieldGroup>
                <Field>
                  <FieldLabel htmlFor="room-name">Room name</FieldLabel>
                  <Input
                    id="room-name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Main Hall"
                  />
                </Field>

                <Field>
                  <FieldLabel>Color</FieldLabel>
                  <div className="flex flex-wrap gap-2">
                    {COLORS.map((c) => (
                      <button
                        key={c.value}
                        type="button"
                        onClick={() => setColor(c.value)}
                        className={cn(
                          "flex size-8 items-center justify-center rounded-full transition-all",
                          c.class,
                          color === c.value
                            ? "ring-2 ring-foreground ring-offset-2 ring-offset-background"
                            : "opacity-50 hover:opacity-75"
                        )}
                        aria-label={c.label}
                      />
                    ))}
                  </div>
                </Field>

                <Field>
                  <FieldLabel>Columns</FieldLabel>
                  <div className="flex flex-wrap gap-1.5">
                    {columns.map((col) => (
                      <Badge key={col} variant="secondary" className="gap-1 pr-1">
                        {col}
                        <button
                          type="button"
                          onClick={() => removeColumn(col)}
                          className="rounded-sm hover:bg-foreground/10"
                        >
                          <X className="size-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <Input
                      value={newColumn}
                      onChange={(e) => setNewColumn(e.target.value)}
                      placeholder="New column name"
                      onKeyDown={(e) => {
                        if (e.key === "Enter") { e.preventDefault(); addColumn() }
                      }}
                    />
                    <Button type="button" variant="outline" size="sm" onClick={addColumn}>
                      Add
                    </Button>
                  </div>
                </Field>
              </FieldGroup>
            </form>
          )}
        </div>

        {showForm && (
          <SheetFooter className="flex-row justify-end gap-2">
            <Button type="button" variant="outline" onClick={resetForm}>
              Back
            </Button>
            <Button type="submit" form="room-form" disabled={saveMutation.isPending}>
              {saveMutation.isPending ? "Saving..." : "Save"}
            </Button>
          </SheetFooter>
        )}
      </SheetContent>

      {confirmDelete && (
        <ConfirmDialog
          open={!!confirmDelete}
          onOpenChange={(v) => { if (!v) setConfirmDelete(null) }}
          title="Delete room?"
          description={`"${confirmDelete.name}" and all its events will be permanently deleted.`}
          onConfirm={() => deleteMutation.mutate(confirmDelete.id)}
          loading={deleteMutation.isPending}
        />
      )}
    </Sheet>
  )
}
