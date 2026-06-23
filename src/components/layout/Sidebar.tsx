import { useState } from "react"
import { NavLink, useNavigate } from "react-router-dom"
import { ChevronUp, Flame, KeyRound, LogIn, LogOut, Moon, Sun } from "lucide-react"
import { useTheme } from "next-themes"
import { NAV_ITEMS } from "@/lib/navigation"
import { useAuth } from "@/hooks/useAuth"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { ROLE_LABELS } from "@/types"
import { cn, getInitials } from "@/lib/utils"

export function Sidebar() {
  const { user, profile, signOut } = useAuth()
  const { theme, setTheme } = useTheme()
  const navigate = useNavigate()
  const [accountOpen, setAccountOpen] = useState(false)

  const isLoggedIn = !!user

  return (
    <aside className="hidden w-64 shrink-0 flex-col border-r border-sidebar-border bg-sidebar md:flex">
      <div className="flex items-center justify-between gap-2 px-6 py-5">
        <div className="flex items-center gap-2">
          <div className="flex size-9 items-center justify-center rounded-full bg-gradient-to-br from-saffron to-gold">
            <Flame className="size-5 text-primary-foreground" />
          </div>
          <span className="font-heading text-lg font-semibold text-sidebar-foreground">
            SevaBoard
          </span>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground"
          aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
        >
          {theme === "dark" ? <Sun className="size-4" /> : <Moon className="size-4" />}
        </Button>
      </div>

      <nav className="flex flex-1 flex-col gap-1 px-3">
        {NAV_ITEMS.filter((item) => !item.requiresAuth || isLoggedIn).map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === "/"}
            className={({ isActive }) =>
              cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-sidebar-foreground/70 transition-colors hover:bg-sidebar-accent hover:text-sidebar-foreground",
                isActive && "bg-sidebar-accent text-sidebar-foreground"
              )
            }
          >
            <item.icon className="size-4 shrink-0" />
            {item.label}
          </NavLink>
        ))}
      </nav>

      {isLoggedIn ? (
        <>
          {accountOpen && (
            <div className="border-t border-sidebar-border px-3 py-2">
              <div className="flex items-center gap-3 rounded-lg px-3 py-2">
                <Avatar className="size-10">
                  <AvatarFallback>{getInitials(profile?.full_name ?? null)}</AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-sidebar-foreground">
                    {profile?.full_name || "Unnamed"}
                  </p>
                  <p className="truncate text-xs text-muted-foreground">
                    {profile?.email}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {profile ? ROLE_LABELS[profile.role] : ""}
                  </p>
                </div>
              </div>
              <Separator className="my-1 bg-sidebar-border" />
              <button
                type="button"
                onClick={() => {
                  setAccountOpen(false)
                  navigate("/set-password")
                }}
                className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-sidebar-foreground/70 transition-colors hover:bg-sidebar-accent hover:text-sidebar-foreground hover:cursor-pointer"
              >
                <KeyRound className="size-4" />
                Change password
              </button>
              <button
                type="button"
                onClick={() => {
                  setAccountOpen(false)
                  void signOut()
                }}
                className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-destructive transition-colors hover:bg-destructive/10 hover:cursor-pointer"
              >
                <LogOut className="size-4" />
                Sign out
              </button>
            </div>
          )}

          <button
            type="button"
            onClick={() => setAccountOpen((open) => !open)}
            className="flex w-full items-center gap-3 border-t border-sidebar-border px-4 py-4 text-left transition-colors hover:bg-sidebar-accent hover:cursor-pointer"
          >
            <Avatar className="size-9">
              <AvatarFallback>{getInitials(profile?.full_name ?? null)}</AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-sidebar-foreground">
                {profile?.full_name || "Unnamed"}
              </p>
              <p className="truncate text-xs text-muted-foreground">
                {profile ? ROLE_LABELS[profile.role] : ""}
              </p>
            </div>
            <ChevronUp
              className={cn(
                "size-4 shrink-0 text-sidebar-foreground/50 transition-transform duration-200",
                !accountOpen && "rotate-180"
              )}
            />
          </button>
        </>
      ) : (
        <button
          type="button"
          onClick={() => navigate("/login")}
          className="flex w-full items-center gap-3 border-t border-sidebar-border px-4 py-4 text-left text-sm font-medium text-sidebar-foreground/70 transition-colors hover:bg-sidebar-accent hover:text-sidebar-foreground hover:cursor-pointer"
        >
          <LogIn className="size-4" />
          Log in
        </button>
      )}
    </aside>
  )
}
