import { useQuery } from "@tanstack/react-query"
import { supabase } from "@/lib/supabase"
import type { SponsorCategory } from "@/types"

export function useSponsorCategories() {
  return useQuery({
    queryKey: ["sponsor_categories"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("sponsor_categories")
        .select("*")
        .order("name")
      if (error) throw error
      return data as SponsorCategory[]
    },
  })
}
