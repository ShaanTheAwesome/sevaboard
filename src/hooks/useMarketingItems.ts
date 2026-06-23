import { useQuery } from "@tanstack/react-query"
import { supabase } from "@/lib/supabase"

export function useMarketingItems() {
  return useQuery({
    queryKey: ["marketing_items"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("marketing_items")
        .select("*")
        .order("deadline", { ascending: true, nullsFirst: false })
        .order("created_at", { ascending: false })

      if (error) throw error
      return data
    },
  })
}
