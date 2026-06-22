import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { format, parseISO } from "date-fns"
import { ExternalLink, MapPin, Pencil } from "lucide-react"
import { toast } from "sonner"
import { supabase } from "@/lib/supabase"
import { cn } from "@/lib/utils"
import { useAuth } from "@/hooks/useAuth"
import { useVenueDetails } from "@/hooks/useVenueDetails"
import { PageHeader } from "@/components/common/PageHeader"
import { RoleGate } from "@/components/common/RoleGate"
import { Button, buttonVariants } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Skeleton } from "@/components/ui/skeleton"
import { Field, FieldGroup, FieldLabel, FieldError } from "@/components/ui/field"
import type { VenueDetails } from "@/types"

const venueDetailsSchema = z.object({
  venue_name: z.string(),
  address: z.string(),
  event_date: z.string(),
  event_time: z.string(),
  map_link: z.literal("").or(z.string().url("Enter a valid URL (include https://)")),
  parking_notes: z.string(),
  other_notes: z.string(),
})

type VenueDetailsFormValues = z.infer<typeof venueDetailsSchema>

function toFormValues(data: VenueDetails | undefined): VenueDetailsFormValues {
  return {
    venue_name: data?.venue_name ?? "",
    address: data?.address ?? "",
    event_date: data?.event_date ?? "",
    event_time: data?.event_time?.slice(0, 5) ?? "",
    map_link: data?.map_link ?? "",
    parking_notes: data?.parking_notes ?? "",
    other_notes: data?.other_notes ?? "",
  }
}

function formatEventDate(dateStr: string | null | undefined) {
  if (!dateStr) return null
  return format(parseISO(dateStr), "EEEE, MMMM d, yyyy")
}

function formatEventTime(timeStr: string | null | undefined) {
  if (!timeStr) return null
  const [hours, minutes] = timeStr.split(":").map(Number)
  const date = new Date()
  date.setHours(hours, minutes, 0, 0)
  return format(date, "h:mm a")
}

function DetailRow({
  label,
  value,
  multiline = false,
}: {
  label: string
  value?: string | null
  multiline?: boolean
}) {
  return (
    <div>
      <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
        {label}
      </p>
      {value ? (
        <p className={cn("text-sm text-foreground", multiline && "whitespace-pre-line")}>
          {value}
        </p>
      ) : (
        <p className="text-sm text-muted-foreground italic">Not set</p>
      )}
    </div>
  )
}

