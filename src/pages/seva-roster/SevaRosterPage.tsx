import { HandHeart } from "lucide-react"
import { PageHeader } from "@/components/common/PageHeader"
import { EmptyState } from "@/components/common/EmptyState"

export function SevaRosterPage() {
  return (
    <div>
      <PageHeader
        title="Seva Roster"
        description="Volunteer shifts and assignments for the event."
      />
      <EmptyState
        icon={HandHeart}
        title="This module is coming soon"
        description="Volunteer seva roles, time slots, and locations will appear here."
      />
    </div>
  )
}
