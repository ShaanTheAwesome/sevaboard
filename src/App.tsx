import { Navigate, Route, Routes } from "react-router-dom"
import { ProtectedRoute } from "@/components/common/ProtectedRoute"
import { AppShell } from "@/components/layout/AppShell"
import { DemoProvider } from "@/demo/DemoProvider"
import { DemoShell } from "@/demo/DemoShell"
import { LoginPage } from "@/pages/auth/LoginPage"
import { SetPasswordPage } from "@/pages/auth/SetPasswordPage"
import { DashboardPage } from "@/pages/dashboard/DashboardPage"
import { ProgramPlannerPage } from "@/pages/program-planner/ProgramPlannerPage"
import { PlanningTimelinePage } from "@/pages/planning-timeline/PlanningTimelinePage"
import { MarketingPage } from "@/pages/marketing/MarketingPage"
import { SevaRosterPage } from "@/pages/seva-roster/SevaRosterPage"
import { BudgetPage } from "@/pages/budget/BudgetPage"
import { SponsorsPage } from "@/pages/sponsors/SponsorsPage"
import { VenueDetailsPage } from "@/pages/venue-details/VenueDetailsPage"
import { TeamPage } from "@/pages/team/TeamPage"

function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/set-password" element={<SetPasswordPage />} />

      {/* Demo mode — hardcoded sample data, no real DB calls */}
      <Route
        path="/demo/*"
        element={
          <DemoProvider>
            <Routes>
              <Route element={<DemoShell />}>
                <Route index element={<DashboardPage />} />
                <Route path="program-planner" element={<ProgramPlannerPage />} />
                <Route path="planning-timeline" element={<PlanningTimelinePage />} />
                <Route path="marketing" element={<MarketingPage />} />
                <Route path="seva-roster" element={<SevaRosterPage />} />
                <Route path="finances" element={<BudgetPage />} />
                <Route path="sponsors" element={<SponsorsPage />} />
                <Route path="venue-details" element={<VenueDetailsPage />} />
                <Route path="team" element={<TeamPage />} />
              </Route>
            </Routes>
          </DemoProvider>
        }
      />

      {/* Real app */}
      <Route element={<AppShell />}>
        <Route path="/" element={<DashboardPage />} />
        <Route path="/program-planner" element={<ProgramPlannerPage />} />
        <Route path="/planning-timeline" element={<PlanningTimelinePage />} />
        <Route path="/marketing" element={<MarketingPage />} />
        <Route path="/seva-roster" element={<SevaRosterPage />} />
        <Route path="/sponsors" element={<SponsorsPage />} />
        <Route path="/venue-details" element={<VenueDetailsPage />} />

        <Route element={<ProtectedRoute />}>
          <Route path="/finances" element={<BudgetPage />} />
          <Route path="/team" element={<TeamPage />} />
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default App
