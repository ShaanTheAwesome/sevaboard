import { useEffect, useState } from "react"
import { differenceInSeconds, format, parseISO } from "date-fns"
import { useVenueDetails } from "@/hooks/useVenueDetails"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

function getTimeParts(target: Date, now: Date) {
  const totalSeconds = Math.max(0, differenceInSeconds(target, now))
  return {
    days: Math.floor(totalSeconds / 86400),
    hours: Math.floor((totalSeconds % 86400) / 3600),
    minutes: Math.floor((totalSeconds % 3600) / 60),
    seconds: totalSeconds % 60,
    isPast: totalSeconds <= 0,
  }
}

export function CountdownTimer() {
  const [now, setNow] = useState(() => new Date())

  const { data, isLoading } = useVenueDetails()

  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(interval)
  }, [])

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Countdown to Janmashtami</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Loading...</p>
        </CardContent>
      </Card>
    )
  }

  if (!data?.event_date) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Countdown to Janmashtami</CardTitle>
          <CardDescription>
            Set the event date in Venue Details to start the countdown.
          </CardDescription>
        </CardHeader>
      </Card>
    )
  }

  const target = new Date(`${data.event_date}T${data.event_time ?? "00:00:00"}`)
  const { days, hours, minutes, seconds, isPast } = getTimeParts(target, now)

  return (
    <Card className="bg-gradient-to-br from-card to-secondary">
      <CardHeader>
        <CardTitle>Countdown to Janmashtami</CardTitle>
        <CardDescription>
          {data.venue_name && `${data.venue_name} — `}
          {/* until {format(parseISO(data.event_date), "dd/MM/yyyy")} */}
          on {format(parseISO(data.event_date), "EEEE, do MMMM, yyyy")}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isPast ? (
          <p className="text-lg font-semibold text-saffron">The event has arrived!</p>
        ) : (
          <div className="grid grid-cols-4 gap-2 text-center">
            {[
              { label: "Days Left", value: days },
              { label: "Hours Left", value: hours },
              { label: "Minutes Left", value: minutes },
              { label: "Seconds Left", value: seconds },
            ].map((unit) => (
              <div key={unit.label} className="rounded-lg bg-background/40 py-3">
                <p className="font-heading text-2xl font-bold tabular-nums text-saffron">
                  {String(unit.value).padStart(2, "0")}
                </p>
                <p className="text-xs text-muted-foreground uppercase tracking-wide">
                  {unit.label}
                </p>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
