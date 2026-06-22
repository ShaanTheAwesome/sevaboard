import { useState } from "react"
import { Music, Plus, Settings } from "lucide-react"
import { useAuth } from "@/hooks/useAuth"
import { useRooms } from "@/hooks/useRooms"
import { useProgramItems } from "@/hooks/useProgramItems"
import { PageHeader } from "@/components/common/PageHeader"
import { RoleGate } from "@/components/common/RoleGate"
import { EmptyState } from "@/components/common/EmptyState"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import type { ProgramItem } from "@/types"
import { ScheduleGrid } from "./ScheduleGrid"
import { EventFormSheet } from "./EventFormSheet"
import { RoomSettingsSheet } from "./RoomSettingsSheet"
import { minutesToTime, SCHEDULE_START } from "./schedule-helpers"

export function ProgramPlannerPage() {
  const { profile } = useAuth()
  const { data: rooms, isLoading: roomsLoading } = useRooms()
  const { data: items, isLoading: itemsLoading } = useProgramItems()

  const [eventSheetOpen, setEventSheetOpen] = useState(false)
  const [editingEvent, setEditingEvent] = useState<ProgramItem | null>(null)
  const [eventSheetKey, setEventSheetKey] = useState(0)
  const [defaultRoomId, setDefaultRoomId] = useState<string | undefined>()
  const [defaultColumnName, setDefaultColumnName] = useState<string | undefined>()
  const [defaultStartTime, setDefaultStartTime] = useState<string | undefined>()

  const [roomSettingsOpen, setRoomSettingsOpen] = useState(false)

  const canEdit = profile?.role === "admin" || profile?.role === "team_lead"
  const isLoading = roomsLoading || itemsLoading

  const handleAddEvent = () => {
    setEditingEvent(null)
    setDefaultRoomId(rooms?.[0]?.id)
    setDefaultColumnName(rooms?.[0]?.columns[0] as string | undefined)
    setDefaultStartTime(minutesToTime(SCHEDULE_START))
    setEventSheetKey((k) => k + 1)
    setEventSheetOpen(true)
  }

  const handleCellClick = (roomId: string, columnName: string, startTime: string) => {
    setEditingEvent(null)
    setDefaultRoomId(roomId)
    setDefaultColumnName(columnName)
    setDefaultStartTime(startTime)
    setEventSheetKey((k) => k + 1)
    setEventSheetOpen(true)
  }

  const handleEventClick = (item: ProgramItem) => {
    if (!canEdit) return
    setEditingEvent(item)
    setDefaultRoomId(undefined)
    setDefaultColumnName(undefined)
    setDefaultStartTime(undefined)
    setEventSheetKey((k) => k + 1)
    setEventSheetOpen(true)
  }

  if (isLoading) {
    return (
      <div>
        <PageHeader
          title="Program Planner"
          description="Schedule activities across rooms for the event."
        />
        <Skeleton className="h-96" />
      </div>
    )
  }

  return (
    <div>
      <PageHeader
        title="Program Planner"
        description="Schedule activities across rooms for the event."
        action={
          <RoleGate allow={["admin", "team_lead"]}>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setRoomSettingsOpen(true)}>
                <Settings />
                Rooms
              </Button>
              <Button onClick={handleAddEvent}>
                <Plus />
                Add event
              </Button>
            </div>
          </RoleGate>
        }
      />

      {!rooms || rooms.length === 0 ? (
        <EmptyState
          icon={Music}
          title="No rooms configured"
          description={
            canEdit
              ? "Open Room Settings to add your first room."
              : "Rooms will appear here once a lead or admin sets them up."
          }
        />
      ) : (
        <ScheduleGrid
          rooms={rooms}
          items={items ?? []}
          canEdit={canEdit}
          onCellClick={handleCellClick}
          onEventClick={handleEventClick}
        />
      )}

      <EventFormSheet
        key={eventSheetKey}
        open={eventSheetOpen}
        onOpenChange={setEventSheetOpen}
        event={editingEvent}
        rooms={rooms ?? []}
        defaultRoomId={defaultRoomId}
        defaultColumnName={defaultColumnName}
        defaultStartTime={defaultStartTime}
      />

      <RoomSettingsSheet
        open={roomSettingsOpen}
        onOpenChange={setRoomSettingsOpen}
        rooms={rooms ?? []}
      />
    </div>
  )
}
