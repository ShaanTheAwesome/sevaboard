import { Palette } from "lucide-react"
import { PageHeader } from "@/components/common/PageHeader"
import { EmptyState } from "@/components/common/EmptyState"

export function DesignListPage() {
  return (
    <div>
      <PageHeader
        title="Design List"
        description="Posters and social media designs for the event."
      />
      <EmptyState
        icon={Palette}
        title="This module is coming soon"
        description="A list of design items with status, platform, and post dates will appear here."
      />
    </div>
  )
}
