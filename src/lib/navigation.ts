import {
  LayoutDashboard,
  Music,
  ListChecks,
  Palette,
  HandHeart,
  Wallet,
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
    label: "Design List",
    to: "/design-list",
    icon: Palette,
    description: "Posters and social media designs",
  },
  {
    label: "Seva Roster",
    to: "/seva-roster",
    icon: HandHeart,
    description: "Volunteer shifts and assignments",
  },
  {
    label: "Budget & Spending",
    shortLabel: "Budget",
    to: "/budget",
    icon: Wallet,
    description: "Income, expenses, and totals",
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
  },
]

export const BOTTOM_NAV_PRIMARY_PATHS = ["/", "/program-planner", "/planning-timeline", "/budget"]

export const BOTTOM_NAV_PRIMARY = NAV_ITEMS.filter((item) =>
  BOTTOM_NAV_PRIMARY_PATHS.includes(item.to)
)

export const BOTTOM_NAV_MORE = NAV_ITEMS.filter(
  (item) => !BOTTOM_NAV_PRIMARY_PATHS.includes(item.to)
)
