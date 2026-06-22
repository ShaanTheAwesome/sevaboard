import { useCallback, useEffect, useState, type ReactNode } from "react"
import type { Session } from "@supabase/supabase-js"
import { useQuery } from "@tanstack/react-query"
import { supabase } from "@/lib/supabase"
import { AuthContext } from "./auth-context"

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [sessionLoading, setSessionLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session)
      setSessionLoading(false)
    })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession)
    })

    return () => subscription.unsubscribe()
  }, [])

  const userId = session?.user?.id

  const { data: profile, isLoading: profileLoading } = useQuery({
    queryKey: ["profile", userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId!)
        .single()

      if (error) throw error
      return data
    },
    enabled: !!userId,
  })

  const signOut = useCallback(async () => {
    await supabase.auth.signOut()
  }, [])

  return (
    <AuthContext.Provider
      value={{
        user: session?.user ?? null,
        profile: profile ?? null,
        loading: sessionLoading || (!!userId && profileLoading),
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}
