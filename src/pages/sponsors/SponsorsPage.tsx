import { useMemo, useState } from "react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { Handshake, Pencil, Phone, Plus, Trash2, User } from "lucide-react"
import { supabase } from "@/lib/supabase"
import { cn } from "@/lib/utils"
import { useAuth } from "@/hooks/useAuth"
import { useSponsors } from "@/hooks/useSponsors"
import { useSponsorCategories } from "@/hooks/useSponsorCategories"
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
import { SPONSOR_STATUS_LABELS } from "@/types"
import type { Sponsor, SponsorStatus } from "@/types"
import { SponsorFormSheet } from "./SponsorFormSheet"
import { SPONSOR_COLORS, fallbackCategoryColor } from "./category-helpers"

const ALL = "all"

const STATUS_COLORS: Record<SponsorStatus, string> = {
  lead: "bg-muted text-muted-foreground",
  pending: "bg-saffron/20 text-saffron",
  confirmed: "bg-blue-500/20 text-blue-500",
  received: "bg-emerald-500/20 text-emerald-500",
}

const STATUS_FILTER_ITEMS = [
  { value: ALL, label: "All statuses" },
  ...Object.entries(SPONSOR_STATUS_LABELS).map(([v, l]) => ({ value: v, label: l })),
]

function SponsorCard({
  sponsor,
  canEdit,
  getCategoryColor,
  onEdit,
}: {
  sponsor: Sponsor
  canEdit: boolean
  getCategoryColor: (name: string) => string
  onEdit: () => void
}) {
  const [confirmOpen, setConfirmOpen] = useState(false)
  const queryClient = useQueryClient()

  const deleteMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("sponsors").delete().eq("id", sponsor.id)
      if (error) throw error
    },
    onSuccess: () => {
      setConfirmOpen(false)
      queryClient.invalidateQueries({ queryKey: ["sponsors"] })
      toast.success("Sponsor deleted")
    },
    onError: (error) => toast.error(error.message),
  })

  return (
    <Card>
      <CardContent className="flex items-start gap-3 p-4">
        <div className="min-w-0 flex-1 space-y-1.5">
          {/* Row 1: company name + amount */}
          <div className="flex items-baseline justify-between gap-2">
            <p className="text-sm font-semibold text-foreground">{sponsor.company_name}</p>
            {canEdit && (
              sponsor.amount != null ? (
                <p className="shrink-0 text-sm font-bold tabular-nums text-emerald-500">
                  ${Number(sponsor.amount).toLocaleString("en-AU", { minimumFractionDigits: 2 })}
                </p>
              ) : (
                <Badge className="shrink-0 border-0 bg-saffron/20 text-saffron text-xs">TBA</Badge>
              )
            )}
          </div>

          {/* Row 2: badges + person responsible */}
          <div className="flex flex-wrap items-center gap-1.5">
            <Badge className={cn("border-0 text-xs", STATUS_COLORS[sponsor.status])}>
              {SPONSOR_STATUS_LABELS[sponsor.status]}
            </Badge>
            {sponsor.category && (
              <Badge className={cn("border text-[10px] px-1.5 py-0", getCategoryColor(sponsor.category))}>
                {sponsor.category}
              </Badge>
            )}
            {sponsor.person_responsible && (
              <span className="flex items-center gap-1 text-xs text-muted-foreground">
                <User className="size-3" />
                {sponsor.person_responsible}
              </span>
            )}
          </div>

          {/* Row 3: contact details (admin only) */}
          {canEdit && (sponsor.contact_name || sponsor.contact_phone) && (
            <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
              {sponsor.contact_name && (
                <span className="flex items-center gap-1">
                  <User className="size-3" />
                  {sponsor.contact_name}
                </span>
              )}
              {sponsor.contact_phone && (
                <span className="flex items-center gap-1">
                  <Phone className="size-3" />
                  {sponsor.contact_phone}
                </span>
              )}
            </div>
          )}

          {/* Row 4: notes (admin only) */}
          {canEdit && sponsor.notes && (
            <p className="text-xs text-muted-foreground">{sponsor.notes}</p>
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
        title="Delete sponsor?"
        description={`"${sponsor.company_name}" will be permanently deleted.`}
        onConfirm={() => deleteMutation.mutate()}
        loading={deleteMutation.isPending}
      />
    </Card>
  )
}

export function SponsorsPage() {
  const { profile } = useAuth()
  const { data: sponsors, isLoading } = useSponsors()
  const { data: categories } = useSponsorCategories()

  const [sheetOpen, setSheetOpen] = useState(false)
  const [editingSponsor, setEditingSponsor] = useState<Sponsor | null>(null)
  const [sheetKey, setSheetKey] = useState(0)
  const [filterStatus, setFilterStatus] = useState(ALL)

  const canEdit = profile?.role === "admin" || profile?.role === "team_lead"

  const getCategoryColor = useMemo(() => {
    const map = new Map<string, string>()
    for (const cat of categories ?? []) {
      const entry = SPONSOR_COLORS.find((c) => c.value === cat.color)
      if (entry) map.set(cat.name, entry.badge)
    }
    return (name: string) => map.get(name) ?? fallbackCategoryColor(name)
  }, [categories])

  const filtered = useMemo(() => {
    if (!sponsors) return []
    if (filterStatus === ALL) return sponsors
    return sponsors.filter((s) => s.status === filterStatus)
  }, [sponsors, filterStatus])

  const totalConfirmed = useMemo(
    () => (sponsors ?? [])
      .filter((s) => (s.status === "confirmed" || s.status === "received") && s.amount != null)
      .reduce((sum, s) => sum + Number(s.amount), 0),
    [sponsors]
  )

  const pendingCount = useMemo(
    () => (sponsors ?? []).filter((s) => s.status === "lead" || s.status === "pending").length,
    [sponsors]
  )

  const categoryCounts = useMemo(() => {
    const counts = new Map<string, number>()
    for (const s of sponsors ?? []) {
      const cat = s.category?.trim() || "Uncategorized"
      counts.set(cat, (counts.get(cat) ?? 0) + 1)
    }
    return Array.from(counts.entries()).sort((a, b) => b[1] - a[1])
  }, [sponsors])

  const handleAdd = () => {
    setEditingSponsor(null)
    setSheetKey((k) => k + 1)
    setSheetOpen(true)
  }

  const handleEdit = (sponsor: Sponsor) => {
    setEditingSponsor(sponsor)
    setSheetKey((k) => k + 1)
    setSheetOpen(true)
  }

  if (isLoading) {
    return (
      <div>
        <PageHeader title="Sponsors" description="Sponsor relationships and contributions." />
        <div className="space-y-2">
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
        </div>
      </div>
    )
  }

  return (
    <div>
      <PageHeader
        title="Sponsors"
        description="Sponsor relationships and contributions."
        action={
          <RoleGate allow={["admin", "team_lead"]}>
            <Button onClick={handleAdd}>
              <Plus />
              Add sponsor
            </Button>
          </RoleGate>
        }
      />

      {/* Summary */}
      {sponsors && sponsors.length > 0 && (
        <div className="mb-4 space-y-2">
          <div className="flex flex-wrap gap-4 text-sm">
            <div>
              <span className="text-muted-foreground">Confirmed: </span>
              <span className="font-semibold tabular-nums text-emerald-500">
                ${totalConfirmed.toLocaleString("en-AU", { minimumFractionDigits: 2 })}
              </span>
            </div>
            {pendingCount > 0 && (
              <div>
                <span className="text-muted-foreground">Pending: </span>
                <span className="font-semibold text-saffron">{pendingCount}</span>
              </div>
            )}
            <div>
              <span className="text-muted-foreground">Total: </span>
              <span className="font-semibold">{sponsors.length}</span>
            </div>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {categoryCounts.map(([cat, count]) => (
              <span
                key={cat}
                className={cn(
                  "inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-medium",
                  getCategoryColor(cat)
                )}
              >
                {cat}
                <span className="font-bold">{count}</span>
              </span>
            ))}
          </div>
        </div>
      )}

      {sponsors && sponsors.length === 0 ? (
        <EmptyState
          icon={Handshake}
          title="No sponsors yet"
          description={
            canEdit
              ? "Add a sponsor to start tracking relationships and contributions."
              : "Sponsors will appear here once added."
          }
        />
      ) : (
        <>
          <div className="mb-4 flex flex-wrap gap-2">
            <Select value={filterStatus} onValueChange={(v) => v && setFilterStatus(v)} items={STATUS_FILTER_ITEMS}>
              <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
              <SelectContent>
                {STATUS_FILTER_ITEMS.map((i) => (
                  <SelectItem key={i.value} value={i.value}>{i.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {filterStatus !== ALL && (
              <Button variant="ghost" size="sm" onClick={() => setFilterStatus(ALL)}>
                Clear filter
              </Button>
            )}
          </div>

          <div className="space-y-2">
            {filtered.map((sponsor) => (
              <SponsorCard
                key={sponsor.id}
                sponsor={sponsor}
                canEdit={canEdit}
                getCategoryColor={getCategoryColor}
                onEdit={() => handleEdit(sponsor)}
              />
            ))}
            {filtered.length === 0 && sponsors && sponsors.length > 0 && (
              <p className="py-8 text-center text-sm text-muted-foreground">No sponsors match your filter.</p>
            )}
          </div>
        </>
      )}

      <SponsorFormSheet
        key={sheetKey}
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        sponsor={editingSponsor}
      />
    </div>
  )
}
