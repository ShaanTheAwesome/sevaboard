import { useState } from "react"
import { useSortable } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { useDemoGuard } from "@/demo/useDemoGuard"
import { GripVertical, Pencil, Trash2 } from "lucide-react"
import { supabase } from "@/lib/supabase"
import { ConfirmDialog } from "@/components/common/ConfirmDialog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { STATUS_LABELS } from "@/types"
import type { PlanningTask, Profile, TaskStatus } from "@/types"

const STATUS_ORDER: TaskStatus[] = ["not_started", "in_progress", "done"]

const STATUS_COLORS: Record<TaskStatus, string> = {
  not_started: "bg-muted text-muted-foreground hover:text-muted-500 hover:bg-muted/80",
  in_progress: "bg-saffron/20 text-saffron/70 hover:text-saffron/90 hover:bg-saffron/30",
  done: "bg-emerald-500/20 text-emerald-500 hover:text-emerald-300 hover:bg-emerald-500/30",
}

interface TaskCardProps {
  task: PlanningTask
  assignee: Profile | undefined
  canEdit: boolean
  canUpdateStatus: boolean
  onEdit: () => void
}

export function TaskCard({ task, assignee, canEdit, canUpdateStatus, onEdit }: TaskCardProps) {
  const [confirmOpen, setConfirmOpen] = useState(false)
  const demoGuard = useDemoGuard()
  const queryClient = useQueryClient()

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id, disabled: !canEdit })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  const statusMutation = useMutation({
    mutationFn: async (newStatus: TaskStatus) => {
      const { error } = await supabase
        .from("planning_tasks")
        .update({ status: newStatus })
        .eq("id", task.id)
      if (error) throw error
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["planning_tasks"] }),
    onError: (error) => toast.error(error.message),
  })

  const deleteMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("planning_tasks")
        .delete()
        .eq("id", task.id)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["planning_tasks"] })
      toast.success("Task deleted")
    },
    onError: (error) => toast.error(error.message),
  })

  const cycleStatus = () => {
    if (demoGuard()) return
    const currentIndex = STATUS_ORDER.indexOf(task.status)
    const nextStatus = STATUS_ORDER[(currentIndex + 1) % STATUS_ORDER.length]
    statusMutation.mutate(nextStatus)
  }

  const handleDelete = () => {
    deleteMutation.mutate(undefined, {
      onSuccess: () => setConfirmOpen(false),
    })
  }

  return (
    <Card
      ref={setNodeRef}
      style={style}
      className={isDragging ? "opacity-50" : ""}
    >
      <CardContent className="flex items-start gap-2 p-3">
        {canEdit && (
          <button
            type="button"
            className="mt-0.5 shrink-0 cursor-grab touch-none text-muted-foreground hover:text-foreground active:cursor-grabbing"
            {...attributes}
            {...listeners}
          >
            <GripVertical className="size-4" />
          </button>
        )}

        <div className="min-w-0 flex-1 space-y-1.5">
          <p className="text-sm font-medium text-foreground">{task.description}</p>
          <div className="flex flex-wrap items-center gap-1.5">
            <Badge variant="outline" className="text-xs">
              {task.category}
            </Badge>
            <button
              type="button"
              onClick={cycleStatus}
              disabled={!canUpdateStatus || statusMutation.isPending}
              className={canUpdateStatus ? "cursor-pointer" : "cursor-default"}
            >
              <Badge className={`text-xs border-0 ${STATUS_COLORS[task.status]} `}>
                {STATUS_LABELS[task.status]}
              </Badge>
            </button>
            {assignee && (
              <span className="text-xs text-muted-foreground">
                {assignee.full_name || assignee.email}
              </span>
            )}
          </div>
        </div>

        {canEdit && (
          <div className="flex shrink-0 gap-0.5">
            <Button variant="ghost" size="icon-sm" aria-label="Edit task" onClick={onEdit}>
              <Pencil />
            </Button>
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label="Delete task"
              onClick={() => setConfirmOpen(true)}
              disabled={deleteMutation.isPending}
            >
              <Trash2 />
            </Button>
          </div>
        )}
      </CardContent>
      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title="Delete task?"
        description={`"${task.description}" will be permanently deleted.`}
        onConfirm={handleDelete}
        loading={deleteMutation.isPending}
      />
    </Card>
  )
}
