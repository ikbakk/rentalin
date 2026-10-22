"use client"

import { useState, use } from "react"
import { useInspectionById, useCompleteInspection, useFailInspection } from "@/hooks/use-inspections"
import { useVehicleById } from "@/hooks/use-vehicle-by-id"
import { StatusChip } from "@/components/shared/status-chip"
import { EmptyState } from "@/components/shared/empty-state"
import { ListSkeleton } from "@/components/shared/loading-skeleton"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { InspectionPhoto } from "@/components/shared/inspection-photo"
import { FileUpload } from "@/components/shared/file-upload"
import { toast } from "sonner"
import { ChevronLeft, Camera, CheckCircle2, XCircle, Image, AlertTriangle } from "lucide-react"
import Link from "next/link"
import { cn } from "@/lib/utils"

export default function InspectionDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const [completeDialogOpen, setCompleteDialogOpen] = useState(false)
  const [failDialogOpen, setFailDialogOpen] = useState(false)
  const [failReason, setFailReason] = useState("")
  const [inspectionNotes, setInspectionNotes] = useState("")
  const [addedPhotoId, setAddedPhotoId] = useState<string | null>(null)

  const inspectionId = id

  return <InspectionDetailContent
    inspectionId={inspectionId}
    completeDialogOpen={completeDialogOpen}
    setCompleteDialogOpen={setCompleteDialogOpen}
    failDialogOpen={failDialogOpen}
    setFailDialogOpen={setFailDialogOpen}
    failReason={failReason}
    setFailReason={setFailReason}
    inspectionNotes={inspectionNotes}
    setInspectionNotes={setInspectionNotes}
    addedPhotoId={addedPhotoId}
    setAddedPhotoId={setAddedPhotoId}
  />
}

interface InspectionDetailContentProps {
  inspectionId: string
  completeDialogOpen: boolean
  setCompleteDialogOpen: (open: boolean) => void
  failDialogOpen: boolean
  setFailDialogOpen: (open: boolean) => void
  failReason: string
  setFailReason: (reason: string) => void
  inspectionNotes: string
  setInspectionNotes: (notes: string) => void
  addedPhotoId: string | null
  setAddedPhotoId: (id: string | null) => void
}