export function VenueDetailsPage() {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const { data, isLoading } = useVenueDetails()
  const [isEditing, setIsEditing] = useState(false)

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<VenueDetailsFormValues>({
    resolver: zodResolver(venueDetailsSchema),
    defaultValues: toFormValues(undefined),
  })

  const mutation = useMutation({
    mutationFn: async (values: VenueDetailsFormValues) => {
      const { error } = await supabase
        .from("venue_details")
        .update({
          venue_name: values.venue_name || null,
          address: values.address || null,
          event_date: values.event_date || null,
          event_time: values.event_time || null,
          map_link: values.map_link || null,
          parking_notes: values.parking_notes || null,
          other_notes: values.other_notes || null,
          updated_by: user?.id ?? null,
        })
        .eq("id", 1)

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["venue_details"] })
      toast.success("Venue details updated")
      setIsEditing(false)
    },
    onError: (error) => {
      toast.error(error.message)
    },
  })

  const onSubmit = handleSubmit((values) => mutation.mutate(values))

  const handleEdit = () => {
    reset(toFormValues(data))
    setIsEditing(true)
  }

  if (isLoading) {
    return (
      <div>
        <PageHeader
          title="Venue Details"
          description="Address, schedule, and logistics for the event venue."
        />
        <div className="grid gap-4 md:grid-cols-2">
          <Skeleton className="h-48" />
          <Skeleton className="h-48" />
        </div>
      </div>
    )
  }

  return (
    <div>
      <PageHeader
        title="Venue Details"
        description="Address, schedule, and logistics for the event venue."
        action={
          isEditing ? (
            <>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsEditing(false)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button type="submit" form="venue-details-form" disabled={isSubmitting}>
                {isSubmitting ? "Saving..." : "Save"}
              </Button>
            </>
          ) : (
            <RoleGate allow={["admin", "team_lead"]}>
              <Button onClick={handleEdit}>
                <Pencil />
                Edit
              </Button>
            </RoleGate>
          )
        }
      />

      {isEditing ? (
        <form id="venue-details-form" onSubmit={onSubmit} noValidate>
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Event</CardTitle>
              </CardHeader>
              <CardContent>
                <FieldGroup>
                  <Field data-invalid={!!errors.venue_name}>
                    <FieldLabel htmlFor="venue_name">Venue name</FieldLabel>
                    <Input
                      id="venue_name"
                      aria-invalid={!!errors.venue_name}
                      {...register("venue_name")}
                    />
                    <FieldError errors={[errors.venue_name]} />
                  </Field>

                  <div className="grid grid-cols-2 gap-4">
                    <Field data-invalid={!!errors.event_date}>
                      <FieldLabel htmlFor="event_date">Event date</FieldLabel>
                      <Input
                        id="event_date"
                        type="date"
                        aria-invalid={!!errors.event_date}
                        {...register("event_date")}
                      />
                      <FieldError errors={[errors.event_date]} />
                    </Field>

                    <Field data-invalid={!!errors.event_time}>
                      <FieldLabel htmlFor="event_time">Event time</FieldLabel>
                      <Input
                        id="event_time"
                        type="time"
                        aria-invalid={!!errors.event_time}
                        {...register("event_time")}
                      />
                      <FieldError errors={[errors.event_time]} />
                    </Field>
                  </div>
                </FieldGroup>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Location</CardTitle>
              </CardHeader>
              <CardContent>
                <FieldGroup>
                  <Field data-invalid={!!errors.address}>
                    <FieldLabel htmlFor="address">Address</FieldLabel>
                    <Textarea
                      id="address"
                      rows={3}
                      aria-invalid={!!errors.address}
                      {...register("address")}
                    />
                    <FieldError errors={[errors.address]} />
                  </Field>

                  <Field data-invalid={!!errors.map_link}>
                    <FieldLabel htmlFor="map_link">Map link</FieldLabel>
                    <Input
                      id="map_link"
                      type="url"
                      placeholder="https://maps.google.com/..."
                      aria-invalid={!!errors.map_link}
                      {...register("map_link")}
                    />
                    <FieldError errors={[errors.map_link]} />
                  </Field>
                </FieldGroup>
              </CardContent>
            </Card>
          </div>

          <Card className="mt-4">
            <CardHeader>
              <CardTitle>Notes</CardTitle>
            </CardHeader>
            <CardContent>
              <FieldGroup>
                <Field data-invalid={!!errors.parking_notes}>
                  <FieldLabel htmlFor="parking_notes">Parking</FieldLabel>
                  <Textarea
                    id="parking_notes"
                    rows={3}
                    aria-invalid={!!errors.parking_notes}
                    {...register("parking_notes")}
                  />
                  <FieldError errors={[errors.parking_notes]} />
                </Field>

                <Field data-invalid={!!errors.other_notes}>
                  <FieldLabel htmlFor="other_notes">Other notes</FieldLabel>
                  <Textarea
                    id="other_notes"
                    rows={3}
                    aria-invalid={!!errors.other_notes}
                    {...register("other_notes")}
                  />
                  <FieldError errors={[errors.other_notes]} />
                </Field>
              </FieldGroup>
            </CardContent>
          </Card>
        </form>
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Event</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <DetailRow label="Venue" value={data?.venue_name} />
                <DetailRow label="Date" value={formatEventDate(data?.event_date)} />
                <DetailRow label="Time" value={formatEventTime(data?.event_time)} />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Location</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <DetailRow label="Address" value={data?.address} multiline />
                {data?.map_link && (
                  <a
                    href={data.map_link}
                    target="_blank"
                    rel="noreferrer"
                    className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
                  >
                    <MapPin />
                    Open in Maps
                    <ExternalLink />
                  </a>
                )}
              </CardContent>
            </Card>
          </div>

          <Card className="mt-4">
            <CardHeader>
              <CardTitle>Notes</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <DetailRow label="Parking" value={data?.parking_notes} multiline />
              <DetailRow label="Other notes" value={data?.other_notes} multiline />
            </CardContent>
          </Card>

          {data?.updated_at && (
            <p className="mt-4 text-xs text-muted-foreground">
              Last updated {format(parseISO(data.updated_at), "MMM d, yyyy 'at' h:mm a")}
            </p>
          )}
        </>
      )}
    </div>
  )
}
