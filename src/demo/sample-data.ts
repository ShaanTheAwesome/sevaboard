import type {
  Profile,
  Department,
  Room,
  ProgramItem,
  PlanningTask,
  BudgetEntry,
  MarketingItem,
  Sponsor,
  SponsorCategory,
  RosterEntry,
  VenueDetails,
  VenuePhoto,
} from "@/types"

const now = new Date().toISOString()

export const DEMO_PROFILES: Profile[] = [
  { id: "d1", full_name: "Arjun Patel", email: "arjun@example.com", role: "admin", department_id: "dept1", phone: "0412 345 678", created_at: now, updated_at: now },
  { id: "d2", full_name: "Priya Sharma", email: "priya@example.com", role: "team_lead", department_id: "dept2", phone: "0423 456 789", created_at: now, updated_at: now },
  { id: "d3", full_name: "Rahul Gupta", email: "rahul@example.com", role: "team_lead", department_id: "dept3", phone: "0434 567 890", created_at: now, updated_at: now },
  { id: "d4", full_name: "Ananya Reddy", email: "ananya@example.com", role: "team_lead", department_id: "dept4", phone: null, created_at: now, updated_at: now },
  { id: "d5", full_name: "Vikram Singh", email: "vikram@example.com", role: "team_lead", department_id: "dept5", phone: "0456 789 012", created_at: now, updated_at: now },
]

export const DEMO_DEPARTMENTS: Department[] = [
  { id: "dept1", name: "Program", description: "Stage program and activity scheduling", lead_id: "d1", created_at: now },
  { id: "dept2", name: "Marketing", description: "Promotion, outreach, and social media", lead_id: "d2", created_at: now },
  { id: "dept3", name: "Seva", description: "Volunteer coordination and shifts", lead_id: "d3", created_at: now },
  { id: "dept4", name: "Hospitality", description: "Food, prasad, and guest comfort", lead_id: "d4", created_at: now },
  { id: "dept5", name: "Logistics", description: "Venue setup, equipment, and operations", lead_id: "d5", created_at: now },
]

export const DEMO_ROOMS: Room[] = [
  { id: "r1", name: "High Energy", sort_order: 0, columns: ["Event", "Stage"], color: "blue" },
  { id: "r2", name: "CM Room + Bhakti", sort_order: 1, columns: ["Half 1", "Half 2"], color: "purple" },
  { id: "r3", name: "Corridor Area", sort_order: 2, columns: ["Event"], color: "emerald" },
  { id: "r4", name: "Foyer", sort_order: 3, columns: ["Event"], color: "amber" },
]

export const DEMO_PROGRAM_ITEMS: ProgramItem[] = [
  { id: "pi1", room_id: "r1", start_time: "14:00", end_time: "15:30", activity_name: "Family Carnival", description: "Games, face painting, and activities for all ages", assigned_to: "d1", column_name: "Event", sort_order: 0, created_at: now, updated_at: now },
  { id: "pi2", room_id: "r1", start_time: "14:00", end_time: "14:30", activity_name: "Sound Check", description: null, assigned_to: "d5", column_name: "Stage", sort_order: 0, created_at: now, updated_at: now },
  { id: "pi3", room_id: "r1", start_time: "15:30", end_time: "16:30", activity_name: "Cultural Performances", description: "Dance and music performances", assigned_to: "d1", column_name: "Event", sort_order: 1, created_at: now, updated_at: now },
  { id: "pi4", room_id: "r1", start_time: "16:30", end_time: "17:30", activity_name: "Kirtan", description: "Devotional singing and chanting", assigned_to: null, column_name: "Event", sort_order: 2, created_at: now, updated_at: now },
  { id: "pi5", room_id: "r2", start_time: "14:00", end_time: "15:00", activity_name: "Kids Workshop", description: "Craft activities for children", assigned_to: "d4", column_name: "Half 1", sort_order: 0, created_at: now, updated_at: now },
  { id: "pi6", room_id: "r2", start_time: "14:00", end_time: "15:30", activity_name: "Meditation Session", description: "Guided meditation and yoga", assigned_to: "d3", column_name: "Half 2", sort_order: 0, created_at: now, updated_at: now },
  { id: "pi7", room_id: "r2", start_time: "15:30", end_time: "17:00", activity_name: "Bhajan Sandhya", description: "Evening devotional songs", assigned_to: null, column_name: "Half 1", sort_order: 1, created_at: now, updated_at: now },
  { id: "pi8", room_id: "r3", start_time: "14:00", end_time: "17:30", activity_name: "Photo Exhibition", description: "Displays of past Janmashtami celebrations", assigned_to: "d2", column_name: "Event", sort_order: 0, created_at: now, updated_at: now },
  { id: "pi9", room_id: "r4", start_time: "14:00", end_time: "14:30", activity_name: "Registration", description: "Guest check-in and welcome packs", assigned_to: "d3", column_name: "Event", sort_order: 0, created_at: now, updated_at: now },
  { id: "pi10", room_id: "r4", start_time: "14:30", end_time: "17:30", activity_name: "Information Desk", description: "Directions, schedule handouts, lost & found", assigned_to: null, column_name: "Event", sort_order: 1, created_at: now, updated_at: now },
]

