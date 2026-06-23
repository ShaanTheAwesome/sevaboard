import {
  LayoutDashboard,
  Music,
  ListChecks,
  Megaphone,
  HandHeart,
  DollarSign,
  Handshake,
  MapPin,
  Users,
  type LucideIcon,
} from "lucide-react"

export interface NavItem {
  label: string
  shortLabel?: string
  to: string
  icon: LucideIcon
  description: string
  requiresAuth?: boolean
}

export const NAV_ITEMS: NavItem[] = [
  {
    label: "Dashboard",
    to: "/",
    icon: LayoutDashboard,
    description: "Event overview and countdown",
  },
  {
    label: "Program Planner",
    to: "/program-planner",
    icon: Music,
    description: "Schedule activities across rooms",
  },
  {
    label: "Planning Timeline",
    to: "/planning-timeline",
    icon: ListChecks,
    description: "Week-by-week prep tasks",
  },
  {
    label: "Marketing",
    to: "/marketing",
    icon: Megaphone,
    description: "Campaigns, deadlines, and platforms",
  },
  {
    label: "Seva Roster",
    to: "/seva-roster",
    icon: HandHeart,
    description: "Volunteer shifts and assignments",
  },
  {
    label: "Finances",
    to: "/finances",
    icon: DollarSign,
    description: "Income, expenses, and totals",
    requiresAuth: true,
  },
  {
    label: "Sponsors",
    to: "/sponsors",
    icon: Handshake,
    description: "Sponsor relationships and contributions",
  },
  {
    label: "Venue Details",
    to: "/venue-details",
    icon: MapPin,
    description: "Location, parking, and event info",
  },
  {
    label: "Team & Roles",
    to: "/team",
    icon: Users,
    description: "Members, departments, and roles",
    requiresAuth: true,
  },
]

export const BOTTOM_NAV_PRIMARY_PATHS = ["/", "/program-planner", "/planning-timeline", "/seva-roster"]

export const BOTTOM_NAV_PRIMARY = NAV_ITEMS.filter((item) =>
  BOTTOM_NAV_PRIMARY_PATHS.includes(item.to)
)

export const BOTTOM_NAV_MORE = NAV_ITEMS.filter(
  (item) => !BOTTOM_NAV_PRIMARY_PATHS.includes(item.to)
)
