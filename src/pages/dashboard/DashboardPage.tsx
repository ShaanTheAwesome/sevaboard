import { CountdownTimer } from "@/components/common/CountdownTimer"
import { useAuth } from "@/hooks/useAuth"
import { UpcomingTasks } from "./UpcomingTasks"
// import { Link } from "react-router-dom"
// import { NAV_ITEMS } from "@/lib/navigation"
// import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export function DashboardPage() {
  const { profile } = useAuth()
  const firstName = profile?.full_name?.split(" ")[0]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-semibold text-foreground">
          {firstName ? `Welcome, ${firstName}` : "Welcome"}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Here's what's happening with Janmashtami planning.
        </p>
      </div>

      <CountdownTimer />

      <UpcomingTasks />

      {/* <div>
        <h2 className="mb-3 font-heading text-lg font-semibold text-foreground">Modules</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {NAV_ITEMS.filter((item) => item.to !== "/").map((item) => (
            <Link key={item.to} to={item.to}>
              <Card className="h-full transition-colors hover:bg-secondary">
                <CardHeader>
                  <div className="mb-2 flex size-9 items-center justify-center rounded-lg bg-primary/10">
                    <item.icon className="size-5 text-saffron" />
                  </div>
                  <CardTitle>{item.label}</CardTitle>
                  <CardDescription>{item.description}</CardDescription>
                </CardHeader>
              </Card>
            </Link>
          ))}
        </div>
      </div> */}
    </div>
  )
}
