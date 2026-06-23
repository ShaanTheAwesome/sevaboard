import { useState } from "react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { supabase } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
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
import type { Department, Profile } from "@/types"

const NO_LEAD = "none"

interface DepartmentFormSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  department: Department | null
  profiles: Profile[]
}

export function DepartmentFormSheet({
  open,
  onOpenChange,
  department,
  profiles,
}: DepartmentFormSheetProps) {
  const [name, setName] = useState(department?.name ?? "")
  const [description, setDescription] = useState(department?.description ?? "")
  const [leadId, setLeadId] = useState(department?.lead_id ?? NO_LEAD)
  const queryClient = useQueryClient()

  const mutation = useMutation({
    mutationFn: async () => {
      const payload = {
        name: name.trim(),
        description: description || null,
        lead_id: leadId === NO_LEAD ? null : leadId,
      }

      if (department) {
        const { error } = await supabase
          .from("departments")
          .update(payload)
          .eq("id", department.id)

        if (error) throw error
      } else {
        const { error } = await supabase.from("departments").insert(payload)

        if (error) throw error
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["departments"] })
      toast.success(department ? "Department updated" : "Department created")
      onOpenChange(false)
    },
    onError: (error) => toast.error(error.message),
  })

  const leadItems = [
    { value: NO_LEAD, label: "No lead" },
    ...profiles.map((p) => ({ value: p.id, label: p.full_name || p.email || "Unnamed" })),
  ]

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) {
      toast.error("Name is required")
      return
    }
    mutation.mutate()
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>{department ? "Edit department" : "Add department"}</SheetTitle>
          <SheetDescription>
            {department
              ? "Update this department's name, description, or lead."
              : "Create a new department for the team."}
          </SheetDescription>
        </SheetHeader>

        <form id="department-form" className="min-h-0 flex-1 overflow-y-auto px-4" onSubmit={handleSubmit} noValidate>
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="department-name">Name</FieldLabel>
              <Input
                id="department-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </Field>

            <Field>
              <FieldLabel htmlFor="department-description">Description</FieldLabel>
              <Textarea
                id="department-description"
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </Field>

            <Field>
              <FieldLabel>Lead</FieldLabel>
              <Select
                value={leadId}
                onValueChange={(value) => value && setLeadId(value)}
                items={leadItems}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {leadItems.map((item) => (
                    <SelectItem key={item.value} value={item.value}>
                      {item.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
          </FieldGroup>
        </form>

        <SheetFooter className="flex-row justify-end gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={mutation.isPending}
          >
            Cancel
          </Button>
          <Button type="submit" form="department-form" disabled={mutation.isPending}>
            {mutation.isPending ? "Saving..." : "Save"}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}
