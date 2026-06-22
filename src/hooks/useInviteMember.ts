import { useMutation, useQueryClient } from "@tanstack/react-query"
import { FunctionsHttpError } from "@supabase/supabase-js"
import { supabase } from "@/lib/supabase"
import type { UserRole } from "@/types"

interface InviteMemberInput {
  email: string
  full_name: string
  role: UserRole
  department_id: string | null
}

interface InviteMemberResult {
  success: boolean
  id: string
  warning?: string
}

export function useInviteMember() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (input: InviteMemberInput) => {
      const { data, error } = await supabase.functions.invoke<InviteMemberResult>(
        "invite-member",
        { body: input }
      )

      if (error) {
        if (error instanceof FunctionsHttpError) {
          const body = await error.context.json().catch(() => null)
          throw new Error(body?.error ?? error.message)
        }
        throw new Error(error.message)
      }

      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["profiles"] })
    },
  })
}
