export const SPONSOR_COLORS = [
  { value: "blue",    label: "Blue",   dot: "bg-blue-500",    badge: "bg-blue-500/20 text-blue-400 border-blue-500/30" },
  { value: "purple",  label: "Purple", dot: "bg-purple-500",  badge: "bg-purple-500/20 text-purple-400 border-purple-500/30" },
  { value: "emerald", label: "Green",  dot: "bg-emerald-500", badge: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30" },
  { value: "amber",   label: "Amber",  dot: "bg-amber-500",   badge: "bg-amber-500/20 text-amber-400 border-amber-500/30" },
  { value: "rose",    label: "Rose",   dot: "bg-rose-500",    badge: "bg-rose-500/20 text-rose-400 border-rose-500/30" },
  { value: "cyan",    label: "Cyan",   dot: "bg-cyan-500",    badge: "bg-cyan-500/20 text-cyan-400 border-cyan-500/30" },
]

export function fallbackCategoryColor(category: string): string {
  let hash = 0
  for (const ch of category) hash = (hash * 31 + ch.charCodeAt(0)) & 0xffff
  return SPONSOR_COLORS[hash % SPONSOR_COLORS.length].badge
}
