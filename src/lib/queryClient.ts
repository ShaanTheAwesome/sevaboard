import { QueryClient } from "@tanstack/react-query"

// Responsible for managing all app data caching, background updates, logic refactoring, and memory cleanups
// Stores API call results in memory making retrieval and navigation fast

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30 * 1000,
      refetchOnWindowFocus: false,
    },
  },
})
