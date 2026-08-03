"use client"

import { useState, useCallback } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { useCompleteInspection } from "@/hooks/use-inspections"
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
  const [notes, setNotes] = useState("")
  const [photoUrls, setPhotoUrls] = useState<string[]>([])
  const completeInspection = useCompleteInspection()

  const addPhoto = useCallback((url: string) => {
    setPhotoUrls((prev) => [...prev, url])
  }, [])

  const submit = async () => {
    if (!inspectionId) return
    try {
      await completeInspection.mutateAsync({ id: inspectionId, photoUrls })
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
                  <img src={url} alt="" className="size-full object-cover" />
                </div>
              ))}
              <FileUpload onUpload={addPhoto} />
            </div>
          </div>
          <div>
            <Label>Notes</Label>
            <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Inspection notes..." />
          </div>
          <Button onClick={submit} disabled={completeInspection.isPending}>
            Complete Inspection
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
