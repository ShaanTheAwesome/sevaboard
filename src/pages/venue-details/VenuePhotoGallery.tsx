import { useRef, useState } from "react"
import {
  DndContext,
  PointerSensor,
  TouchSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core"
import { SortableContext, arrayMove, rectSortingStrategy, useSortable } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { GripVertical, ImagePlus, Trash2 } from "lucide-react"
import { supabase } from "@/lib/supabase"
import { cn } from "@/lib/utils"
import { useAuth } from "@/hooks/useAuth"
import { useDemoGuard } from "@/demo/useDemoGuard"
import { useVenuePhotos } from "@/hooks/useVenuePhotos"
import { ConfirmDialog } from "@/components/common/ConfirmDialog"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import type { VenuePhoto } from "@/types"

const MAX_FILE_BYTES = 8 * 1024 * 1024

function photoUrl(imagePath: string) {
  if (/^https?:\/\//.test(imagePath)) return imagePath
  return supabase.storage.from("venue-photos").getPublicUrl(imagePath).data.publicUrl
}

interface SortablePhotoTileProps {
  photo: VenuePhoto
  canEdit: boolean
  onDelete: (photo: VenuePhoto) => void
}

function SortablePhotoTile({ photo, canEdit, onDelete }: SortablePhotoTileProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: photo.id,
    disabled: !canEdit,
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  return (
    <Card
      ref={setNodeRef}
      style={style}
      className={cn("overflow-hidden py-0", isDragging && "opacity-50")}
    >
      <div className="relative">
        <img
          src={photoUrl(photo.image_path)}
          alt={photo.label ?? "Venue photo"}
          className="aspect-video w-full object-cover"
        />
        {canEdit && (
          <div className="absolute top-1.5 right-1.5 flex gap-1">
            <button
              type="button"
              className="flex size-7 cursor-grab touch-none items-center justify-center rounded-md bg-background/80 text-muted-foreground backdrop-blur hover:text-foreground active:cursor-grabbing"
              aria-label="Drag to reorder"
              {...attributes}
              {...listeners}
            >
              <GripVertical className="size-4" />
            </button>
            <Button
              type="button"
              variant="destructive"
              size="icon-sm"
              aria-label="Delete photo"
              onClick={() => onDelete(photo)}
            >
              <Trash2 />
            </Button>
          </div>
        )}
      </div>
      {photo.label && (
        <CardContent className="px-2.5 py-1.5">
          <p className="truncate text-xs font-medium text-foreground">{photo.label}</p>
        </CardContent>
      )}
    </Card>
  )
}

export function VenuePhotoGallery({ canEdit }: { canEdit: boolean }) {
  const { user } = useAuth()
  const demoGuard = useDemoGuard()
  const queryClient = useQueryClient()
  const { data: photos, isLoading } = useVenuePhotos()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [labelDraft, setLabelDraft] = useState("")
  const [deleteTarget, setDeleteTarget] = useState<VenuePhoto | null>(null)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 5 } })
  )

  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      const ext = file.name.split(".").pop() || "jpg"
      const path = `${crypto.randomUUID()}.${ext}`
      const { error: uploadError } = await supabase.storage.from("venue-photos").upload(path, file)
      if (uploadError) throw uploadError

      const { error: insertError } = await supabase.from("venue_photos").insert({
        label: labelDraft.trim() || null,
        image_path: path,
        sort_order: photos?.length ?? 0,
        created_by: user?.id ?? null,
      })
      if (insertError) throw insertError
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["venue_photos"] })
      toast.success("Photo added")
      setLabelDraft("")
    },
    onError: (error) => toast.error(error.message),
  })

  const deleteMutation = useMutation({
    mutationFn: async (photo: VenuePhoto) => {
      if (!/^https?:\/\//.test(photo.image_path)) {
        await supabase.storage.from("venue-photos").remove([photo.image_path])
      }
      const { error } = await supabase.from("venue_photos").delete().eq("id", photo.id)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["venue_photos"] })
      toast.success("Photo removed")
      setDeleteTarget(null)
    },
    onError: (error) => toast.error(error.message),
  })

  const reorderMutation = useMutation({
    mutationFn: async (ordered: VenuePhoto[]) => {
      const results = await Promise.all(
        ordered.map((p, index) =>
          supabase.from("venue_photos").update({ sort_order: index }).eq("id", p.id)
        )
      )
      const failed = results.find((r) => r.error)
      if (failed?.error) throw failed.error
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["venue_photos"] }),
    onError: (error) => toast.error(error.message),
  })

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = ""
    if (!file) return
    if (demoGuard()) return
    if (!file.type.startsWith("image/")) {
      toast.error("Please choose an image file")
      return
    }
    if (file.size > MAX_FILE_BYTES) {
      toast.error("Image must be under 8MB")
      return
    }
    uploadMutation.mutate(file)
  }

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    if (!over || active.id === over.id || !photos) return
    if (demoGuard()) return

    const oldIndex = photos.findIndex((p) => p.id === active.id)
    const newIndex = photos.findIndex((p) => p.id === over.id)
    if (oldIndex === -1 || newIndex === -1) return

    const reordered = arrayMove(photos, oldIndex, newIndex)
    queryClient.setQueryData(["venue_photos"], reordered)
    reorderMutation.mutate(reordered)
  }

  if (isLoading) return null

  return (
    <Card className="mt-4">
      <CardHeader className="flex flex-row items-center justify-between gap-2">
        <CardTitle>Venue Map / Layout</CardTitle>
        {canEdit && (
          <div className="flex items-center gap-2">
            <Input
              value={labelDraft}
              onChange={(e) => setLabelDraft(e.target.value)}
              placeholder="Label (optional)"
              className="h-8 w-36"
            />
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileChange}
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={uploadMutation.isPending}
              onClick={() => {
                if (demoGuard()) return
                fileInputRef.current?.click()
              }}
            >
              <ImagePlus />
              {uploadMutation.isPending ? "Uploading..." : "Add photo"}
            </Button>
          </div>
        )}
      </CardHeader>
      <CardContent>
        {!photos || photos.length === 0 ? (
          <p className="text-sm text-muted-foreground italic">
            {canEdit
              ? "No photos yet — add the venue map/layout for each room."
              : "No photos have been added yet."}
          </p>
        ) : (
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={photos.map((p) => p.id)} strategy={rectSortingStrategy}>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
                {photos.map((photo) => (
                  <SortablePhotoTile
                    key={photo.id}
                    photo={photo}
                    canEdit={canEdit}
                    onDelete={setDeleteTarget}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        )}
      </CardContent>

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title="Delete photo?"
        description={`${deleteTarget?.label ? `"${deleteTarget.label}"` : "This photo"} will be permanently removed.`}
        onConfirm={() => deleteTarget && deleteMutation.mutate(deleteTarget)}
        loading={deleteMutation.isPending}
      />
    </Card>
  )
}
