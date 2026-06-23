import { useState } from "react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { supabase } from "@/lib/supabase"
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
import { SPONSOR_STATUS_LABELS } from "@/types"
import type { Sponsor, SponsorStatus } from "@/types"

const STATUS_ITEMS = Object.entries(SPONSOR_STATUS_LABELS).map(([v, l]) => ({ value: v, label: l }))

interface SponsorFormSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  sponsor: Sponsor | null
}

export function SponsorFormSheet({ open, onOpenChange, sponsor }: SponsorFormSheetProps) {
  const { user } = useAuth()
  const [companyName, setCompanyName] = useState(sponsor?.company_name ?? "")
  const [category, setCategory] = useState(sponsor?.category ?? "")
  const [contactName, setContactName] = useState(sponsor?.contact_name ?? "")
  const [contactPhone, setContactPhone] = useState(sponsor?.contact_phone ?? "")
  const [isTba, setIsTba] = useState(sponsor ? sponsor.amount === null : true)
  const [amount, setAmount] = useState(sponsor?.amount != null ? String(sponsor.amount) : "")
  const [status, setStatus] = useState<string>(sponsor?.status ?? "lead")
  const [personResponsible, setPersonResponsible] = useState(sponsor?.person_responsible ?? "")
  const [notes, setNotes] = useState(sponsor?.notes ?? "")
  const queryClient = useQueryClient()

  const mutation = useMutation({
    mutationFn: async () => {
      const payload = {
        company_name: companyName.trim(),
        category: category.trim() || null,
        contact_name: contactName.trim() || null,
        contact_phone: contactPhone.trim() || null,
        amount: isTba ? null : Number(amount),
        status: status as SponsorStatus,
        person_responsible: personResponsible || null,
        notes: notes.trim() || null,
        created_by: user?.id ?? null,
      }

      if (sponsor) {
        const { error } = await supabase.from("sponsors").update(payload).eq("id", sponsor.id)
        if (error) throw error
      } else {
        const { error } = await supabase.from("sponsors").insert(payload)
        if (error) throw error
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sponsors"] })
      toast.success(sponsor ? "Sponsor updated" : "Sponsor added")
      onOpenChange(false)
    },
    onError: (error) => toast.error(error.message),
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!companyName.trim()) {
      toast.error("Company name is required")
      return
    }
    if (!isTba) {
      const parsed = Number(amount)
      if (!amount || isNaN(parsed) || parsed <= 0) {
        toast.error("Enter a valid amount greater than 0")
        return
      }
    }
    mutation.mutate()
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>{sponsor ? "Edit sponsor" : "Add sponsor"}</SheetTitle>
          <SheetDescription>
            {sponsor ? "Update sponsor details." : "Track a new sponsor relationship."}
          </SheetDescription>
        </SheetHeader>

        <form id="sponsor-form" className="min-h-0 flex-1 overflow-y-auto px-4" onSubmit={handleSubmit} noValidate>
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="sponsor-company">Company / Organisation</FieldLabel>
              <Input
                id="sponsor-company"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                placeholder="e.g. ABC Sweets"
              />
            </Field>

            <Field>
              <FieldLabel htmlFor="sponsor-category">Category</FieldLabel>
              <Input
                id="sponsor-category"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                placeholder="e.g. Food, Clothes, etc"
              />
            </Field>

            <div className="grid grid-cols-2 gap-4">
              <Field>
                <FieldLabel htmlFor="sponsor-name">Name</FieldLabel>
                <Input
                  id="sponsor-name"
                  value={contactName}
                  onChange={(e) => setContactName(e.target.value)}
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="sponsor-phone">Phone</FieldLabel>
                <Input
                  id="sponsor-phone"
                  value={contactPhone}
                  onChange={(e) => setContactPhone(e.target.value)}
                />
              </Field>
            </div>

            <Field>
              <FieldLabel>Amount ($)</FieldLabel>
              <div className="flex items-center gap-2">
                <Input
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
            </Field>

            <Field>
              <FieldLabel>Status</FieldLabel>
              <Select value={status} onValueChange={(v) => v && setStatus(v)} items={STATUS_ITEMS}>
                <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {STATUS_ITEMS.map((i) => (
                    <SelectItem key={i.value} value={i.value}>{i.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>

            <Field>
              <FieldLabel htmlFor="sponsor-responsible">Person Responsible</FieldLabel>
              <Input
                id="sponsor-responsible"
                value={personResponsible}
                onChange={(e) => setPersonResponsible(e.target.value)}
                placeholder="Person responsible for contacting sponsor"
              />
            </Field>

            <Field>
              <FieldLabel htmlFor="sponsor-notes">Notes</FieldLabel>
              <Textarea
                id="sponsor-notes"
                rows={3}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="What was discussed, what was promised, etc."
              />
            </Field>
          </FieldGroup>
        </form>

        <SheetFooter className="flex-row justify-end gap-2">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={mutation.isPending}>
            Cancel
          </Button>
          <Button type="submit" form="sponsor-form" disabled={mutation.isPending}>
            {mutation.isPending ? "Saving..." : "Save"}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}
