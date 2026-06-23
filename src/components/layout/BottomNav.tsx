import { useState } from "react"
import { NavLink, useNavigate } from "react-router-dom"
import { KeyRound, LogIn, LogOut, MoreHorizontal } from "lucide-react"
import { BOTTOM_NAV_PRIMARY, BOTTOM_NAV_MORE } from "@/lib/navigation"
import { useAuth } from "@/hooks/useAuth"
import { cn } from "@/lib/utils"
import { Separator } from "@/components/ui/separator"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"

const navLinkClasses =
  "flex flex-1 flex-col items-center justify-center gap-1 text-xs font-medium text-muted-foreground transition-colors"

export function BottomNav() {
  const [moreOpen, setMoreOpen] = useState(false)
  const { user, signOut } = useAuth()
  const navigate = useNavigate()

  const isLoggedIn = !!user

  return (
    <nav className="flex h-16 shrink-0 items-stretch border-t border-border bg-card md:hidden">
      {BOTTOM_NAV_PRIMARY.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          end={item.to === "/"}
          className={({ isActive }) => cn(navLinkClasses, isActive && "text-saffron")}
        >
          <item.icon className="size-5" />
          {item.shortLabel ?? item.label}
        </NavLink>
      ))}

      <Sheet open={moreOpen} onOpenChange={setMoreOpen}>
        <SheetTrigger className={navLinkClasses}>
          <MoreHorizontal className="size-5" />
          More
        </SheetTrigger>
        <SheetContent side="bottom">
          <SheetHeader>
            <SheetTitle>More</SheetTitle>
          </SheetHeader>
          <div className="flex flex-col gap-1 px-4 pb-4">
            {BOTTOM_NAV_MORE.filter((item) => !item.requiresAuth || isLoggedIn).map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={() => setMoreOpen(false)}
                className={({ isActive }) =>
                  cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-foreground/80 transition-colors hover:bg-muted",
                    isActive && "bg-muted text-foreground"
                  )
                }
              >
                <item.icon className="size-4" />
                {item.label}
              </NavLink>
            ))}
            <Separator className="my-1" />
            {isLoggedIn ? (
              <>
                <button
                  type="button"
                  onClick={() => {
                    setMoreOpen(false)
                    navigate("/set-password")
                  }}
                  className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-foreground/80 transition-colors hover:bg-muted"
                >
                  <KeyRound className="size-4" />
                  Change password
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setMoreOpen(false)
                    void signOut()
                  }}
                  className="flex items-center gap-3 rounded-lg px-3 py-2 text-left text-sm font-medium text-destructive transition-colors hover:bg-destructive/10"
                >
                  <LogOut className="size-4" />
                  Sign out
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={() => {
                  setMoreOpen(false)
                  navigate("/login")
                }}
                className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-foreground/80 transition-colors hover:bg-muted"
              >
                <LogIn className="size-4" />
                Log in
              </button>
            )}
          </div>
        </SheetContent>
      </Sheet>
    </nav>
  )
}
