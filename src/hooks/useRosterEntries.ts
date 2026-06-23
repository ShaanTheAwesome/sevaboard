import { useQuery } from "@tanstack/react-query"
import { supabase } from "@/lib/supabase"

export function useRosterEntries() {
  return useQuery({
    queryKey: ["roster_entries"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("roster_entries")
        .select("*")
        .order("time_slot")
        .order("seva_role")
        .order("created_at")

      if (error) throw error
      return data
    },
  })
}
