import { useState } from "react"
import { Plus, Users } from "lucide-react"
import { useAuth } from "@/hooks/useAuth"
import { useProfiles } from "@/hooks/useProfiles"
import { useDepartments } from "@/hooks/useDepartments"
import { PageHeader } from "@/components/common/PageHeader"
import { RoleGate } from "@/components/common/RoleGate"
import { EmptyState } from "@/components/common/EmptyState"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { MemberRow } from "./MemberRow"
import { DepartmentCard } from "./DepartmentCard"
import { DepartmentFormSheet } from "./DepartmentFormSheet"
import { InviteMemberSheet } from "./InviteMemberSheet"
import type { Department } from "@/types"

export function TeamPage() {
  const { profile } = useAuth()
  const { data: profiles, isLoading: profilesLoading } = useProfiles()
  const { data: departments, isLoading: departmentsLoading } = useDepartments()
  const [sheetOpen, setSheetOpen] = useState(false)
  const [editingDepartment, setEditingDepartment] = useState<Department | null>(null)
  const [sheetKey, setSheetKey] = useState(0)
  const [inviteOpen, setInviteOpen] = useState(false)

  const canEditMembers = profile?.role === "admin"

  const handleAddDepartment = () => {
    setEditingDepartment(null)
    setSheetKey((key) => key + 1)
    setSheetOpen(true)
  }

  const handleEditDepartment = (department: Department) => {
    setEditingDepartment(department)
    setSheetKey((key) => key + 1)
    setSheetOpen(true)
  }

  return (
    <div>
      <PageHeader title="Team & Roles" description="Members, departments, and roles." />

      <Tabs defaultValue="members">
        <TabsList>
          <TabsTrigger className={`hover:cursor-pointer`} value="members">Members</TabsTrigger>
          <TabsTrigger className={`hover:cursor-pointer`} value="departments">Departments</TabsTrigger>
        </TabsList>

        <TabsContent value="members" className="mt-4 space-y-3">
          <RoleGate allow={["admin"]}>
            <div className="flex justify-end">
              <Button onClick={() => setInviteOpen(true)}>
                <Plus />
                Invite member
              </Button>
            </div>
          </RoleGate>

          {profilesLoading ? (
            <>
              <Skeleton className="h-20" />
              <Skeleton className="h-20" />
              <Skeleton className="h-20" />
            </>
          ) : profiles && profiles.length > 0 ? (
            profiles.map((p) => (
              <MemberRow
                key={p.id}
                profile={p}
                departments={departments ?? []}
                canEdit={canEditMembers}
              />
            ))
          ) : (
            <EmptyState
              icon={Users}
              title="No members yet"
              description={
                canEditMembers
                  ? "Invite a member to get started."
                  : "Members will appear here once an admin adds them."
              }
            />
          )}
        </TabsContent>

        <TabsContent value="departments" className="mt-4 space-y-3">
          <RoleGate allow={["admin", "team_lead"]}>
            <div className="flex justify-end">
              <Button onClick={handleAddDepartment}>
                <Plus />
                Add department
              </Button>
            </div>
          </RoleGate>

          {departmentsLoading ? (
            <div className="grid gap-3 sm:grid-cols-2">
              <Skeleton className="h-24" />
              <Skeleton className="h-24" />
            </div>
          ) : departments && departments.length > 0 ? (
            <div className="grid gap-3 sm:grid-cols-2">
              {departments.map((dept) => (
                <DepartmentCard
                  key={dept.id}
                  department={dept}
                  profiles={profiles ?? []}
                  onEdit={() => handleEditDepartment(dept)}
                />
              ))}
            </div>
          ) : (
            <EmptyState
              icon={Users}
              title="No departments yet"
              description="Add a department to get started."
            />
          )}
        </TabsContent>
      </Tabs>

      <DepartmentFormSheet
        key={sheetKey}
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        department={editingDepartment}
        profiles={profiles ?? []}
      />

      <InviteMemberSheet
        open={inviteOpen}
        onOpenChange={setInviteOpen}
        departments={departments ?? []}
      />
    </div>
  )
}
