import { useQuery } from "@tanstack/react-query"
import { supabase } from "@/lib/supabase"

export function useBudgetEntries() {
  return useQuery({
    queryKey: ["budget_entries"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("budget_entries")
        .select("*")
        .order("entry_date", { ascending: false })
        .order("created_at", { ascending: false })

      if (error) throw error
      return data
    },
  })
}
