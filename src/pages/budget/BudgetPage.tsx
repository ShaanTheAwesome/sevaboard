import { useMemo, useState } from "react"
import { Clock, DollarSign, Plus, TrendingDown, TrendingUp, Wallet } from "lucide-react"
import { useAuth } from "@/hooks/useAuth"
import { useBudgetEntries } from "@/hooks/useBudgetEntries"
import { PageHeader } from "@/components/common/PageHeader"
import { RoleGate } from "@/components/common/RoleGate"
import { EmptyState } from "@/components/common/EmptyState"
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
import { cn } from "@/lib/utils"
import type { BudgetEntry, BudgetType } from "@/types"
import { EntryCard } from "./EntryCard"
import { EntryFormSheet } from "./EntryFormSheet"

const ALL = "all"

type SortMode = "newest" | "oldest" | "highest" | "lowest"

const SORT_ITEMS = [
  { value: "newest", label: "Newest first" },
  { value: "oldest", label: "Oldest first" },
  { value: "highest", label: "Highest amount" },
  { value: "lowest", label: "Lowest amount" },
]

const TYPE_FILTER_ITEMS = [
  { value: ALL, label: "All types" },
  { value: "income", label: "Income only" },
  { value: "expense", label: "Expenses only" },
]

function sortEntries(entries: BudgetEntry[], mode: SortMode): BudgetEntry[] {
  return [...entries].sort((a, b) => {
    switch (mode) {
      case "newest":
        return b.entry_date.localeCompare(a.entry_date) || b.created_at.localeCompare(a.created_at)
      case "oldest":
        return a.entry_date.localeCompare(b.entry_date) || a.created_at.localeCompare(b.created_at)
      case "highest":
        return Number(b.amount) - Number(a.amount)
      case "lowest":
        return Number(a.amount) - Number(b.amount)
    }
  })
}

