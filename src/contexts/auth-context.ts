import { createContext } from "react"
import type { User } from "@supabase/supabase-js"
import type { Profile } from "@/types"

export interface AuthContextValue {
  user: User | null
  profile: Profile | null
  loading: boolean
  signOut: () => Promise<void>
}

export const AuthContext = createContext<AuthContextValue | undefined>(undefined)
