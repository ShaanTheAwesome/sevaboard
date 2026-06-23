import { useState } from "react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { supabase } from "@/lib/supabase"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import type { RosterEntry } from "@/types"

interface RosterFormSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  entry: RosterEntry | null
  existingRoles: string[]
  existingLocations: string[]
}

export function RosterFormSheet({
  open,
  onOpenChange,
  entry,
  existingRoles,
  existingLocations,
}: RosterFormSheetProps) {
  const [personName, setPersonName] = useState(entry?.person_name ?? "")
  const [sevaRole, setSevaRole] = useState(entry?.seva_role ?? "")
  const [timeSlot, setTimeSlot] = useState(entry?.time_slot ?? "")
  const [location, setLocation] = useState(entry?.location ?? "")
  const [notes, setNotes] = useState(entry?.notes ?? "")
  const queryClient = useQueryClient()

  const mutation = useMutation({
    mutationFn: async () => {
      const payload = {
        person_name: personName.trim() || null,
        seva_role: sevaRole.trim(),
        time_slot: timeSlot.trim() || null,
        location: location.trim() || null,
        notes: notes.trim() || null,
      }

      if (entry) {
        const { error } = await supabase.from("roster_entries").update(payload).eq("id", entry.id)
        if (error) throw error
      } else {
        const { error } = await supabase.from("roster_entries").insert(payload)
        if (error) throw error
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["roster_entries"] })
      toast.success(entry ? "Entry updated" : "Entry added")
      onOpenChange(false)
    },
    onError: (error) => toast.error(error.message),
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!sevaRole.trim()) {
      toast.error("Role is required")
      return
    }
    mutation.mutate()
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>{entry ? "Edit entry" : "Add entry"}</SheetTitle>
          <SheetDescription>
            {entry ? "Update this roster entry." : "Add a new volunteer assignment."}
          </SheetDescription>
        </SheetHeader>

        <form id="roster-form" className="min-h-0 flex-1 overflow-y-auto px-4" onSubmit={handleSubmit} noValidate>
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="roster-name">Person</FieldLabel>
              <Input
                id="roster-name"
                value={personName}
                onChange={(e) => setPersonName(e.target.value)}
                placeholder="Name of the volunteer"
              />
            </Field>

            <Field>
              <FieldLabel htmlFor="roster-role">Role</FieldLabel>
              {existingRoles.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {existingRoles.map((r) => (
                    <button
                      key={r}
                      type="button"
                      onClick={() => setSevaRole(r)}
                      className={cn(
                        "rounded-md border px-2.5 py-1 text-xs font-medium transition-colors",
                        sevaRole === r
                          ? "border-saffron bg-saffron/15 text-saffron"
                          : "border-border text-muted-foreground hover:border-foreground/30 hover:text-foreground hover:cursor-pointer"
                      )}
                    >
                      {r}
                    </button>
                  ))}
                </div>
              )}
              <Input
                id="roster-role"
                value={sevaRole}
                onChange={(e) => setSevaRole(e.target.value)}
                placeholder={existingRoles.length > 0 ? "Or type a new role" : "e.g. Stage Manager, Kitchen Lead"}
              />
            </Field>

            <Field>
              <FieldLabel htmlFor="roster-time">Time slot</FieldLabel>
              <Input
                id="roster-time"
                value={timeSlot}
                onChange={(e) => setTimeSlot(e.target.value)}
                placeholder="e.g. 2:00 - 4:00 PM"
              />
            </Field>

            <Field>
              <FieldLabel htmlFor="roster-location">Location</FieldLabel>
              {existingLocations.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {existingLocations.map((l) => (
                    <button
                      key={l}
                      type="button"
                      onClick={() => setLocation(l)}
                      className={cn(
                        "rounded-md border px-2.5 py-1 text-xs font-medium transition-colors",
                        location === l
                          ? "border-saffron bg-saffron/15 text-saffron"
                          : "border-border text-muted-foreground hover:border-foreground/30 hover:text-foreground hover:cursor-pointer"
                      )}
                    >
                      {l}
                    </button>
                  ))}
                </div>
              )}
              <Input
                id="roster-location"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder={existingLocations.length > 0 ? "Or type a new location" : "e.g. High Energy Room, Kitchen"}
              />
            </Field>

            <Field>
              <FieldLabel htmlFor="roster-notes">Notes (optional)</FieldLabel>
              <Textarea
                id="roster-notes"
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </Field>
          </FieldGroup>
        </form>

        <SheetFooter className="flex-row justify-end gap-2">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={mutation.isPending}>
            Cancel
          </Button>
          <Button type="submit" form="roster-form" disabled={mutation.isPending}>
            {mutation.isPending ? "Saving..." : "Save"}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}
