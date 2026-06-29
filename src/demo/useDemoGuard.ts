import { toast } from "sonner"
import { useIsDemo } from "./context"

export function useDemoGuard() {
  const isDemo = useIsDemo()

  return (onClose?: () => void): boolean => {
    if (isDemo) {
      toast.info("Demo mode — changes aren't saved")
      onClose?.()
      return true
    }
    return false
  }
}
