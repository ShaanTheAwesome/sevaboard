import { Navigate, Route, Routes } from "react-router-dom"
import { ProtectedRoute } from "@/components/common/ProtectedRoute"
import { AppShell } from "@/components/layout/AppShell"
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

      <Route element={<AppShell />}>
        {/* Public pages */}
        <Route path="/" element={<DashboardPage />} />
        <Route path="/program-planner" element={<ProgramPlannerPage />} />
        <Route path="/planning-timeline" element={<PlanningTimelinePage />} />
        <Route path="/marketing" element={<MarketingPage />} />
        <Route path="/seva-roster" element={<SevaRosterPage />} />
        <Route path="/sponsors" element={<SponsorsPage />} />
        <Route path="/venue-details" element={<VenueDetailsPage />} />

        {/* Admin/lead only */}
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
