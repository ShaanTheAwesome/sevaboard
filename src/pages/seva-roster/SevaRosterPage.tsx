import { useMemo, useState } from "react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { format } from "date-fns"
import { HandHeart, MapPin, Pencil, Plus, Trash2, Clock, User } from "lucide-react"
import { supabase } from "@/lib/supabase"
import { useAuth } from "@/hooks/useAuth"
import { useRosterEntries } from "@/hooks/useRosterEntries"
import { PageHeader } from "@/components/common/PageHeader"
import { RoleGate } from "@/components/common/RoleGate"
import { EmptyState } from "@/components/common/EmptyState"
import { ConfirmDialog } from "@/components/common/ConfirmDialog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import type { RosterEntry } from "@/types"
import { RosterFormSheet } from "./RosterFormSheet"

const ALL = "all"

function formatTimeSlot(slot: string | null): string | null {
  if (!slot) return null
  const parts = slot.split("-").map((p) => p.trim())
  const formatted = parts.map((p) => {
    const [h, m] = p.split(":").map(Number)
    if (isNaN(h) || isNaN(m)) return p
    const date = new Date()
    date.setHours(h, m, 0, 0)
    return format(date, "h:mm a")
  })
  return formatted.join(" – ")
}

function RosterCard({
  entry,
  canEdit,
  onEdit,
}: {
  entry: RosterEntry
  canEdit: boolean
  onEdit: () => void
}) {
  const [confirmOpen, setConfirmOpen] = useState(false)
  const queryClient = useQueryClient()

  const deleteMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("roster_entries").delete().eq("id", entry.id)
      if (error) throw error
    },
    onSuccess: () => {
      setConfirmOpen(false)
      queryClient.invalidateQueries({ queryKey: ["roster_entries"] })
      toast.success("Entry deleted")
    },
    onError: (error) => toast.error(error.message),
  })

  return (
    <Card>
      <CardContent className="flex items-start gap-3 p-3">
        <div className="min-w-0 flex-1 space-y-1.5">
          <div className="flex items-center gap-2">
            <p className="text-sm font-semibold text-foreground">{entry.seva_role}</p>
          </div>
          <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
            {entry.person_name && (
              <span className="flex items-center gap-1">
                <User className="size-3" />
                {entry.person_name}
              </span>
            )}
            {entry.time_slot && (
              <span className="flex items-center gap-1">
                <Clock className="size-3" />
                {formatTimeSlot(entry.time_slot)}
              </span>
            )}
            {entry.location && (
              <span className="flex items-center gap-1">
                <MapPin className="size-3" />
                {entry.location}
              </span>
            )}
          </div>
          {entry.notes && (
            <p className="text-xs text-muted-foreground">{entry.notes}</p>
          )}
        </div>

        {canEdit && (
          <div className="flex shrink-0 gap-0.5">
            <Button variant="ghost" size="icon-sm" aria-label="Edit" onClick={onEdit}>
              <Pencil />
            </Button>
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label="Delete"
              onClick={() => setConfirmOpen(true)}
              disabled={deleteMutation.isPending}
            >
              <Trash2 />
            </Button>
          </div>
        )}
      </CardContent>
      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title="Delete entry?"
        description={`"${entry.seva_role}"${entry.person_name ? ` (${entry.person_name})` : ""} will be permanently deleted.`}
        onConfirm={() => deleteMutation.mutate()}
        loading={deleteMutation.isPending}
      />
    </Card>
  )
}

