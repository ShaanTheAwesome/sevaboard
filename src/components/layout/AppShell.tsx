import { IdleTimeoutDialog } from "@/components/common/IdleTimeoutDialog"
import { Sidebar } from "./Sidebar"
import { Topbar } from "./Topbar"
import { BottomNav } from "./BottomNav"
import { PageTransition } from "./PageTransition"

export function AppShell() {
  return (
    <div className="flex h-svh bg-background">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar />
        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          <PageTransition />
        </main>
        <BottomNav />
      </div>
      <IdleTimeoutDialog />
    </div>
  )
}
