import { useLocation } from "react-router-dom"
import { Flame } from "lucide-react"
import { NAV_ITEMS } from "@/lib/navigation"

export function Topbar() {
  const location = useLocation()

  const currentItem = NAV_ITEMS.find((item) =>
    item.to === "/" ? location.pathname === "/" : location.pathname.startsWith(item.to)
  )

  return (
    <header className="sticky top-0 z-30 flex h-14 shrink-0 items-center justify-between border-b border-border bg-background/95 px-4 backdrop-blur supports-backdrop-filter:bg-background/60 md:px-6">
      <div className="flex items-center gap-2 md:hidden">
        <div className="flex size-7 items-center justify-center rounded-full bg-gradient-to-br from-saffron to-gold">
          <Flame className="size-4 text-primary-foreground" />
        </div>
        <span className="font-heading text-base font-semibold">SevaBoard</span>
      </div>

      <h1 className="hidden font-heading text-lg font-semibold md:block">
        {currentItem?.label ?? "SevaBoard"}
      </h1>
    </header>
  )
}