export function SevaRosterPage() {
  const { profile } = useAuth()
  const { data: entries, isLoading } = useRosterEntries()

  const [sheetOpen, setSheetOpen] = useState(false)
  const [editingEntry, setEditingEntry] = useState<RosterEntry | null>(null)
  const [sheetKey, setSheetKey] = useState(0)

  const [filterRole, setFilterRole] = useState(ALL)
  const [filterLocation, setFilterLocation] = useState(ALL)

  const canEdit = profile?.role === "admin" || profile?.role === "team_lead"

  const existingRoles = useMemo(() => {
    if (!entries) return []
    return [...new Set(entries.map((e) => e.seva_role))].sort()
  }, [entries])

  const existingLocations = useMemo(() => {
    if (!entries) return []
    return [...new Set(entries.map((e) => e.location).filter(Boolean) as string[])].sort()
  }, [entries])

  const filtered = useMemo(() => {
    if (!entries) return []
    return entries.filter((e) => {
      if (filterRole !== ALL && e.seva_role !== filterRole) return false
      if (filterLocation !== ALL && e.location !== filterLocation) return false
      return true
    })
  }, [entries, filterRole, filterLocation])

  const grouped = useMemo(() => {
    const map = new Map<string, RosterEntry[]>()
    for (const e of filtered) {
      const key = e.seva_role
      const arr = map.get(key)
      if (arr) arr.push(e)
      else map.set(key, [e])
    }
    return map
  }, [filtered])

  const handleAdd = () => {
    setEditingEntry(null)
    setSheetKey((k) => k + 1)
    setSheetOpen(true)
  }

  const handleEdit = (entry: RosterEntry) => {
    setEditingEntry(entry)
    setSheetKey((k) => k + 1)
    setSheetOpen(true)
  }

  const roleFilterItems = [
    { value: ALL, label: "All roles" },
    ...existingRoles.map((r) => ({ value: r, label: r })),
  ]

  const locationFilterItems = [
    { value: ALL, label: "All locations" },
    ...existingLocations.map((l) => ({ value: l, label: l })),
  ]

  if (isLoading) {
    return (
      <div>
        <PageHeader title="Seva Roster" description="Volunteer shifts and assignments for the event." />
        <div className="space-y-2">
          <Skeleton className="h-20" />
          <Skeleton className="h-20" />
        </div>
      </div>
    )
  }

  return (
    <div>
      <PageHeader
        title="Seva Roster"
        description="Volunteer shifts and assignments for the event."
        action={
          <RoleGate allow={["admin", "team_lead"]}>
            <Button onClick={handleAdd}>
              <Plus />
              Add entry
            </Button>
          </RoleGate>
        }
      />

      {entries && entries.length === 0 ? (
        <EmptyState
          icon={HandHeart}
          title="No roster entries yet"
          description={
            canEdit
              ? "Add a roster entry to start assigning volunteer roles."
              : "Volunteer assignments will appear here once added."
          }
        />
      ) : (
        <>
          <div className="mb-4 flex flex-wrap gap-2">
            <Select value={filterRole} onValueChange={(v) => v && setFilterRole(v)} items={roleFilterItems}>
              <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
              <SelectContent>
                {roleFilterItems.map((i) => (
                  <SelectItem key={i.value} value={i.value}>{i.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={filterLocation} onValueChange={(v) => v && setFilterLocation(v)} items={locationFilterItems}>
              <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
              <SelectContent>
                {locationFilterItems.map((i) => (
                  <SelectItem key={i.value} value={i.value}>{i.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {(filterRole !== ALL || filterLocation !== ALL) && (
              <Button variant="ghost" size="sm" onClick={() => { setFilterRole(ALL); setFilterLocation(ALL) }}>
                Clear filters
              </Button>
            )}
          </div>

          <div className="space-y-6">
            {[...grouped.entries()].map(([role, roleEntries]) => (
              <div key={role}>
                <div className="mb-2 flex items-center gap-2">
                  <h3 className="text-sm font-semibold text-foreground">{role}</h3>
                  <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                    {roleEntries.length}
                  </Badge>
                </div>
                <div className="space-y-2">
                  {roleEntries.map((entry) => (
                    <RosterCard
                      key={entry.id}
                      entry={entry}
                      canEdit={canEdit}
                      onEdit={() => handleEdit(entry)}
                    />
                  ))}
                </div>
              </div>
            ))}
            {filtered.length === 0 && entries && entries.length > 0 && (
              <p className="py-8 text-center text-sm text-muted-foreground">No entries match your filters.</p>
            )}
          </div>
        </>
      )}

      <RosterFormSheet
        key={sheetKey}
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        entry={editingEntry}
        existingRoles={existingRoles}
        existingLocations={existingLocations}
      />
    </div>
  )
}
