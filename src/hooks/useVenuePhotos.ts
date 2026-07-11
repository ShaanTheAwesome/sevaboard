import { useQuery } from "@tanstack/react-query"
import { supabase } from "@/lib/supabase"

export function useVenuePhotos() {
  return useQuery({
    queryKey: ["venue_photos"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("venue_photos")
        .select("*")
        .order("sort_order", { ascending: true })
        .order("created_at", { ascending: true })

      if (error) throw error
      return data
    },
  })
}
