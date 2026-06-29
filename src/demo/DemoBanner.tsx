import { Link } from "react-router-dom"

export function DemoBanner() {
  return (
    <div className="flex items-center justify-center gap-4 bg-saffron px-4 py-2 text-sm font-semibold text-primary-foreground">
      <span>Demo Mode — showing sample data</span>
      <Link
        to="/"
        className="rounded-md border border-primary-foreground/50 px-3 py-1 text-xs font-medium transition-colors hover:bg-primary-foreground/10"
      >
        Exit demo
      </Link>
    </div>
  )
}
