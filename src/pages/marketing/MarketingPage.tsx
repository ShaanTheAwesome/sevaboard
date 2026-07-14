import { useMemo, useState } from "react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { format, isPast, parseISO } from "date-fns"
import { toast } from "sonner"
import { ExternalLink, Megaphone, Pencil, Plus, Trash2 } from "lucide-react"
import { supabase } from "@/lib/supabase"
import { cn } from "@/lib/utils"
import { useAuth } from "@/hooks/useAuth"
import { useMarketingItems } from "@/hooks/useMarketingItems"
import { useProfiles } from "@/hooks/useProfiles"
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
import { MARKETING_PLATFORM_LABELS, MARKETING_STATUS_LABELS } from "@/types"
import type { MarketingItem, MarketingStatus } from "@/types"
import { MarketingFormSheet } from "./MarketingFormSheet"

const MARKETING_SITE_URL = "https://kj2026-theta.vercel.app/"

const ALL = "all"

function MarketingSiteBanner() {
  return (
    <a
      href={MARKETING_SITE_URL}
      target="_blank"
      rel="noreferrer"
      className="mb-4 flex flex-col items-start justify-between gap-3 rounded-lg border border-saffron/30 bg-saffron/10 p-4 transition-colors hover:bg-saffron/15 sm:flex-row sm:items-center"
    >
      <div className="flex items-center gap-3">
        <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-saffron/20">
          <Megaphone className="size-5 text-saffron" />
        </div>
        <div>
          <p className="text-sm font-semibold text-foreground">
            All marketing enquiries are on our dedicated campaign site
          </p>
          <p className="text-xs text-muted-foreground">
            Click here to take a look — {MARKETING_SITE_URL}
          </p>
        </div>
      </div>
      <span className="inline-flex shrink-0 items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground">
        Visit site
        <ExternalLink className="size-3.5" />
      </span>
    </a>
  )
}

const STATUS_COLORS: Record<MarketingStatus, string> = {
  not_started: "bg-muted text-muted-foreground",
  in_progress: "bg-saffron/20 text-saffron",
  done: "bg-emerald-500/20 text-emerald-500",
}

const STATUS_FILTER_ITEMS = [
  { value: ALL, label: "All statuses" },
  ...Object.entries(MARKETING_STATUS_LABELS).map(([v, l]) => ({ value: v, label: l })),
]

const PLATFORM_FILTER_ITEMS = [
  { value: ALL, label: "All platforms" },
  ...Object.entries(MARKETING_PLATFORM_LABELS).map(([v, l]) => ({ value: v, label: l })),
]

