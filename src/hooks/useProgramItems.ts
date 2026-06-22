import { useQuery } from "@tanstack/react-query"
import { supabase } from "@/lib/supabase"

export function useProgramItems() {
  return useQuery({
    queryKey: ["program_items"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("program_items")
        .select("*")
        .order("start_time")
        .order("sort_order")

      if (error) throw error
      return data
    },
  })
}
