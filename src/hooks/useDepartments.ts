import { useQuery } from "@tanstack/react-query"
import { supabase } from "@/lib/supabase"

export function useDepartments() {
  return useQuery({
    queryKey: ["departments"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("departments")
        .select("*")
        .order("name", { ascending: true })

      if (error) throw error
      return data
    },
  })
}
