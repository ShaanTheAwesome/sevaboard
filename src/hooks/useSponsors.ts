import { useQuery } from "@tanstack/react-query"
import { supabase } from "@/lib/supabase"

export function useSponsors() {
  return useQuery({
    queryKey: ["sponsors"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("sponsors")
        .select("*")
        .order("status")
        .order("company_name")

      if (error) throw error
      return data
    },
  })
}
