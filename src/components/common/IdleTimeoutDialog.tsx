import { useCallback } from "react"
import { toast } from "sonner"
import { useAuth } from "@/hooks/useAuth"
import { useIdleTimer } from "@/hooks/useIdleTimer"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

const IDLE_TIME = 30 * 60 * 1000
const WARNING_TIME = 60 * 1000

export function IdleTimeoutDialog() {
  const { user, signOut } = useAuth()

  const handleIdle = useCallback(() => {
    void signOut()
    toast.info("You've been signed out due to inactivity.")
  }, [signOut])

  const { showWarning, secondsRemaining, stayActive } = useIdleTimer({
    idleTime: IDLE_TIME,
    warningTime: WARNING_TIME,
    onIdle: handleIdle,
    enabled: !!user,
  })

  return (
    <AlertDialog open={showWarning}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Are you still there?</AlertDialogTitle>
          <AlertDialogDescription>
            You'll be signed out due to inactivity in {secondsRemaining}{" "}
            second{secondsRemaining === 1 ? "" : "s"}.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogAction onClick={stayActive}>Stay signed in</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
