import { useQuery } from "@tanstack/react-query"
import { supabase } from "@/lib/supabase"

export function usePlanningTasks() {
  return useQuery({
    queryKey: ["planning_tasks"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("planning_tasks")
        .select("*")
        .order("week_number", { ascending: false })
        .order("category")
        .order("created_at")

      if (error) throw error
      return data
    },
  })
}