export const DEMO_PLANNING_TASKS: PlanningTask[] = [
  { id: "pt1", category: "Marketing", description: "Finalise Instagram event poster", week_number: 12, assigned_to: "d2", status: "done", created_at: now, updated_at: now },
  { id: "pt2", category: "Marketing", description: "Print flyers for distribution", week_number: 10, assigned_to: "d2", status: "done", created_at: now, updated_at: now },
  { id: "pt3", category: "Logistics", description: "Confirm venue booking and deposit", week_number: 14, assigned_to: "d5", status: "done", created_at: now, updated_at: now },
  { id: "pt4", category: "Logistics", description: "Arrange sound system hire", week_number: 8, assigned_to: "d5", status: "in_progress", created_at: now, updated_at: now },
  { id: "pt5", category: "Logistics", description: "Order stage decorations", week_number: 6, assigned_to: "d5", status: "not_started", created_at: now, updated_at: now },
  { id: "pt6", category: "Program", description: "Confirm cultural performance lineup", week_number: 8, assigned_to: "d1", status: "in_progress", created_at: now, updated_at: now },
  { id: "pt7", category: "Program", description: "Prepare MC script and run sheet", week_number: 4, assigned_to: "d1", status: "not_started", created_at: now, updated_at: now },
  { id: "pt8", category: "Hospitality", description: "Finalise prasad menu with caterer", week_number: 6, assigned_to: "d4", status: "in_progress", created_at: now, updated_at: now },
  { id: "pt9", category: "Hospitality", description: "Order disposable plates and cups", week_number: 4, assigned_to: "d4", status: "not_started", created_at: now, updated_at: now },
  { id: "pt10", category: "Seva", description: "Create volunteer sign-up form", week_number: 10, assigned_to: "d3", status: "done", created_at: now, updated_at: now },
  { id: "pt11", category: "Seva", description: "Assign volunteer shift roster", week_number: 4, assigned_to: "d3", status: "not_started", created_at: now, updated_at: now },
  { id: "pt12", category: "Marketing", description: "Send reminder emails to attendees", week_number: 2, assigned_to: "d2", status: "not_started", created_at: now, updated_at: now },
  { id: "pt13", category: "Logistics", description: "Coordinate parking and signage", week_number: 2, assigned_to: "d5", status: "not_started", created_at: now, updated_at: now },
  { id: "pt14", category: "Program", description: "Final rehearsal with all performers", week_number: 1, assigned_to: "d1", status: "not_started", created_at: now, updated_at: now },
]

