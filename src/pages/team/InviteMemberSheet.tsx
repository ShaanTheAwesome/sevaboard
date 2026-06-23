import { useState } from "react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { Input } from "@/components/ui/input"
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useInviteMember } from "@/hooks/useInviteMember"
import { ASSIGNABLE_ROLES } from "@/types"
import type { Department, UserRole } from "@/types"

const NO_DEPARTMENT = "none"
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

interface InviteMemberSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  departments: Department[]
}

export function InviteMemberSheet({ open, onOpenChange, departments }: InviteMemberSheetProps) {
  const [email, setEmail] = useState("")
  const [fullName, setFullName] = useState("")
  const [role, setRole] = useState<string>("team_lead")
  const [departmentId, setDepartmentId] = useState(NO_DEPARTMENT)

  const mutation = useInviteMember()

  const departmentItems = [
    { value: NO_DEPARTMENT, label: "No department" },
    ...departments.map((dept) => ({ value: dept.id, label: dept.name })),
  ]

  const reset = () => {
    setEmail("")
    setFullName("")
    setRole("team_lead")
    setDepartmentId(NO_DEPARTMENT)
  }

  const handleOpenChange = (next: boolean) => {
    if (!next) reset()
    onOpenChange(next)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    const trimmedEmail = email.trim()
    if (!EMAIL_REGEX.test(trimmedEmail)) {
      toast.error("Enter a valid email address")
      return
    }

    mutation.mutate(
      {
        email: trimmedEmail,
        full_name: fullName.trim(),
        role: role as UserRole,
        department_id: departmentId === NO_DEPARTMENT ? null : departmentId,
      },
      {
        onSuccess: (data) => {
          if (data?.warning) {
            toast.warning(data.warning)
          } else {
            toast.success(`Invitation sent to ${trimmedEmail}`)
          }
          handleOpenChange(false)
        },
        onError: (error) => toast.error(error.message),
      }
    )
  }

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>Invite member</SheetTitle>
          <SheetDescription>
            They'll receive an email to set their password and join SevaBoard.
          </SheetDescription>
        </SheetHeader>

        <form id="invite-member-form" className="min-h-0 flex-1 overflow-y-auto px-4" onSubmit={handleSubmit} noValidate>
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="invite-email">Email</FieldLabel>
              <Input
                id="invite-email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </Field>

            <Field>
              <FieldLabel htmlFor="invite-name">Full name</FieldLabel>
              <Input
                id="invite-name"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
              />
            </Field>

            <Field>
              <FieldLabel>Role</FieldLabel>
              <Select
                value={role}
                onValueChange={(value) => value && setRole(value)}
                items={ASSIGNABLE_ROLES}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ASSIGNABLE_ROLES.map((item) => (
                    <SelectItem key={item.value} value={item.value}>
                      {item.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>

            <Field>
              <FieldLabel>Department</FieldLabel>
              <Select
                value={departmentId}
                onValueChange={(value) => value && setDepartmentId(value)}
                items={departmentItems}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {departmentItems.map((item) => (
                    <SelectItem key={item.value} value={item.value}>
                      {item.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
          </FieldGroup>
        </form>

        <SheetFooter className="flex-row justify-end gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => handleOpenChange(false)}
            disabled={mutation.isPending}
          >
            Cancel
          </Button>
          <Button type="submit" form="invite-member-form" disabled={mutation.isPending}>
            {mutation.isPending ? "Sending..." : "Send invite"}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}
