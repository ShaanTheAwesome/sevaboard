import { useMemo } from "react"
import { Link } from "react-router-dom"
import { differenceInCalendarDays } from "date-fns"
import { ArrowRight, Circle, Clock, CheckCircle2 } from "lucide-react"
import { usePlanningTasks } from "@/hooks/usePlanningTasks"
import { useVenueDetails } from "@/hooks/useVenueDetails"
import { useProfiles } from "@/hooks/useProfiles"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { STATUS_LABELS } from "@/types"
import type { TaskStatus } from "@/types"

const STATUS_ICON: Record<TaskStatus, typeof Circle> = {
  not_started: Circle,
  in_progress: Clock,
  done: CheckCircle2,
}

const STATUS_COLOR: Record<TaskStatus, string> = {
  not_started: "text-muted-foreground",
  in_progress: "text-saffron",
  done: "text-emerald-500",
}

export function UpcomingTasks() {
  const { data: tasks } = usePlanningTasks()
  const { data: venueDetails } = useVenueDetails()
  const { data: profiles } = useProfiles()

  const currentWeek = useMemo(() => {
    if (!venueDetails?.event_date) return 16
    const daysLeft = differenceInCalendarDays(
      new Date(venueDetails.event_date),
      new Date()
    )
    if (daysLeft <= 0) return 0
    return Math.min(16, Math.floor(daysLeft / 7))
  }, [venueDetails])

  const upcomingTasks = useMemo(() => {
    if (!tasks) return []
    return tasks
      .filter((t) => t.week_number === currentWeek && t.status !== "done")
      .slice(0, 5)
  }, [tasks, currentWeek])

  if (!tasks || upcomingTasks.length === 0) return null

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Upcoming Tasks</CardTitle>
            <CardDescription>
              Due this week (Week {currentWeek})
            </CardDescription>
          </div>
          <Link to="/planning-timeline">
            <Button variant="ghost" size="sm">
              View all
              <ArrowRight />
            </Button>
          </Link>
        </div>
      </CardHeader>
      <CardContent>
        <ul className="space-y-2">
          {upcomingTasks.map((task) => {
            const Icon = STATUS_ICON[task.status]
            const assignee = profiles?.find((p) => p.id === task.assigned_to)
            return (
              <li key={task.id} className="flex items-start gap-2.5">
                <Icon className={`mt-0.5 size-4 shrink-0 ${STATUS_COLOR[task.status]}`} />
                <div className="min-w-0 flex-1">
                  <p className="text-sm text-foreground">{task.description}</p>
                  <div className="mt-0.5 flex flex-wrap items-center gap-1.5">
                    <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                      {task.category}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {STATUS_LABELS[task.status]}
                    </span>
                    {assignee && (
                      <span className="text-xs text-muted-foreground">
                        · {assignee.full_name || assignee.email}
                      </span>
                    )}
                  </div>
                </div>
              </li>
            )
          })}
        </ul>
      </CardContent>
    </Card>
  )
}