export const DEMO_BUDGET_ENTRIES: BudgetEntry[] = [
  { id: "be1", item: "Venue hire", category: "Venue", amount: 2500, forecasted_amount: 2500, entry_date: "2026-05-15", notes: "Community hall booking for full day", type: "expense", created_by: "d1", created_at: now, updated_at: now },
  { id: "be2", item: "Sound system", category: "Equipment", amount: 800, forecasted_amount: null, entry_date: "2026-06-01", notes: "PA system + 2 wireless mics", type: "expense", created_by: "d5", created_at: now, updated_at: now },
  { id: "be3", item: "Flyer printing", category: "Marketing", amount: 150, forecasted_amount: null, entry_date: "2026-06-10", notes: "500 colour flyers", type: "expense", created_by: "d2", created_at: now, updated_at: now },
  { id: "be4", item: "Prasad catering", category: "Food", amount: null, forecasted_amount: 800, entry_date: "2026-06-20", notes: "Awaiting final quote from caterer", type: "expense", created_by: "d4", created_at: now, updated_at: now },
  { id: "be5", item: "Stage decorations", category: "Decorations", amount: 350, forecasted_amount: null, entry_date: "2026-06-15", notes: null, type: "expense", created_by: "d5", created_at: now, updated_at: now },
  { id: "be6", item: "Community fund allocation", category: "Community", amount: 3000, forecasted_amount: null, entry_date: "2026-04-01", notes: "Annual event budget from the temple committee", type: "income", created_by: "d1", created_at: now, updated_at: now },
  { id: "be7", item: "ABC Sweets sponsorship", category: "Sponsorship", amount: 500, forecasted_amount: null, entry_date: "2026-06-05", notes: null, type: "income", created_by: "d1", created_at: now, updated_at: now },
  { id: "be8", item: "Gold class donation", category: "Donation", amount: 200, forecasted_amount: null, entry_date: "2026-06-18", notes: null, type: "income", created_by: "d1", created_at: now, updated_at: now },
]

export const DEMO_MARKETING_ITEMS: MarketingItem[] = [
  { id: "mi1", title: "Instagram event poster", description: "Main promotional poster for the event page", platform: "social_media", deadline: "2026-06-01", status: "done", assigned_to: "d2", notes: null, created_at: now, updated_at: now },
  { id: "mi2", title: "Facebook event page", description: "Create and publish the Facebook event", platform: "social_media", deadline: "2026-06-05", status: "done", assigned_to: "d2", notes: null, created_at: now, updated_at: now },
  { id: "mi3", title: "Printed flyers", description: "500 colour flyers for local distribution", platform: "print", deadline: "2026-06-15", status: "in_progress", assigned_to: "d2", notes: "Pickup from printer on the 14th", created_at: now, updated_at: now },
  { id: "mi4", title: "Event banner for entrance", description: "Large pull-up banner for the venue foyer", platform: "banner", deadline: "2026-07-10", status: "not_started", assigned_to: "d2", notes: null, created_at: now, updated_at: now },
  { id: "mi5", title: "Reminder email blast", description: "Send to mailing list 1 week before event", platform: "website", deadline: "2026-07-20", status: "not_started", assigned_to: "d2", notes: null, created_at: now, updated_at: now },
  { id: "mi6", title: "Event teaser video", description: "30-second promo video for Instagram Reels", platform: "video", deadline: "2026-07-01", status: "not_started", assigned_to: null, notes: "Need someone with video editing skills", created_at: now, updated_at: now },
]

export const DEMO_SPONSOR_CATEGORIES: SponsorCategory[] = [
  { id: "sc1", name: "Food", color: "amber", created_at: now },
  { id: "sc2", name: "Decorations", color: "emerald", created_at: now },
  { id: "sc3", name: "General", color: "blue", created_at: now },
]

