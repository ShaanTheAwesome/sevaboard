import { useQuery } from "@tanstack/react-query"
import { supabase } from "@/lib/supabase"

export function useVenueDetails() {
  return useQuery({
    queryKey: ["venue_details"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("venue_details")
        .select("*")
        .eq("id", 1)
        .single()

      if (error) throw error
      return data
    },
  })
}
