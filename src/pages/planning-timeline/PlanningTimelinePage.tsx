import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { differenceInCalendarDays } from "date-fns"
import { Plus } from "lucide-react"
import { supabase } from "@/lib/supabase"
import { useAuth } from "@/hooks/useAuth"
import { usePlanningTasks } from "@/hooks/usePlanningTasks"
import { useProfiles } from "@/hooks/useProfiles"
import { useVenueDetails } from "@/hooks/useVenueDetails"
import { PageHeader } from "@/components/common/PageHeader"
import { RoleGate } from "@/components/common/RoleGate"
import { EmptyState } from "@/components/common/EmptyState"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { STATUS_LABELS } from "@/types"
import type { PlanningTask } from "@/types"
import { WeekColumn } from "./WeekColumn"
import { TaskFormSheet } from "./TaskFormSheet"
import { TaskCard } from "./TaskCard"
import { ListChecks } from "lucide-react"

const ALL = "all"
const WEEKS = Array.from({ length: 17 }, (_, i) => 16 - i)



export function PlanningTimelinePage() {
  const { user, profile } = useAuth()
  const { data: tasks, isLoading: tasksLoading } = usePlanningTasks()
  const { data: profiles, isLoading: profilesLoading } = useProfiles()
  const { data: venueDetails } = useVenueDetails()
  const queryClient = useQueryClient()

  const [sheetOpen, setSheetOpen] = useState(false)
  const [editingTask, setEditingTask] = useState<PlanningTask | null>(null)
  const [sheetKey, setSheetKey] = useState(0)

  const [filterCategory, setFilterCategory] = useState(ALL)
  const [filterStatus, setFilterStatus] = useState(ALL)
  const [filterAssignee, setFilterAssignee] = useState(ALL)

  const [activeTask, setActiveTask] = useState<PlanningTask | null>(null)

  const boardRef = useRef<HTMLDivElement>(null)
  const hasScrolled = useRef(false)

  const currentWeek = useMemo(() => {
    if (!venueDetails?.event_date) return 16
    const daysLeft = differenceInCalendarDays(
      new Date(venueDetails.event_date),
      new Date()
    )
    if (daysLeft <= 0) return 0
    return Math.min(16, Math.floor(daysLeft / 7))
  }, [venueDetails])

  const canEdit =
    profile?.role === "admin" || profile?.role === "team_lead"

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 5 } })
  )

  const categories = useMemo(() => {
    if (!tasks) return []
    return [...new Set(tasks.map((t) => t.category))].sort()
  }, [tasks])

  const filteredTasks = useMemo(() => {
    if (!tasks) return []
    return tasks.filter((t) => {
      if (filterCategory !== ALL && t.category !== filterCategory) return false
      if (filterStatus !== ALL && t.status !== filterStatus) return false
      if (filterAssignee !== ALL && t.assigned_to !== filterAssignee) return false
      return true
    })
  }, [tasks, filterCategory, filterStatus, filterAssignee])

  const tasksByWeek = useMemo(() => {
    const map = new Map<number, PlanningTask[]>()
    for (const w of WEEKS) map.set(w, [])
    for (const t of filteredTasks) {
      const arr = map.get(t.week_number)
      if (arr) arr.push(t)
    }
    return map
  }, [filteredTasks])

  // Auto-scroll to the current week column
  useEffect(() => {
    if (hasScrolled.current || tasksLoading || !boardRef.current) return

    const index = WEEKS.indexOf(currentWeek)
    if (index !== -1) {
      const columnWidth = 256 + 8 // w-64 (256px) + gap-2 (8px)
      boardRef.current.scrollLeft = Math.max(0, index * columnWidth - 16)
    }

    hasScrolled.current = true
  }, [tasksLoading, currentWeek])

  const moveMutation = useMutation({
    mutationFn: async ({ taskId, newWeek }: { taskId: string; newWeek: number }) => {
      const { error } = await supabase
        .from("planning_tasks")
        .update({ week_number: newWeek })
        .eq("id", taskId)
      if (error) throw error
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["planning_tasks"] }),
    onError: (error) => toast.error(error.message),
  })

  const handleDragStart = useCallback(
    (event: DragStartEvent) => {
      const task = tasks?.find((t) => t.id === event.active.id)
      if (task) setActiveTask(task)
    },
    [tasks]
  )

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      setActiveTask(null)
      const { active, over } = event
      if (!over) return

      const overId = String(over.id)
      let targetWeek: number | null = null

      if (overId.startsWith("week-")) {
        targetWeek = Number(overId.replace("week-", ""))
      } else {
        const overTask = tasks?.find((t) => t.id === overId)
        if (overTask) targetWeek = overTask.week_number
      }

      if (targetWeek === null) return

      const draggedTask = tasks?.find((t) => t.id === active.id)
      if (!draggedTask || draggedTask.week_number === targetWeek) return

      moveMutation.mutate({ taskId: draggedTask.id, newWeek: targetWeek })
    },
    [tasks, moveMutation]
  )

  const handleAddTask = () => {
    setEditingTask(null)
    setSheetKey((k) => k + 1)
    setSheetOpen(true)
  }

  const handleEditTask = (task: PlanningTask) => {
    setEditingTask(task)
    setSheetKey((k) => k + 1)
    setSheetOpen(true)
  }

  const isLoading = tasksLoading || profilesLoading

  const categoryItems = [
    { value: ALL, label: "All categories" },
    ...categories.map((c) => ({ value: c, label: c })),
  ]

  const statusItems = [
    { value: ALL, label: "All statuses" },
    ...Object.entries(STATUS_LABELS).map(([v, l]) => ({ value: v, label: l })),
  ]

  const assigneeItems = [
    { value: ALL, label: "All assignees" },
    ...(profiles ?? []).map((p) => ({
      value: p.id,
      label: p.full_name || p.email || "Unnamed",
    })),
  ]

  const activeAssignee = activeTask
    ? profiles?.find((p) => p.id === activeTask.assigned_to)
    : undefined

  return (
    <div className="flex h-full flex-col">
      <PageHeader
        title="Planning Timeline"
        description="Week-by-week prep tasks leading up to the event."
        action={
          <RoleGate allow={["admin", "team_lead"]}>
            <Button onClick={handleAddTask}>
              <Plus />
              Add task
            </Button>
          </RoleGate>
        }
      />

      {isLoading ? (
        <div className="flex gap-2 overflow-hidden">
          {[0, 1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-64 w-64 shrink-0" />
          ))}
        </div>
      ) : tasks && tasks.length === 0 ? (
        <EmptyState
          icon={ListChecks}
          title="No tasks yet"
          description={
            canEdit
              ? "Add a task to start building your planning timeline."
              : "Tasks will appear here once a lead or admin adds them."
          }
        />
      ) : (
        <>
          <div className="mb-4 flex flex-wrap gap-2">
            <Select
              value={filterCategory}
              onValueChange={(v) => v && setFilterCategory(v)}
              items={categoryItems}
            >
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {categoryItems.map((item) => (
                  <SelectItem key={item.value} value={item.value}>
                    {item.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={filterStatus}
              onValueChange={(v) => v && setFilterStatus(v)}
              items={statusItems}
            >
              <SelectTrigger className="w-36">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {statusItems.map((item) => (
                  <SelectItem key={item.value} value={item.value}>
                    {item.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={filterAssignee}
              onValueChange={(v) => v && setFilterAssignee(v)}
              items={assigneeItems}
            >
              <SelectTrigger className="w-40">
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

            {(filterCategory !== ALL || filterStatus !== ALL || filterAssignee !== ALL) && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setFilterCategory(ALL)
                  setFilterStatus(ALL)
                  setFilterAssignee(ALL)
                }}
              >
                Clear filters
              </Button>
            )}
          </div>

          <DndContext
            sensors={sensors}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
          >
            <div
              ref={boardRef}
              className="flex flex-1 gap-2 overflow-x-auto pb-4"
            >
              {WEEKS.map((w) => (
                <WeekColumn
                  key={w}
                  weekNumber={w}
                  tasks={tasksByWeek.get(w) ?? []}
                  profiles={profiles ?? []}
                  canEdit={canEdit}
                  currentUserId={user?.id}
                  isCurrent={w === currentWeek}
                  onEditTask={handleEditTask}
                />
              ))}
            </div>

            <DragOverlay>
              {activeTask && (
                <div className="w-60">
                  <TaskCard
                    task={activeTask}
                    assignee={activeAssignee}
                    canEdit={false}
                    canUpdateStatus={false}
                    onEdit={() => {}}
                  />
                </div>
              )}
            </DragOverlay>
          </DndContext>
        </>
      )}

      <TaskFormSheet
        key={sheetKey}
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        task={editingTask}
        profiles={profiles ?? []}
        categories={categories}
      />
    </div>
  )
}
