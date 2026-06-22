import { Navigate, Route, Routes } from "react-router-dom"
import { AppShell } from "@/components/layout/AppShell"
import { LoginPage } from "@/pages/auth/LoginPage"
import { SetPasswordPage } from "@/pages/auth/SetPasswordPage"
import { DashboardPage } from "@/pages/dashboard/DashboardPage"
import { ProgramPlannerPage } from "@/pages/program-planner/ProgramPlannerPage"
import { PlanningTimelinePage } from "@/pages/planning-timeline/PlanningTimelinePage"
import { DesignListPage } from "@/pages/design-list/DesignListPage"
import { SevaRosterPage } from "@/pages/seva-roster/SevaRosterPage"
import { BudgetPage } from "@/pages/budget/BudgetPage"
import { VenueDetailsPage } from "@/pages/venue-details/VenueDetailsPage"
import { TeamPage } from "@/pages/team/TeamPage"

function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/set-password" element={<SetPasswordPage />} />

      <Route element={<AppShell />}>
        <Route path="/" element={<DashboardPage />} />
        <Route path="/program-planner" element={<ProgramPlannerPage />} />
        <Route path="/planning-timeline" element={<PlanningTimelinePage />} />
        <Route path="/design-list" element={<DesignListPage />} />
        <Route path="/seva-roster" element={<SevaRosterPage />} />
        <Route path="/budget" element={<BudgetPage />} />
        <Route path="/venue-details" element={<VenueDetailsPage />} />
        <Route path="/team" element={<TeamPage />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default App