function InspectionDetailContent({
  inspectionId,
  completeDialogOpen,
  setCompleteDialogOpen,
  failDialogOpen,
  setFailDialogOpen,
  failReason,
  setFailReason,
  inspectionNotes,
  setInspectionNotes,
  addedPhotoId,
  setAddedPhotoId,
}: InspectionDetailContentProps) {
  const { data: inspection, isLoading } = useInspectionById(inspectionId)
  const { data: vehicle } = useVehicleById(inspection?.vehicleId ?? "")
  const [uploading, setUploading] = useState(false)
  const completeInspection = useCompleteInspection()
  const failInspection = useFailInspection()

  if (isLoading) {
    return (
      <div className="p-4 lg:p-6">
        <div className="flex items-center gap-4 mb-6">
          <div className="h-8 w-8 animate-pulse rounded-lg bg-muted" />
          <div className="h-8 w-48 animate-pulse rounded-lg bg-muted" />
        </div>
        <ListSkeleton count={3} />
      </div>
    )
  }

  if (!inspection) {
    return (
      <div className="p-4 lg:p-6">
        <EmptyState
          title="Inspection not found"
          description="This inspection may have been removed or does not exist."
        />
      </div>
    )
  }

  const typeColors: Record<string, string> = {
    PreRental: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
    PostRental: "bg-purple-500/10 text-purple-600 dark:text-purple-400",
  }

  const handleComplete = async () => {
    try {
      await completeInspection.mutateAsync({
        id: inspectionId,
        photoUrls: [...(inspection.photoStorageIds ?? []), ...(addedPhotoId ? [addedPhotoId] : [])],
        notes: inspectionNotes,
      })
      toast.success("Inspection completed")
      setCompleteDialogOpen(false)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Inspection could not be completed")
    }
  }

  const handleFail = async () => {
    if (!failReason.trim()) return
    try {
      await failInspection.mutateAsync({ id: inspectionId, reason: failReason })
      toast.success("Inspection failed; vehicle moved to maintenance")
      setFailDialogOpen(false)
      setFailReason("")
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Inspection could not be failed")
    }
  }

  return (
    <div className="pb-20 lg:pb-6">
      <div className="border-b border-border px-4 py-4 lg:px-6">
        <Link
          href="/inspections"
          className="mb-3 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ChevronLeft className="size-4" />
          Back to Inspections
        </Link>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex size-12 items-center justify-center rounded-xl bg-primary/10">
              <Camera className="size-6 text-primary" />
            </div>
            <div>
              <h1 className="text-xl font-bold">Inspection</h1>
              <p className="text-sm text-muted-foreground">
                {vehicle?.licensePlate} - {vehicle?.make} {vehicle?.model}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className={cn("font-medium", typeColors[inspection.inspectionType])}>
              {inspection.inspectionType}
            </Badge>
            <StatusChip status={inspection.status} />
          </div>
        </div>
      </div>

      <div className="px-4 py-4 lg:px-6 space-y-4">
        {inspection.photoUrls && inspection.photoUrls.length > 0 ? (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Image className="size-5" />
                Photos ({inspection.photoUrls.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-2">
                {inspection.photoUrls.map((url, i) => (
                  <div
                    key={i}
                    className="aspect-square rounded-lg bg-muted overflow-hidden cursor-pointer hover:ring-2 ring-primary transition-all"
                  >
                    <InspectionPhoto reference={url} alt={`Inspection photo ${i + 1}`} className="w-full h-full object-cover" />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-8 text-center">
              <Camera className="size-10 text-muted-foreground mb-2" />
              <p className="text-sm text-muted-foreground">No photos captured yet</p>
              <p className="text-xs text-muted-foreground">Start the inspection to add photos</p>
            </CardContent>
          </Card>
        )}

        {inspection.status === "Pending" && (
          <Card>
            <CardHeader className="pb-3"><CardTitle className="text-base">Record inspection evidence</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-muted-foreground">Add a vehicle photo and notes before recording the inspection result.</p>
              <FileUpload onUploadingChange={setUploading} onUpload={setAddedPhotoId} onRemove={() => setAddedPhotoId(null)} />
              <p className="text-xs text-muted-foreground">Existing photos: {inspection.photoUrls.length}. One additional photo can be added here.</p>
              <Textarea value={inspectionNotes} onChange={(event) => setInspectionNotes(event.target.value)} maxLength={2000} placeholder="Inspection notes or condition findings" />
            </CardContent>
          </Card>
        )}

        {inspection.notes && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Notes</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm whitespace-pre-wrap">{inspection.notes}</p>
            </CardContent>
          </Card>
        )}

        {inspection.status !== "Completed" && inspection.status !== "Failed" && (
          <div className="flex gap-3 pt-4">
            <Button
              variant="outline"
              className="flex-1 gap-2 text-destructive border-destructive/30 hover:bg-destructive/10"
              onClick={() => setFailDialogOpen(true)}
            >
              <XCircle className="size-5" />
              Fail — Report Damage
            </Button>
            <Button
              className="flex-1 gap-2 bg-success hover:bg-success/90 text-success-foreground"
              onClick={() => setCompleteDialogOpen(true)}
            >
              <CheckCircle2 className="size-5" />
              Pass Inspection
            </Button>
          </div>
        )}
      </div>

      <Dialog open={completeDialogOpen} onOpenChange={setCompleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Complete Inspection</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Confirm that this vehicle has passed inspection and is ready for use.
            </p>
            <DialogFooter>
              <Button variant="outline" onClick={() => setCompleteDialogOpen(false)}>
                Cancel
              </Button>
              <Button
                className="gap-2 bg-success hover:bg-success/90"
                onClick={handleComplete}
                disabled={uploading || completeInspection.isPending || inspectionNotes.length > 2000}
              >
                <CheckCircle2 className="size-4" />
                Confirm Pass
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={failDialogOpen} onOpenChange={setFailDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-destructive flex items-center gap-2">
              <AlertTriangle className="size-5" />
              Fail Inspection
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Report damage found during inspection. The vehicle will be moved to Maintenance status.
            </p>
            <div className="space-y-2">
              <Label htmlFor="fail-reason">Reason for failure</Label>
              <Textarea
                id="fail-reason"
                value={failReason}
                onChange={(e) => setFailReason(e.target.value)}
                placeholder="Describe the damage found..."
                className="min-h-[100px]"
              />
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setFailDialogOpen(false)}>
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={handleFail}
                disabled={uploading || !failReason.trim() || failInspection.isPending}
              >
                Create Damage Record
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
