"use client"

import { useState, useCallback } from "react"
import { useAction } from "convex/react"
import { api } from "../../../../../convex/_generated/api"
import type { Id } from "../../../../../convex/_generated/dataModel"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { useCompleteInspection } from "@/hooks/use-inspections"
import { InspectionPhoto } from "@/components/shared/inspection-photo"
import { FileUpload } from "@/components/shared/file-upload"
import { toast } from "sonner"

export function CompleteInspectionDialog({
  open,
  inspectionId,
  onClose,
}: {
  open: boolean
  inspectionId: string | null
  onClose: () => void
}) {
  const [uploading, setUploading] = useState(false)
  const [notes, setNotes] = useState("")
  const [photoUrls, setPhotoUrls] = useState<string[]>([])
  const removeImage = useAction(api.r2.removeImage)
  const completeInspection = useCompleteInspection()

  const addPhoto = useCallback((url: string) => {
    setPhotoUrls((prev) => [...prev, url])
  }, [])

  const submit = async () => {
    if (!inspectionId) return
    try {
      await completeInspection.mutateAsync({ id: inspectionId, photoUrls, notes })
      toast.success("Inspection completed")
      onClose()
      setNotes("")
      setPhotoUrls([])
    } catch {
      toast.error("Failed to complete inspection")
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onClose() }}>
      <DialogContent>
        <DialogHeader><DialogTitle>Complete Inspection</DialogTitle></DialogHeader>
        <div className="flex flex-col gap-3">
          <div>
            <Label>Photos</Label>
            <div className="flex flex-wrap gap-2 mt-1">
              {photoUrls.map((url, i) => (
                <div key={i} className="relative size-20 rounded-lg overflow-hidden">
                  <InspectionPhoto reference={url} alt="Inspection evidence" className="size-full object-cover" />
                  <Button type="button" variant="destructive" size="icon" className="absolute right-0 top-0 size-6" aria-label="Remove photo" disabled={uploading || completeInspection.isPending} onClick={async () => {
                    try { await removeImage({ id: url.slice(3) as Id<"r2Uploads"> }); setPhotoUrls(photos => photos.filter(photo => photo !== url)) }
                    catch { toast.error("Photo could not be removed") }
                  }}>×</Button>
                </div>
              ))}
              {photoUrls.length < 10 && <FileUpload key={photoUrls.length} onUploadingChange={setUploading} onUpload={addPhoto} />}
            </div>
          </div>
          <div>
            <Label>Notes</Label>
            <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Inspection notes..." />
          </div>
          <Button onClick={submit} disabled={uploading || completeInspection.isPending || photoUrls.length > 10}>
            Complete Inspection
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
