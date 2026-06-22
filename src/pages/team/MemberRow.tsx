import { useState } from "react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { Pencil, Trash2 } from "lucide-react"
import { supabase } from "@/lib/supabase"
import { getInitials } from "@/lib/utils"
import { useAuth } from "@/hooks/useAuth"
import { useRemoveMember } from "@/hooks/useRemoveMember"
import { ConfirmDialog } from "@/components/common/ConfirmDialog"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { ASSIGNABLE_ROLES, ROLE_LABELS } from "@/types"
import type { Department, Profile, UserRole } from "@/types"

const NO_DEPARTMENT = "none"

interface MemberRowProps {
  profile: Profile
  departments: Department[]
  canEdit: boolean
}

export function MemberRow({ profile, departments, canEdit }: MemberRowProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [fullName, setFullName] = useState(profile.full_name ?? "")
  const [phone, setPhone] = useState(profile.phone ?? "")
  const [role, setRole] = useState<string>(profile.role)
  const [departmentId, setDepartmentId] = useState(profile.department_id ?? NO_DEPARTMENT)

  const [confirmOpen, setConfirmOpen] = useState(false)

  const { user } = useAuth()
  const queryClient = useQueryClient()
  const removeMutation = useRemoveMember()
  const isSelf = user?.id === profile.id

  const mutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("profiles")
        .update({
          full_name: fullName || null,
          phone: phone || null,
          role: role as UserRole,
          department_id: departmentId === NO_DEPARTMENT ? null : departmentId,
        })
        .eq("id", profile.id)

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["profiles"] })
      queryClient.invalidateQueries({ queryKey: ["profile"] })
      toast.success("Member updated")
      setIsEditing(false)
    },
    onError: (error) => toast.error(error.message),
  })

  const handleCancel = () => {
    setFullName(profile.full_name ?? "")
    setPhone(profile.phone ?? "")
    setRole(profile.role)
    setDepartmentId(profile.department_id ?? NO_DEPARTMENT)
    setIsEditing(false)
  }

  const handleRemove = () => {
    removeMutation.mutate(profile.id, {
      onSuccess: () => {
        setConfirmOpen(false)
        toast.success("Member removed")
      },
      onError: (error) => toast.error(error.message),
    })
  }

  const departmentName = departments.find((dept) => dept.id === profile.department_id)?.name

  const departmentItems = [
    { value: NO_DEPARTMENT, label: "No department" },
    ...departments.map((dept) => ({ value: dept.id, label: dept.name })),
  ]

  if (isEditing) {
    return (
      <Card>
        <CardContent>
          <FieldGroup>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field>
                <FieldLabel htmlFor={`name-${profile.id}`}>Full name</FieldLabel>
                <Input
                  id={`name-${profile.id}`}
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                />
              </Field>

              <Field>
                <FieldLabel htmlFor={`phone-${profile.id}`}>Phone</FieldLabel>
                <Input
                  id={`phone-${profile.id}`}
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
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
            </div>
          </FieldGroup>
        </CardContent>
        <CardFooter className="justify-end gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={handleCancel}
            disabled={mutation.isPending}
          >
            Cancel
          </Button>
          <Button type="button" onClick={() => mutation.mutate()} disabled={mutation.isPending}>
            {mutation.isPending ? "Saving..." : "Save"}
          </Button>
        </CardFooter>
      </Card>
    )
  }

  return (
    <Card>
      <CardContent className="flex items-center gap-4">
        <Avatar>
          <AvatarFallback>{getInitials(profile.full_name)}</AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1">
          <p className="truncate font-medium text-foreground">{profile.full_name || "Unnamed"}</p>
          {canEdit && (
            <>
              <p className="truncate text-sm text-muted-foreground">{profile.email}</p>
              {profile.phone && (
                <p className="truncate text-xs text-muted-foreground">{profile.phone}</p>
              )}
            </>
          )}
        </div>
        <div className="flex shrink-0 flex-col items-end gap-1.5">
          <Badge variant="secondary">{ROLE_LABELS[profile.role]}</Badge>
          {departmentName && (
            <span className="text-xs text-muted-foreground">{departmentName}</span>
          )}
        </div>
        {canEdit && (
          <div className="flex gap-1">
            <Button
              variant="ghost"
              size="icon"
              aria-label="Edit member"
              onClick={() => setIsEditing(true)}
            >
              <Pencil />
            </Button>
            {!isSelf && (
              <Button
                variant="ghost"
                size="icon"
                aria-label="Remove member"
                onClick={() => setConfirmOpen(true)}
                disabled={removeMutation.isPending}
              >
                <Trash2 />
              </Button>
            )}
          </div>
        )}
      </CardContent>
      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title="Remove member?"
        description={`This will permanently delete ${profile.full_name || profile.email}'s account. They will no longer be able to sign in.`}
        confirmLabel="Remove"
        onConfirm={handleRemove}
        loading={removeMutation.isPending}
      />
    </Card>
  )
}
