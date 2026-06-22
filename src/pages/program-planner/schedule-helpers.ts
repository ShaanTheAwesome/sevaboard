export const SCHEDULE_START = 14 * 60 // 2:00 PM
export const SCHEDULE_END = 18 * 60   // 6:00 PM
export const SLOT_MINUTES = 15
export const SLOT_HEIGHT = 52
export const TOTAL_SLOTS = (SCHEDULE_END - SCHEDULE_START) / SLOT_MINUTES

export const TIME_SLOTS = Array.from(
  { length: TOTAL_SLOTS },
  (_, i) => SCHEDULE_START + i * SLOT_MINUTES
)

export function minutesToTime(minutes: number): string {
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`
}

export function timeToMinutes(timeStr: string): number {
  const [h, m] = timeStr.split(":").map(Number)
  return h * 60 + m
}

export function formatTime(minutes: number): string {
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  const h12 = h > 12 ? h - 12 : h === 0 ? 12 : h
  const period = h >= 12 ? "PM" : "AM"
  return `${h12}:${String(m).padStart(2, "0")} ${period}`
}

export const ROOM_COLORS: Record<string, { bg: string; header: string; event: string }> = {
  blue:    { bg: "bg-blue-500/5",    header: "bg-blue-500/15",    event: "bg-blue-500/20 border-blue-500/30 hover:bg-blue-500/30" },
  purple:  { bg: "bg-purple-500/5",  header: "bg-purple-500/15",  event: "bg-purple-500/20 border-purple-500/30 hover:bg-purple-500/30" },
  emerald: { bg: "bg-emerald-500/5", header: "bg-emerald-500/15", event: "bg-emerald-500/20 border-emerald-500/30 hover:bg-emerald-500/30" },
  amber:   { bg: "bg-amber-500/5",   header: "bg-amber-500/15",   event: "bg-amber-500/20 border-amber-500/30 hover:bg-amber-500/30" },
  rose:    { bg: "bg-rose-500/5",    header: "bg-rose-500/15",    event: "bg-rose-500/20 border-rose-500/30 hover:bg-rose-500/30" },
  cyan:    { bg: "bg-cyan-500/5",    header: "bg-cyan-500/15",    event: "bg-cyan-500/20 border-cyan-500/30 hover:bg-cyan-500/30" },
}
