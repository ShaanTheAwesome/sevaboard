import { useMemo, type ReactNode } from "react"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { AuthContext } from "@/contexts/auth-context"
import { DemoContext } from "./context"
import {
  DEMO_PROFILES,
  DEMO_DEPARTMENTS,
  DEMO_ROOMS,
  DEMO_PROGRAM_ITEMS,
  DEMO_PLANNING_TASKS,
  DEMO_BUDGET_ENTRIES,
  DEMO_MARKETING_ITEMS,
  DEMO_SPONSORS,
  DEMO_ROSTER_ENTRIES,
  DEMO_VENUE_DETAILS,
} from "./sample-data"
import type { User } from "@supabase/supabase-js"

const DEMO_USER = { id: "d1", email: "arjun@example.com" } as User

const DEMO_PROFILE = DEMO_PROFILES[0]

export function DemoProvider({ children }: { children: ReactNode }) {
  const queryClient = useMemo(() => {
    const client = new QueryClient({
      defaultOptions: {
        queries: {
          staleTime: Infinity,
          gcTime: Infinity,
          refetchOnWindowFocus: false,
          refetchOnMount: false,
          retry: false,
        },
      },
    })

    client.setQueryData(["profile", "d1"], DEMO_PROFILE)
    client.setQueryData(["profiles"], DEMO_PROFILES)
    client.setQueryData(["departments"], DEMO_DEPARTMENTS)
    client.setQueryData(["rooms"], DEMO_ROOMS)
    client.setQueryData(["program_items"], DEMO_PROGRAM_ITEMS)
    client.setQueryData(["planning_tasks"], DEMO_PLANNING_TASKS)
    client.setQueryData(["budget_entries"], DEMO_BUDGET_ENTRIES)
    client.setQueryData(["marketing_items"], DEMO_MARKETING_ITEMS)
    client.setQueryData(["sponsors"], DEMO_SPONSORS)
    client.setQueryData(["roster_entries"], DEMO_ROSTER_ENTRIES)
    client.setQueryData(["venue_details"], DEMO_VENUE_DETAILS)

    return client
  }, [])

  return (
    <DemoContext.Provider value={true}>
      <QueryClientProvider client={queryClient}>
        <AuthContext.Provider
          value={{
            user: DEMO_USER,
            profile: DEMO_PROFILE,
            loading: false,
            signOut: async () => {},
          }}
        >
          {children}
        </AuthContext.Provider>
      </QueryClientProvider>
    </DemoContext.Provider>
  )
}
