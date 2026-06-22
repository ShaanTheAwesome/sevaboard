import { useDroppable } from "@dnd-kit/core"
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { TaskCard } from "./TaskCard"
import type { PlanningTask, Profile } from "@/types"

interface WeekColumnProps {
  weekNumber: number
  tasks: PlanningTask[]
  profiles: Profile[]
  canEdit: boolean
  currentUserId: string | undefined
  isCurrent: boolean
  onEditTask: (task: PlanningTask) => void
}

export function WeekColumn({
  weekNumber,
  tasks,
  profiles,
  canEdit,
  currentUserId,
  isCurrent,
  onEditTask,
}: WeekColumnProps) {
  const { setNodeRef, isOver } = useDroppable({ id: `week-${weekNumber}` })
  const taskIds = tasks.map((t) => t.id)

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "flex w-64 shrink-0 flex-col rounded-lg border border-border bg-card/50 transition-colors",
        isOver && "border-saffron/50 bg-saffron/5"
      )}
    >
      <div className={cn(
        "flex items-center justify-between border-b px-3 py-2",
        isCurrent ? "border-saffron/30 bg-saffron/10" : "border-border"
      )}>
        <div className="flex items-center gap-1.5">
          <h3 className="text-sm font-semibold text-foreground">
            {weekNumber === 0 ? "Event Week" : `Week ${weekNumber}`}
          </h3>
          {isCurrent && (
            <Badge className="border-0 bg-saffron/20 text-saffron text-[10px] px-1.5 py-0">
              Now
            </Badge>
          )}
        </div>
        <span className="text-xs text-muted-foreground">
          {tasks.length} {tasks.length === 1 ? "task" : "tasks"}
        </span>
      </div>
      <div className="flex flex-1 flex-col gap-2 overflow-y-auto p-2">
        <SortableContext items={taskIds} strategy={verticalListSortingStrategy}>
          {tasks.map((task) => {
            const assignee = profiles.find((p) => p.id === task.assigned_to)
            const canUpdateStatus =
              canEdit || (!!currentUserId && task.assigned_to === currentUserId)
            return (
              <TaskCard
                key={task.id}
                task={task}
                assignee={assignee}
                canEdit={canEdit}
                canUpdateStatus={canUpdateStatus}
                onEdit={() => onEditTask(task)}
              />
            )
          })}
        </SortableContext>
        {tasks.length === 0 && (
          <p className="py-8 text-center text-xs text-muted-foreground">No tasks</p>
        )}
      </div>
    </div>
  )
}