export function BudgetPage() {
  const { profile } = useAuth()
  const { data: entries, isLoading } = useBudgetEntries()

  const [sheetOpen, setSheetOpen] = useState(false)
  const [editingEntry, setEditingEntry] = useState<BudgetEntry | null>(null)
  const [sheetKey, setSheetKey] = useState(0)
  const [defaultType, setDefaultType] = useState<BudgetType>("expense")

  const [filterCategory, setFilterCategory] = useState(ALL)
  const [filterType, setFilterType] = useState(ALL)
  const [sort, setSort] = useState<SortMode>("newest")

  const canEdit = profile?.role === "admin" || profile?.role === "team_lead"

  const categories = useMemo(() => {
    if (!entries) return []
    return [...new Set(entries.map((e) => e.category))].sort()
  }, [entries])

  const filteredEntries = useMemo(() => {
    if (!entries) return []
    return entries.filter((e) => {
      if (filterCategory !== ALL && e.category !== filterCategory) return false
      if (filterType !== ALL && e.type !== filterType) return false
      return true
    })
  }, [entries, filterCategory, filterType])

  const incomeEntries = useMemo(
    () => sortEntries(filteredEntries.filter((e) => e.type === "income"), sort),
    [filteredEntries, sort]
  )

  const expenseEntries = useMemo(
    () => sortEntries(filteredEntries.filter((e) => e.type === "expense"), sort),
    [filteredEntries, sort]
  )

  const totalIncome = useMemo(
    () => (entries ?? []).filter((e) => e.type === "income" && e.amount != null).reduce((sum, e) => sum + Number(e.amount), 0),
    [entries]
  )

  const totalExpenses = useMemo(
    () => (entries ?? []).filter((e) => e.type === "expense" && e.amount != null).reduce((sum, e) => sum + Number(e.amount), 0),
    [entries]
  )

  const pendingCount = useMemo(
    () => (entries ?? []).filter((e) => e.amount == null).length,
    [entries]
  )

  const balance = totalIncome - totalExpenses

  const forecastValue = (e: BudgetEntry) => e.forecasted_amount ?? e.amount

  const hasForecasts = useMemo(
    () => (entries ?? []).some((e) => e.forecasted_amount != null),
    [entries]
  )

  const forecastedIncome = useMemo(
    () =>
      (entries ?? [])
        .filter((e) => e.type === "income" && forecastValue(e) != null)
        .reduce((sum, e) => sum + Number(forecastValue(e)), 0),
    [entries]
  )

  const forecastedExpenses = useMemo(
    () =>
      (entries ?? [])
        .filter((e) => e.type === "expense" && forecastValue(e) != null)
        .reduce((sum, e) => sum + Number(forecastValue(e)), 0),
    [entries]
  )

  const forecastedBalance = forecastedIncome - forecastedExpenses

  const handleAdd = (type: BudgetType) => {
    setEditingEntry(null)
    setDefaultType(type)
    setSheetKey((k) => k + 1)
    setSheetOpen(true)
  }

  const handleEdit = (entry: BudgetEntry) => {
    setEditingEntry(entry)
    setDefaultType(entry.type)
    setSheetKey((k) => k + 1)
    setSheetOpen(true)
  }

  const categoryItems = [
    { value: ALL, label: "All categories" },
    ...categories.map((c) => ({ value: c, label: c })),
  ]

  const formatAmount = (n: number) =>
    n.toLocaleString("en-AU", { minimumFractionDigits: 2, maximumFractionDigits: 2 })

  if (isLoading) {
    return (
      <div>
        <PageHeader title="Finances" description="Income, expenses, and totals for the event." />
        <div className="grid gap-4 sm:grid-cols-3">
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
        </div>
      </div>
    )
  }

  return (
    <div>
      <PageHeader
        title="Finances"
        description="Income, expenses, and totals for the event."
        action={
          <RoleGate allow={["admin", "team_lead"]}>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => handleAdd("income")}>
                <Plus />
                Add income
              </Button>
              <Button onClick={() => handleAdd("expense")}>
                <Plus />
                Add expense
              </Button>
            </div>
          </RoleGate>
        }
      />

      {/* Summary cards */}
      <div className={cn("mb-6 grid gap-4", pendingCount > 0 ? "sm:grid-cols-4" : "sm:grid-cols-3")}>
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <div className="flex size-10 items-center justify-center rounded-lg bg-emerald-500/10">
              <TrendingUp className="size-5 text-emerald-500" />
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Total Income</p>
              <p className="text-lg font-bold tabular-nums text-emerald-500">${formatAmount(totalIncome)}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <div className="flex size-10 items-center justify-center rounded-lg bg-destructive/10">
              <TrendingDown className="size-5 text-destructive" />
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Total Expenses</p>
              <p className="text-lg font-bold tabular-nums text-destructive">${formatAmount(totalExpenses)}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <div className={cn(
              "flex size-10 items-center justify-center rounded-lg",
              balance >= 0 ? "bg-saffron/10" : "bg-destructive/10"
            )}>
              <DollarSign className={cn("size-5", balance >= 0 ? "text-saffron" : "text-destructive")} />
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Balance</p>
              <p className={cn("text-lg font-bold tabular-nums", balance >= 0 ? "text-saffron" : "text-destructive")}>
                {balance < 0 ? "−" : ""}${formatAmount(Math.abs(balance))}
              </p>
            </div>
          </CardContent>
        </Card>
        {pendingCount > 0 && (
          <Card>
            <CardContent className="flex items-center gap-3 p-4">
              <div className="flex size-10 items-center justify-center rounded-lg bg-saffron/10">
                <Clock className="size-5 text-saffron" />
              </div>
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Pending</p>
                <p className="text-lg font-bold tabular-nums text-saffron">
                  {pendingCount} {pendingCount === 1 ? "entry" : "entries"}
                </p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {hasForecasts && (
        <div className="mb-6 grid gap-4 sm:grid-cols-3">
          <Card className="border-dashed">
            <CardContent className="flex items-center gap-3 p-4">
              <div className="flex size-10 items-center justify-center rounded-lg bg-emerald-500/10">
                <TrendingUp className="size-5 text-emerald-500/70" />
              </div>
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Forecasted Income</p>
                <p className="text-lg font-bold tabular-nums text-emerald-500/70">${formatAmount(forecastedIncome)}</p>
              </div>
            </CardContent>
          </Card>
          <Card className="border-dashed">
            <CardContent className="flex items-center gap-3 p-4">
              <div className="flex size-10 items-center justify-center rounded-lg bg-destructive/10">
                <TrendingDown className="size-5 text-destructive/70" />
              </div>
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Forecasted Expenses</p>
                <p className="text-lg font-bold tabular-nums text-destructive/70">${formatAmount(forecastedExpenses)}</p>
              </div>
            </CardContent>
          </Card>
          <Card className="border-dashed">
            <CardContent className="flex items-center gap-3 p-4">
              <div className={cn(
                "flex size-10 items-center justify-center rounded-lg",
                forecastedBalance >= 0 ? "bg-saffron/10" : "bg-destructive/10"
              )}>
                <DollarSign className={cn("size-5", forecastedBalance >= 0 ? "text-saffron/70" : "text-destructive/70")} />
              </div>
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Forecasted Balance</p>
                <p className={cn("text-lg font-bold tabular-nums", forecastedBalance >= 0 ? "text-saffron/70" : "text-destructive/70")}>
                  {forecastedBalance < 0 ? "−" : ""}${formatAmount(Math.abs(forecastedBalance))}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {entries && entries.length === 0 ? (
        <EmptyState
          icon={Wallet}
          title="No budget entries yet"
          description={
            canEdit
              ? "Add your first income or expense entry to get started."
              : "Budget entries will appear here once a lead or admin adds them."
          }
        />
      ) : (
        <>
          {/* Filters */}
          <div className="mb-4 flex flex-wrap gap-2">
            <Select
              value={filterCategory}
              onValueChange={(v) => v && setFilterCategory(v)}
              items={categoryItems}
            >
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {categoryItems.map((item) => (
                  <SelectItem key={item.value} value={item.value}>
                    {item.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={filterType}
              onValueChange={(v) => v && setFilterType(v)}
              items={TYPE_FILTER_ITEMS}
            >
              <SelectTrigger className="w-36">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {TYPE_FILTER_ITEMS.map((item) => (
                  <SelectItem key={item.value} value={item.value}>
                    {item.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={sort}
              onValueChange={(v) => v && setSort(v as SortMode)}
              items={SORT_ITEMS}
            >
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {SORT_ITEMS.map((item) => (
                  <SelectItem key={item.value} value={item.value}>
                    {item.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {(filterCategory !== ALL || filterType !== ALL) && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setFilterCategory(ALL)
                  setFilterType(ALL)
                }}
              >
                Clear filters
              </Button>
            )}
          </div>

          {/* Two-column layout */}
          <div className="grid gap-6 md:grid-cols-2">
            {/* Income column */}
            {filterType !== "expense" && (
              <div>
                <div className="mb-3 flex items-center justify-between">
                  <div>
                    <h2 className="font-heading text-base font-semibold text-foreground">Income</h2>
                    <p className="text-sm tabular-nums text-emerald-500">
                      ${formatAmount(incomeEntries.filter((e) => e.amount != null).reduce((s, e) => s + Number(e.amount), 0))}
                    </p>
                  </div>
                  <RoleGate allow={["admin", "team_lead"]}>
                    <Button size="sm" onClick={() => handleAdd("income")}>
                      <Plus />
                      Add
                    </Button>
                  </RoleGate>
                </div>
                <div className="space-y-2">
                  {incomeEntries.length === 0 ? (
                    <p className="py-8 text-center text-xs text-muted-foreground">No income entries</p>
                  ) : (
                    incomeEntries.map((e) => (
                      <EntryCard key={e.id} entry={e} canEdit={canEdit} onEdit={() => handleEdit(e)} />
                    ))
                  )}
                </div>
              </div>
            )}

            {/* Expenses column */}
            {filterType !== "income" && (
              <div>
                <div className="mb-3 flex items-center justify-between">
                  <div>
                    <h2 className="font-heading text-base font-semibold text-foreground">Expenses</h2>
                    <p className="text-sm tabular-nums text-destructive">
                      ${formatAmount(expenseEntries.filter((e) => e.amount != null).reduce((s, e) => s + Number(e.amount), 0))}
                    </p>
                  </div>
                  <RoleGate allow={["admin", "team_lead"]}>
                    <Button size="sm" onClick={() => handleAdd("expense")}>
                      <Plus />
                      Add
                    </Button>
                  </RoleGate>
                </div>
                <div className="space-y-2">
                  {expenseEntries.length === 0 ? (
                    <p className="py-8 text-center text-xs text-muted-foreground">No expense entries</p>
                  ) : (
                    expenseEntries.map((e) => (
                      <EntryCard key={e.id} entry={e} canEdit={canEdit} onEdit={() => handleEdit(e)} />
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
        </>
      )}

      <EntryFormSheet
        key={sheetKey}
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        entry={editingEntry}
        defaultType={defaultType}
        categories={categories}
      />
    </div>
  )
}
