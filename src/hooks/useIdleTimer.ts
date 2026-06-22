import { useCallback, useEffect, useRef, useState } from "react"

const ACTIVITY_EVENTS = ["mousedown", "mousemove", "keydown", "scroll", "touchstart", "wheel"] as const
const THROTTLE_MS = 1000

interface UseIdleTimerOptions {
  idleTime: number
  warningTime: number
  onIdle: () => void
  enabled?: boolean
}

export function useIdleTimer({ idleTime, warningTime, onIdle, enabled = true }: UseIdleTimerOptions) {
  const [showWarning, setShowWarning] = useState(false)
  const [secondsRemaining, setSecondsRemaining] = useState(Math.ceil(warningTime / 1000))

  const idleTimeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const warningTimeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const countdownIntervalRef = useRef<ReturnType<typeof setInterval> | undefined>(undefined)
  const lastResetRef = useRef(0)

  const clearTimers = useCallback(() => {
    clearTimeout(idleTimeoutRef.current)
    clearTimeout(warningTimeoutRef.current)
    clearInterval(countdownIntervalRef.current)
  }, [])

  const startTimers = useCallback(() => {
    clearTimers()

    warningTimeoutRef.current = setTimeout(() => {
      setShowWarning(true)
      countdownIntervalRef.current = setInterval(() => {
        setSecondsRemaining((seconds) => Math.max(0, seconds - 1))
      }, 1000)
    }, idleTime - warningTime)

    idleTimeoutRef.current = setTimeout(() => {
      clearTimers()
      setShowWarning(false)
      onIdle()
    }, idleTime)
  }, [idleTime, warningTime, onIdle, clearTimers])

  const reset = useCallback(() => {
    setShowWarning(false)
    setSecondsRemaining(Math.ceil(warningTime / 1000))
    startTimers()
  }, [warningTime, startTimers])

  useEffect(() => {
    if (!enabled) {
      clearTimers()
      return
    }

    startTimers()

    const handleActivity = () => {
      const now = Date.now()
      if (now - lastResetRef.current < THROTTLE_MS) return
      lastResetRef.current = now
      reset()
    }

    for (const event of ACTIVITY_EVENTS) {
      window.addEventListener(event, handleActivity, { passive: true })
    }

    return () => {
      for (const event of ACTIVITY_EVENTS) {
        window.removeEventListener(event, handleActivity)
      }
      clearTimers()
    }
  }, [enabled, startTimers, reset, clearTimers])

  return { showWarning, secondsRemaining, stayActive: reset }
}
