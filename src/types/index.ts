import type { Database, UserRole, TaskStatus, MarketingStatus } from "./database"

export type {
  UserRole,
  TaskStatus,
  DesignStatus,
  DesignPlatform,
  BudgetType,
  MarketingPlatform,
  MarketingStatus,
  SponsorStatus,
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
export type MarketingItem = Database["public"]["Tables"]["marketing_items"]["Row"]
export type Sponsor = Database["public"]["Tables"]["sponsors"]["Row"]
export type SponsorCategory = Database["public"]["Tables"]["sponsor_categories"]["Row"]

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

export const MARKETING_STATUS_LABELS: Record<MarketingStatus, string> = {
  not_started: "Not Started",
  in_progress: "In Progress",
  done: "Done",
}

export const MARKETING_PLATFORM_LABELS: Record<import("./database").MarketingPlatform, string> = {
  social_media: "Social Media",
  print: "Print",
  banner: "Banner",
  video: "Video",
  website: "Website",
  other: "Other",
}

export const SPONSOR_STATUS_LABELS: Record<import("./database").SponsorStatus, string> = {
  lead: "Lead",
  pending: "Pending",
  confirmed: "Confirmed",
  received: "Received",
}
