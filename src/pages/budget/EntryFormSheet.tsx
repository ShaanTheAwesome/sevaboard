import { useState } from "react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { supabase } from "@/lib/supabase"
import { useDemoGuard } from "@/demo/useDemoGuard"
import { cn } from "@/lib/utils"
import { useAuth } from "@/hooks/useAuth"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import type { BudgetEntry, BudgetType } from "@/types"

const TYPE_ITEMS = [
  { value: "income", label: "Income" },
  { value: "expense", label: "Expense" },
]

interface EntryFormSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  entry: BudgetEntry | null
  defaultType: BudgetType
  categories: string[]
}

export function EntryFormSheet({
  open,
  onOpenChange,
  entry,
  defaultType,
  categories,
}: EntryFormSheetProps) {
  const { user } = useAuth()
  const demoGuard = useDemoGuard()
  const [item, setItem] = useState(entry?.item ?? "")
  const [category, setCategory] = useState(entry?.category ?? "")
  const [isTba, setIsTba] = useState(entry ? entry.amount === null : false)
  const [amount, setAmount] = useState(entry?.amount != null ? String(entry.amount) : "")
  const [forecastedAmount, setForecastedAmount] = useState(
    entry?.forecasted_amount != null ? String(entry.forecasted_amount) : ""
  )
  const [entryDate, setEntryDate] = useState(
    entry?.entry_date ?? new Date().toISOString().slice(0, 10)
  )
  const [type, setType] = useState<string>(entry?.type ?? defaultType)
  const [notes, setNotes] = useState(entry?.notes ?? "")
  const queryClient = useQueryClient()

  const mutation = useMutation({
    mutationFn: async () => {
      const payload = {
        item: item.trim(),
        category: category.trim(),
        amount: isTba ? null : Number(amount),
        forecasted_amount: forecastedAmount ? Number(forecastedAmount) : null,
        entry_date: entryDate,
        type: type as BudgetType,
        notes: notes.trim() || null,
        created_by: user?.id ?? null,
      }

      if (entry) {
        const { error } = await supabase
          .from("budget_entries")
          .update(payload)
          .eq("id", entry.id)
        if (error) throw error
      } else {
        const { error } = await supabase.from("budget_entries").insert(payload)
        if (error) throw error
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["budget_entries"] })
      toast.success(entry ? "Entry updated" : "Entry added")
      onOpenChange(false)
    },
    onError: (error) => toast.error(error.message),
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (demoGuard(() => onOpenChange(false))) return
    if (!item.trim()) {
      toast.error("Item name is required")
      return
    }
    if (!category.trim()) {
      toast.error("Category is required")
      return
    }
    if (!isTba) {
      const parsedAmount = Number(amount)
      if (!amount || isNaN(parsedAmount) || parsedAmount <= 0) {
        toast.error("Enter a valid amount greater than 0")
        return
      }
    }
    if (forecastedAmount) {
      const parsedForecast = Number(forecastedAmount)
      if (isNaN(parsedForecast) || parsedForecast < 0) {
        toast.error("Enter a valid forecasted amount")
        return
      }
    }
    if (!entryDate) {
      toast.error("Date is required")
      return
    }
    mutation.mutate()
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>{entry ? "Edit entry" : "Add entry"}</SheetTitle>
          <SheetDescription>
            {entry
              ? "Update this budget entry."
              : "Add a new income or expense entry."}
          </SheetDescription>
        </SheetHeader>

        <form id="entry-form" className="min-h-0 flex-1 overflow-y-auto px-4" onSubmit={handleSubmit} noValidate>
          <FieldGroup>
            <Field>
              <FieldLabel>Type</FieldLabel>
              <Select
                value={type}
                onValueChange={(v) => v && setType(v)}
                items={TYPE_ITEMS}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TYPE_ITEMS.map((t) => (
                    <SelectItem key={t.value} value={t.value}>
                      {t.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>

            <Field>
              <FieldLabel htmlFor="entry-item">Item</FieldLabel>
              <Input
                id="entry-item"
                value={item}
                onChange={(e) => setItem(e.target.value)}
                placeholder="e.g. Sound system hire, Sponsor donation"
              />
            </Field>

            <Field>
              <FieldLabel htmlFor="entry-category">Category</FieldLabel>
              {categories.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {categories.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setCategory(c)}
                      className={cn(
                        "rounded-md border px-2.5 py-1 text-xs font-medium transition-colors",
                        category === c
                          ? "border-saffron bg-saffron/15 text-saffron"
                          : "border-border text-muted-foreground hover:border-foreground/30 hover:text-foreground hover:cursor-pointer"
                      )}
                    >
                      {c}
                    </button>
                  ))}
                </div>
              )}
              <Input
                id="entry-category"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                placeholder={categories.length > 0 ? "Or type a new category" : "e.g. Decorations, Sponsorship, Food"}
              />
            </Field>

            <Field>
              <FieldLabel>Amount ($)</FieldLabel>
              <div className="flex items-center gap-2">
                <Input
                  id="entry-amount"
                  type="number"
                  min="0"
                  step="0.01"
                  value={isTba ? "" : amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0.00"
                  disabled={isTba}
                  className={cn(isTba && "opacity-50")}
                />
                <Button
                  type="button"
                  variant={isTba ? "default" : "outline"}
                  size="sm"
                  className={cn("shrink-0", isTba && "bg-saffron hover:bg-saffron/90")}
                  onClick={() => setIsTba(!isTba)}
                >
                  TBA
                </Button>
              </div>
              {isTba && (
                <p className="text-xs text-muted-foreground">
                  Amount to be announced — this entry won't count toward totals.
                </p>
              )}
            </Field>

            <Field>
              <FieldLabel htmlFor="entry-forecast">Forecasted amount ($, optional)</FieldLabel>
              <Input
                id="entry-forecast"
                type="number"
                min="0"
                step="0.01"
                value={forecastedAmount}
                onChange={(e) => setForecastedAmount(e.target.value)}
                placeholder="0.00"
              />
              <p className="text-xs text-muted-foreground">
                Your best estimate for this item — shown separately from the actual amount above.
              </p>
            </Field>

            <Field>
              <FieldLabel htmlFor="entry-date">Date</FieldLabel>
              <Input
                id="entry-date"
                type="date"
                value={entryDate}
                onChange={(e) => setEntryDate(e.target.value)}
              />
            </Field>

            <Field>
              <FieldLabel htmlFor="entry-notes">Notes (optional)</FieldLabel>
              <Textarea
                id="entry-notes"
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Any additional details"
              />
            </Field>
          </FieldGroup>
        </form>

        <SheetFooter className="flex-row justify-end gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={mutation.isPending}
          >
            Cancel
          </Button>
          <Button type="submit" form="entry-form" disabled={mutation.isPending}>
            {mutation.isPending ? "Saving..." : "Save"}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}
