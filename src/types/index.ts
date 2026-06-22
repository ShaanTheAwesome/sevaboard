import type { Database, UserRole, TaskStatus } from "./database"

export type {
  UserRole,
  TaskStatus,
  DesignStatus,
  DesignPlatform,
  BudgetType,
} from "./database"

export type Department = Database["public"]["Tables"]["departments"]["Row"]
export type Profile = Database["public"]["Tables"]["profiles"]["Row"]
export type Room = Database["public"]["Tables"]["rooms"]["Row"]
export type ProgramItem = Database["public"]["Tables"]["program_items"]["Row"]
export type RoomNote = Database["public"]["Tables"]["room_notes"]["Row"]
export type PlanningTask = Database["public"]["Tables"]["planning_tasks"]["Row"]
export type DesignItem = Database["public"]["Tables"]["design_items"]["Row"]
export type RosterEntry = Database["public"]["Tables"]["roster_entries"]["Row"]
export type BudgetEntry = Database["public"]["Tables"]["budget_entries"]["Row"]
export type VenueDetails = Database["public"]["Tables"]["venue_details"]["Row"]

export const ROLE_LABELS: Record<UserRole, string> = {
  admin: "Admin",
  team_lead: "Team Lead",
  member: "Member",
  volunteer: "Volunteer",
}

export const ASSIGNABLE_ROLES: { value: UserRole; label: string }[] = [
  { value: "admin", label: "Admin" },
  { value: "team_lead", label: "Team Lead" },
]

export const STATUS_LABELS: Record<TaskStatus, string> = {
  not_started: "Not Started",
  in_progress: "In Progress",
  done: "Done",
}