function MarketingCard({
  item,
  assigneeName,
  canEdit,
  onEdit,
}: {
  item: MarketingItem
  assigneeName: string | undefined
  canEdit: boolean
  onEdit: () => void
}) {
  const [confirmOpen, setConfirmOpen] = useState(false)
  const queryClient = useQueryClient()

  const deleteMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("marketing_items").delete().eq("id", item.id)
      if (error) throw error
    },
    onSuccess: () => {
      setConfirmOpen(false)
      queryClient.invalidateQueries({ queryKey: ["marketing_items"] })
      toast.success("Activity deleted")
    },
    onError: (error) => toast.error(error.message),
  })

  const isOverdue = item.deadline && item.status !== "done" && isPast(parseISO(item.deadline))

  return (
    <Card>
      <CardContent className="flex items-start gap-3 p-3">
        <div className="min-w-0 flex-1 space-y-1.5">
          <p className="text-sm font-medium text-foreground">{item.title}</p>
          {item.description && (
            <p className="text-xs text-muted-foreground">{item.description}</p>
          )}
          <div className="flex flex-wrap items-center gap-1.5">
            <Badge className={cn("border-0 text-xs", STATUS_COLORS[item.status])}>
              {MARKETING_STATUS_LABELS[item.status]}
            </Badge>
            {item.platform && (
              <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                {MARKETING_PLATFORM_LABELS[item.platform]}
              </Badge>
            )}
            {item.deadline && (
              <span className={cn("text-xs", isOverdue ? "font-medium text-destructive" : "text-muted-foreground")}>
                {isOverdue ? "Overdue: " : "Due "}
                {format(parseISO(item.deadline), "d MMM yyyy")}
              </span>
            )}
            {assigneeName && (
              <span className="text-xs text-muted-foreground">· {assigneeName}</span>
            )}
          </div>
          {item.notes && (
            <p className="text-xs text-muted-foreground">{item.notes}</p>
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
        title="Delete activity?"
        description={`"${item.title}" will be permanently deleted.`}
        onConfirm={() => deleteMutation.mutate()}
        loading={deleteMutation.isPending}
      />
    </Card>
  )
}

export function MarketingPage() {
  const { profile } = useAuth()
  const { data: items, isLoading: itemsLoading } = useMarketingItems()
  const { data: profiles } = useProfiles()

  const [sheetOpen, setSheetOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<MarketingItem | null>(null)
  const [sheetKey, setSheetKey] = useState(0)

  const [filterStatus, setFilterStatus] = useState(ALL)
  const [filterPlatform, setFilterPlatform] = useState(ALL)

  const canEdit = profile?.role === "admin" || profile?.role === "team_lead"

  const filtered = useMemo(() => {
    if (!items) return []
    return items.filter((i) => {
      if (filterStatus !== ALL && i.status !== filterStatus) return false
      if (filterPlatform !== ALL && i.platform !== filterPlatform) return false
      return true
    })
  }, [items, filterStatus, filterPlatform])

  const handleAdd = () => {
    setEditingItem(null)
    setSheetKey((k) => k + 1)
    setSheetOpen(true)
  }

  const handleEdit = (item: MarketingItem) => {
    setEditingItem(item)
    setSheetKey((k) => k + 1)
    setSheetOpen(true)
  }

  if (itemsLoading) {
    return (
      <div>
        <PageHeader title="Marketing" description="Campaigns, deadlines, and platforms." />
        <MarketingSiteBanner />
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
        title="Marketing"
        description="Campaigns, deadlines, and platforms."
        action={
          <RoleGate allow={["admin", "team_lead"]}>
            <Button onClick={handleAdd}>
              <Plus />
              Add activity
            </Button>
          </RoleGate>
        }
      />

      <MarketingSiteBanner />

      {items && items.length === 0 ? (
        <EmptyState
          icon={Megaphone}
          title="No marketing activities yet"
          description={
            canEdit
              ? "Add a marketing activity to start tracking campaigns and deadlines."
              : "Marketing activities will appear here once added."
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
            <Select value={filterPlatform} onValueChange={(v) => v && setFilterPlatform(v)} items={PLATFORM_FILTER_ITEMS}>
              <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
              <SelectContent>
                {PLATFORM_FILTER_ITEMS.map((i) => (
                  <SelectItem key={i.value} value={i.value}>{i.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {(filterStatus !== ALL || filterPlatform !== ALL) && (
              <Button variant="ghost" size="sm" onClick={() => { setFilterStatus(ALL); setFilterPlatform(ALL) }}>
                Clear filters
              </Button>
            )}
          </div>

          <div className="space-y-2">
            {filtered.map((item) => {
              const assignee = profiles?.find((p) => p.id === item.assigned_to)
              return (
                <MarketingCard
                  key={item.id}
                  item={item}
                  assigneeName={assignee?.full_name || assignee?.email || undefined}
                  canEdit={canEdit}
                  onEdit={() => handleEdit(item)}
                />
              )
            })}
            {filtered.length === 0 && items && items.length > 0 && (
              <p className="py-8 text-center text-sm text-muted-foreground">No activities match your filters.</p>
            )}
          </div>
        </>
      )}

      <MarketingFormSheet
        key={sheetKey}
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        item={editingItem}
        profiles={profiles ?? []}
      />
    </div>
  )
}
