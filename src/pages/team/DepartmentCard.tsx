import { useState } from "react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { Pencil, Trash2 } from "lucide-react"
import { supabase } from "@/lib/supabase"
import { RoleGate } from "@/components/common/RoleGate"
import { ConfirmDialog } from "@/components/common/ConfirmDialog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import type { Department, Profile } from "@/types"

interface DepartmentCardProps {
  department: Department
  profiles: Profile[]
  onEdit: () => void
}

export function DepartmentCard({ department, profiles, onEdit }: DepartmentCardProps) {
  const [confirmOpen, setConfirmOpen] = useState(false)
  const queryClient = useQueryClient()
  const lead = profiles.find((p) => p.id === department.lead_id)
  const memberCount = profiles.filter((p) => p.department_id === department.id).length

  const deleteMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("departments").delete().eq("id", department.id)
      if (error) throw error
    },
    onSuccess: () => {
      setConfirmOpen(false)
      queryClient.invalidateQueries({ queryKey: ["departments"] })
      queryClient.invalidateQueries({ queryKey: ["profiles"] })
      toast.success("Department deleted")
    },
    onError: (error) => toast.error(error.message),
  })

  return (
    <Card>
      <CardHeader>
        <CardTitle>{department.name}</CardTitle>
        {department.description && <CardDescription>{department.description}</CardDescription>}
        <RoleGate allow={["admin", "team_lead"]}>
          <CardAction className="flex gap-1">
            <Button variant="ghost" size="icon-sm" aria-label="Edit department" onClick={onEdit}>
              <Pencil />
            </Button>
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label="Delete department"
              onClick={() => setConfirmOpen(true)}
              disabled={deleteMutation.isPending}
            >
              <Trash2 />
            </Button>
          </CardAction>
        </RoleGate>
      </CardHeader>
      <CardContent className="flex items-center justify-between text-sm text-muted-foreground">
        <span>{lead ? `Led by ${lead.full_name || lead.email}` : "No lead assigned"}</span>
        <Badge variant="outline">
          {memberCount} {memberCount === 1 ? "member" : "members"}
        </Badge>
      </CardContent>
      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title="Delete department?"
        description={`"${department.name}" will be deleted. Members assigned to it will become unassigned.`}
        onConfirm={() => deleteMutation.mutate()}
        loading={deleteMutation.isPending}
      />
    </Card>
  )
}
