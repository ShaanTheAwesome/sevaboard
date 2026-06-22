import { cn } from "@/lib/utils"
import type { ProgramItem, Room } from "@/types"
import {
  TIME_SLOTS,
  SLOT_HEIGHT,
  SCHEDULE_START,
  SLOT_MINUTES,
  TOTAL_SLOTS,
  formatTime,
  timeToMinutes,
  ROOM_COLORS,
} from "./schedule-helpers"

interface ScheduleGridProps {
  rooms: Room[]
  items: ProgramItem[]
  canEdit: boolean
  onCellClick: (roomId: string, columnName: string, startTime: string) => void
  onEventClick: (item: ProgramItem) => void
}

export function ScheduleGrid({
  rooms,
  items,
  canEdit,
  onCellClick,
  onEventClick,
}: ScheduleGridProps) {
  const gridHeight = TOTAL_SLOTS * SLOT_HEIGHT

  function getEventsForColumn(roomId: string, columnName: string) {
    return items.filter((item) => {
      if (item.room_id !== roomId) return false
      const itemCol = item.column_name || (rooms.find((r) => r.id === roomId)?.columns[0] ?? "")
      return itemCol === columnName
    })
  }

  function getEventStyle(item: ProgramItem) {
    const startMin = timeToMinutes(item.start_time)
    const endMin = timeToMinutes(item.end_time)
    const startSlot = (startMin - SCHEDULE_START) / SLOT_MINUTES
    const span = (endMin - startMin) / SLOT_MINUTES
    return {
      top: startSlot * SLOT_HEIGHT + 1,
      height: span * SLOT_HEIGHT - 2,
    }
  }

  const totalColumns = rooms.reduce((sum, r) => sum + (r.columns as string[]).length, 0)

  return (
    <div className="overflow-x-auto rounded-lg border border-border">
      <div className="flex" style={{ minWidth: 80 + totalColumns * 150 }}>
        {/* Time labels column */}
        <div className="sticky left-0 z-20 w-20 shrink-0 bg-background">
          {/* Header spacer */}
          <div className="h-16 border-b border-r border-border" />
          {/* Time slots */}
          <div className="relative border-r border-border" style={{ height: gridHeight }}>
            {TIME_SLOTS.map((slotMin, i) => (
              <div
                key={slotMin}
                className="absolute right-0 left-0 flex items-start border-b border-border px-2 pt-1"
                style={{ top: i * SLOT_HEIGHT, height: SLOT_HEIGHT }}
              >
                <span className="text-[11px] font-medium tabular-nums text-muted-foreground">
                  {formatTime(slotMin)}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Room columns */}
        {rooms.map((room) => {
          const roomColumns = room.columns as string[]
          const colors = ROOM_COLORS[room.color] ?? ROOM_COLORS.blue
          return (
            <div key={room.id} className="flex flex-col" style={{ minWidth: roomColumns.length * 150 }}>
              {/* Room header */}
              <div
                className={cn(
                  "flex flex-col border-b border-r border-border",
                  colors.header
                )}
              >
                <div className="px-3 pt-2 text-xs font-semibold text-foreground">
                  {room.name}
                </div>
                <div className="flex">
                  {roomColumns.map((col) => (
                    <div
                      key={col}
                      className="flex-1 border-r border-border/50 px-2 pb-1 pt-0.5 text-center text-[10px] font-medium text-muted-foreground last:border-r-0"
                    >
                      {roomColumns.length > 1 ? col : ""}
                    </div>
                  ))}
                </div>
              </div>

              {/* Sub-columns body */}
              <div className="flex flex-1">
                {roomColumns.map((col) => {
                  const columnEvents = getEventsForColumn(room.id, col)
                  return (
                    <div
                      key={col}
                      className={cn(
                        "relative flex-1 border-r border-border last:border-r-0",
                        colors.bg
                      )}
                      style={{ height: gridHeight, minWidth: 150 }}
                    >
                      {/* Background grid lines */}
                      {TIME_SLOTS.map((slotMin, i) => (
                        <div
                          key={slotMin}
                          className={cn(
                            "absolute right-0 left-0 border-b border-border/40",
                            canEdit && "cursor-pointer hover:bg-foreground/5"
                          )}
                          style={{ top: i * SLOT_HEIGHT, height: SLOT_HEIGHT }}
                          onClick={
                            canEdit
                              ? () => {
                                  const h = Math.floor(slotMin / 60)
                                  const m = slotMin % 60
                                  onCellClick(
                                    room.id,
                                    col,
                                    `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`
                                  )
                                }
                              : undefined
                          }
                        />
                      ))}

                      {/* Events */}
                      {columnEvents.map((item) => {
                        const pos = getEventStyle(item)
                        return (
                          <button
                            key={item.id}
                            type="button"
                            className={cn(
                              "absolute left-0.5 right-0.5 z-10 overflow-hidden rounded border px-1.5 py-1 text-left transition-colors",
                              colors.event,
                              canEdit && "cursor-pointer"
                            )}
                            style={{ top: pos.top, height: pos.height }}
                            onClick={(e) => {
                              e.stopPropagation()
                              onEventClick(item)
                            }}
                          >
                            <p className="truncate text-xs font-medium text-foreground">
                              {item.activity_name}
                            </p>
                            {pos.height > 40 && item.description && (
                              <p className="mt-0.5 line-clamp-2 text-[10px] text-muted-foreground">
                                {item.description}
                              </p>
                            )}
                          </button>
                        )
                      })}
                    </div>
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
