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
import { MARKETING_PLATFORM_LABELS, MARKETING_STATUS_LABELS } from "@/types"
import type { MarketingItem, MarketingPlatform, MarketingStatus, Profile } from "@/types"

const NO_ASSIGNEE = "none"
const NO_PLATFORM = "none"

const PLATFORM_ITEMS = [
  { value: NO_PLATFORM, label: "No platform" },
  ...Object.entries(MARKETING_PLATFORM_LABELS).map(([v, l]) => ({ value: v, label: l })),
]

const STATUS_ITEMS = Object.entries(MARKETING_STATUS_LABELS).map(([v, l]) => ({ value: v, label: l }))

interface MarketingFormSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  item: MarketingItem | null
  profiles: Profile[]
}

export function MarketingFormSheet({ open, onOpenChange, item, profiles }: MarketingFormSheetProps) {
  const demoGuard = useDemoGuard()
  const [title, setTitle] = useState(item?.title ?? "")
  const [description, setDescription] = useState(item?.description ?? "")
  const [platform, setPlatform] = useState(item?.platform ?? NO_PLATFORM)
  const [deadline, setDeadline] = useState(item?.deadline ?? "")
  const [status, setStatus] = useState<string>(item?.status ?? "not_started")
  const [assignedTo, setAssignedTo] = useState(item?.assigned_to ?? NO_ASSIGNEE)
  const [notes, setNotes] = useState(item?.notes ?? "")
  const queryClient = useQueryClient()

  const assigneeItems = [
    { value: NO_ASSIGNEE, label: "Unassigned" },
    ...profiles.map((p) => ({ value: p.id, label: p.full_name || p.email || "Unnamed" })),
  ]

  const mutation = useMutation({
    mutationFn: async () => {
      const payload = {
        title: title.trim(),
        description: description.trim() || null,
        platform: platform === NO_PLATFORM ? null : (platform as MarketingPlatform),
        deadline: deadline || null,
        status: status as MarketingStatus,
        assigned_to: assignedTo === NO_ASSIGNEE ? null : assignedTo,
        notes: notes.trim() || null,
      }

      if (item) {
        const { error } = await supabase.from("marketing_items").update(payload).eq("id", item.id)
        if (error) throw error
      } else {
        const { error } = await supabase.from("marketing_items").insert(payload)
        if (error) throw error
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["marketing_items"] })
      toast.success(item ? "Activity updated" : "Activity added")
      onOpenChange(false)
    },
    onError: (error) => toast.error(error.message),
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (demoGuard(() => onOpenChange(false))) return
    if (!title.trim()) {
      toast.error("Title is required")
      return
    }
    mutation.mutate()
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>{item ? "Edit activity" : "Add activity"}</SheetTitle>
          <SheetDescription>
            {item ? "Update this marketing activity." : "Add a new marketing activity."}
          </SheetDescription>
        </SheetHeader>

        <form id="marketing-form" className="min-h-0 flex-1 overflow-y-auto px-4" onSubmit={handleSubmit} noValidate>
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="marketing-title">Title</FieldLabel>
              <Input
                id="marketing-title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Instagram event poster"
              />
            </Field>

            <Field>
              <FieldLabel htmlFor="marketing-desc">Description (optional)</FieldLabel>
              <Textarea
                id="marketing-desc"
                rows={2}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="What needs to be created or done?"
              />
            </Field>

            <Field>
              <FieldLabel>Platform</FieldLabel>
              <Select
                value={platform}
                onValueChange={(v) => v && setPlatform(v)}
                items={PLATFORM_ITEMS}
              >
                <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {PLATFORM_ITEMS.map((i) => (
                    <SelectItem key={i.value} value={i.value}>{i.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>

            <Field>
              <FieldLabel htmlFor="marketing-deadline">Deadline</FieldLabel>
              <Input
                id="marketing-deadline"
                type="date"
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
              />
            </Field>

            <Field>
              <FieldLabel>Status</FieldLabel>
              <Select
                value={status}
                onValueChange={(v) => v && setStatus(v)}
                items={STATUS_ITEMS}
              >
                <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {STATUS_ITEMS.map((i) => (
                    <SelectItem key={i.value} value={i.value}>{i.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>

            <Field>
              <FieldLabel>Assigned to</FieldLabel>
              <Select
                value={assignedTo}
                onValueChange={(v) => v && setAssignedTo(v)}
                items={assigneeItems}
              >
                <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {assigneeItems.map((i) => (
                    <SelectItem key={i.value} value={i.value}>{i.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>

            <Field>
              <FieldLabel htmlFor="marketing-notes">Notes (optional)</FieldLabel>
              <Textarea
                id="marketing-notes"
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
          <Button type="submit" form="marketing-form" disabled={mutation.isPending}>
            {mutation.isPending ? "Saving..." : "Save"}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}