export const DEMO_SPONSORS: Sponsor[] = [
  { id: "sp1", company_name: "ABC Sweets", category: "Food", contact_name: "Raj Kumar", contact_phone: "0412 111 222", amount: 500, status: "received", person_responsible: "Arjun Patel", notes: "Providing sweets for prasad + cash sponsorship", created_by: "d1", created_at: now, updated_at: now },
  { id: "sp2", company_name: "Sharma Textiles", category: "Decorations", contact_name: "Meera Sharma", contact_phone: "0423 222 333", amount: 300, status: "confirmed", person_responsible: "Priya Sharma", notes: "Donating fabric for stage decoration", created_by: "d1", created_at: now, updated_at: now },
  { id: "sp3", company_name: "Patel & Sons", category: "General", contact_name: "Amit Patel", contact_phone: null, amount: null, status: "pending", person_responsible: "Arjun Patel", notes: "Interested, waiting on board approval", created_by: "d1", created_at: now, updated_at: now },
  { id: "sp4", company_name: "Sunrise Grocers", category: "Food", contact_name: null, contact_phone: "0445 444 555", amount: null, status: "lead", person_responsible: null, notes: "Initial contact made, need to follow up", created_by: "d1", created_at: now, updated_at: now },
]

export const DEMO_ROSTER_ENTRIES: RosterEntry[] = [
  { id: "re1", person_id: null, person_name: "Rahul Gupta", seva_role: "Registration Desk", time_slot: "13:30-14:30", location: "Foyer", notes: null, created_at: now, updated_at: now },
  { id: "re2", person_id: null, person_name: "Ananya Reddy", seva_role: "Kitchen Lead", time_slot: "12:00-18:00", location: "Kitchen", notes: "Coordinating prasad prep and serving", created_at: now, updated_at: now },
  { id: "re3", person_id: null, person_name: "Vikram Singh", seva_role: "Stage Manager", time_slot: "13:00-18:00", location: "High Energy Room", notes: null, created_at: now, updated_at: now },
  { id: "re4", person_id: null, person_name: "Priya Sharma", seva_role: "MC / Host", time_slot: "14:00-17:30", location: "High Energy Room", notes: null, created_at: now, updated_at: now },
  { id: "re5", person_id: null, person_name: "Neha Kapoor", seva_role: "Kids Activity Lead", time_slot: "14:00-16:00", location: "CM Room + Bhakti", notes: "Running the craft workshop", created_at: now, updated_at: now },
  { id: "re6", person_id: null, person_name: "Dev Nair", seva_role: "Parking Marshal", time_slot: "13:00-15:00", location: "Car Park", notes: null, created_at: now, updated_at: now },
  { id: "re7", person_id: null, person_name: "Sita Menon", seva_role: "Parking Marshal", time_slot: "15:00-17:00", location: "Car Park", notes: "Shift handover from Dev", created_at: now, updated_at: now },
  { id: "re8", person_id: null, person_name: "Amit Joshi", seva_role: "Photography", time_slot: "14:00-17:30", location: "All Areas", notes: "Event photographer — roaming", created_at: now, updated_at: now },
]

export const DEMO_VENUE_DETAILS: VenueDetails = {
  id: 1,
  venue_name: "Shri Krishna Community Hall",
  address: "42 Temple Road\nParramatta NSW 2150",
  event_date: "2026-08-14",
  event_time: "14:00",
  map_link: "https://maps.google.com",
  parking_notes: "Free parking available in the rear car park (enter via Lane St). Overflow parking at Westfield across the road.",
  other_notes: "Shoes off at the entrance. Wheelchair accessible via the side ramp.",
  updated_by: "d1",
  updated_at: now,
}

export const DEMO_VENUE_PHOTOS: VenuePhoto[] = [
  { id: "vp1", label: "High Energy Room", image_path: "https://placehold.co/640x360/1e293b/f5f3ee?text=High+Energy+Room", sort_order: 0, created_by: "d1", created_at: now },
  { id: "vp2", label: "CM Room + Bhakti", image_path: "https://placehold.co/640x360/1e293b/f5f3ee?text=CM+Room+%2B+Bhakti", sort_order: 1, created_by: "d1", created_at: now },
  { id: "vp3", label: "Corridor Area", image_path: "https://placehold.co/640x360/1e293b/f5f3ee?text=Corridor+Area", sort_order: 2, created_by: "d1", created_at: now },
]
