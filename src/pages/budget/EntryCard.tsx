import { useState } from "react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { format, parseISO } from "date-fns"
import { Pencil, Trash2 } from "lucide-react"
import { supabase } from "@/lib/supabase"
import { ConfirmDialog } from "@/components/common/ConfirmDialog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import type { BudgetEntry } from "@/types"

interface EntryCardProps {
  entry: BudgetEntry
  canEdit: boolean
  onEdit: () => void
}

export function EntryCard({ entry, canEdit, onEdit }: EntryCardProps) {
  const [confirmOpen, setConfirmOpen] = useState(false)
  const queryClient = useQueryClient()

  const deleteMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("budget_entries")
        .delete()
        .eq("id", entry.id)
      if (error) throw error
    },
    onSuccess: () => {
      setConfirmOpen(false)
      queryClient.invalidateQueries({ queryKey: ["budget_entries"] })
      toast.success("Entry deleted")
    },
    onError: (error) => toast.error(error.message),
  })

  return (
    <Card>
      <CardContent className="flex items-start gap-3 p-3">
        <div className="min-w-0 flex-1 space-y-1">
          <div className="flex items-baseline justify-between gap-2">
            <p className="truncate text-sm font-medium text-foreground">
              {entry.item}
            </p>
            {entry.amount != null ? (
              <p className={`shrink-0 text-sm font-semibold tabular-nums ${
                entry.type === "income" ? "text-emerald-500" : "text-destructive"
              }`}>
                {entry.type === "income" ? "+" : "−"}${Number(entry.amount).toLocaleString("en-AU", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
            ) : (
              <Badge className="shrink-0 border-0 bg-saffron/20 text-saffron text-xs">
                TBA
              </Badge>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-1.5">
            <Badge variant="outline" className="text-[10px] px-1.5 py-0">
              {entry.category}
            </Badge>
            <span className="text-xs text-muted-foreground">
              {format(parseISO(entry.entry_date), "d MMM yyyy")}
            </span>
          </div>
          {entry.forecasted_amount != null && (
            <p className="text-xs text-muted-foreground">
              Forecast: $
              {Number(entry.forecasted_amount).toLocaleString("en-AU", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </p>
          )}
          {entry.notes && (
            <p className="text-xs text-muted-foreground">{entry.notes}</p>
          )}
        </div>

        {canEdit && (
          <div className="flex shrink-0 gap-0.5">
            <Button variant="ghost" size="icon-sm" aria-label="Edit entry" onClick={onEdit}>
              <Pencil />
            </Button>
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label="Delete entry"
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
        title={`Delete ${entry.type === "income" ? "Income" : "Expense"}?`}
        description={`"${entry.item}" ($${Number(entry.amount).toLocaleString("en-AU", { minimumFractionDigits: 2 })}) will be permanently deleted.`}
        onConfirm={() => deleteMutation.mutate()}
        loading={deleteMutation.isPending}
      />
    </Card>
  )
}
