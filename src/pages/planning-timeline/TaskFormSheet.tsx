import { useState } from "react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { supabase } from "@/lib/supabase"
import { useDemoGuard } from "@/demo/useDemoGuard"
import { cn } from "@/lib/utils"
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
import { STATUS_LABELS } from "@/types"
import type { PlanningTask, Profile, TaskStatus } from "@/types"

const NO_ASSIGNEE = "none"

const WEEK_ITEMS = Array.from({ length: 17 }, (_, i) => ({
  value: String(16 - i),
  label: 16 - i === 0 ? "Week 0 (Event week)" : `Week ${16 - i}`,
}))

const STATUS_ITEMS = Object.entries(STATUS_LABELS).map(([value, label]) => ({
  value,
  label,
}))

interface TaskFormSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  task: PlanningTask | null
  profiles: Profile[]
  categories: string[]
}

export function TaskFormSheet({
  open,
  onOpenChange,
  task,
  profiles,
  categories,
}: TaskFormSheetProps) {
  const demoGuard = useDemoGuard()
  const [category, setCategory] = useState(task?.category ?? "")
  const [description, setDescription] = useState(task?.description ?? "")
  const [weekNumber, setWeekNumber] = useState(String(task?.week_number ?? 16))
  const [assignedTo, setAssignedTo] = useState(task?.assigned_to ?? NO_ASSIGNEE)
  const [status, setStatus] = useState<string>(task?.status ?? "not_started")
  const queryClient = useQueryClient()

  const mutation = useMutation({
    mutationFn: async () => {
      const payload = {
        category: category.trim(),
        description: description.trim(),
        week_number: Number(weekNumber),
        assigned_to: assignedTo === NO_ASSIGNEE ? null : assignedTo,
        status: status as TaskStatus,
      }

      if (task) {
        const { error } = await supabase
          .from("planning_tasks")
          .update(payload)
          .eq("id", task.id)
        if (error) throw error
      } else {
        const { error } = await supabase.from("planning_tasks").insert(payload)
        if (error) throw error
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["planning_tasks"] })
      toast.success(task ? "Task updated" : "Task created")
      onOpenChange(false)
    },
    onError: (error) => toast.error(error.message),
  })

  const assigneeItems = [
    { value: NO_ASSIGNEE, label: "Unassigned" },
    ...profiles.map((p) => ({
      value: p.id,
      label: p.full_name || p.email || "Unnamed",
    })),
  ]

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (demoGuard(() => onOpenChange(false))) return
    if (!category.trim()) {
      toast.error("Category is required")
      return
    }
    if (!description.trim()) {
      toast.error("Description is required")
      return
    }
    mutation.mutate()
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>{task ? "Edit task" : "Add task"}</SheetTitle>
          <SheetDescription>
            {task
              ? "Update this planning task."
              : "Create a new task for the planning timeline."}
          </SheetDescription>
        </SheetHeader>

        <form id="task-form" className="min-h-0 flex-1 overflow-y-auto px-4" onSubmit={handleSubmit} noValidate>
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="task-category">Category</FieldLabel>
              {categories.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {categories.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setCategory(c)}
                      className={cn(
                        "rounded-md border px-2.5 py-1 text-xs font-medium transition-colors",
                        category === c
                          ? "border-saffron bg-saffron/15 text-saffron"
                          : "border-border text-muted-foreground hover:border-foreground/30 hover:text-foreground hover:cursor-pointer"
                      )}
                    >
                      {c}
                    </button>
                  ))}
                </div>
              )}
              <Input
                id="task-category"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                placeholder={categories.length > 0 ? "Or type a new category" : "e.g. Design, Logistics, Marketing"}
              />
            </Field>

            <Field>
              <FieldLabel htmlFor="task-description">Description</FieldLabel>
              <Textarea
                id="task-description"
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="What needs to be done?"
              />
            </Field>

            <Field>
              <FieldLabel>Week</FieldLabel>
              <Select
                value={weekNumber}
                onValueChange={(v) => v && setWeekNumber(v)}
                items={WEEK_ITEMS}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {WEEK_ITEMS.map((item) => (
                    <SelectItem key={item.value} value={item.value}>
                      {item.label}
                    </SelectItem>
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
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {assigneeItems.map((item) => (
                    <SelectItem key={item.value} value={item.value}>
                      {item.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>

            <Field>
              <FieldLabel>Status</FieldLabel>
              <Select
                value={status}
                onValueChange={(v) => v && setStatus(v)}
                items={STATUS_ITEMS}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {STATUS_ITEMS.map((item) => (
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
          <Button type="submit" form="task-form" disabled={mutation.isPending}>
            {mutation.isPending ? "Saving..." : "Save"}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}
