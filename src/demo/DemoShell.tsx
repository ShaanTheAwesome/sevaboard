import { Sidebar } from "@/components/layout/Sidebar"
import { Topbar } from "@/components/layout/Topbar"
import { BottomNav } from "@/components/layout/BottomNav"
import { PageTransition } from "@/components/layout/PageTransition"
import { DemoBanner } from "./DemoBanner"

export function DemoShell() {
  return (
    <div className="flex h-svh flex-col bg-background">
      <DemoBanner />
      <div className="flex min-h-0 flex-1">
        <Sidebar />
        <div className="flex min-w-0 flex-1 flex-col">
          <Topbar />
          <main className="flex-1 overflow-y-auto p-4 md:p-6">
            <PageTransition />
          </main>
          <BottomNav />
        </div>
      </div>
    </div>
  )
}
