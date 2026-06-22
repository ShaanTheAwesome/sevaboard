import type { ReactNode } from "react"
import { useAuth } from "@/hooks/useAuth"
import type { UserRole } from "@/types"

interface RoleGateProps {
  allow: UserRole[]
  children: ReactNode
  fallback?: ReactNode
}

export function RoleGate({ allow, children, fallback = null }: RoleGateProps) {
  const { profile } = useAuth()

  if (!profile || !allow.includes(profile.role)) {
    return <>{fallback}</>
  }

  return <>{children}</>
}
