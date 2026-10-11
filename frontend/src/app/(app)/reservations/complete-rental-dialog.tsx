"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"

export function CompleteRentalDialog({ open, rentalId, onClose, mutate }: {
  open: boolean; rentalId: string | null; onClose: () => void;
  mutate: {
    mutateAsync: (data: { rentalId: string; odometerEnd: number }) => Promise<unknown>
    isPending: boolean
  }
}) {
  const [odometer, setOdometer] = useState("")

  const submit = async () => {
    if (!rentalId) return
    const odometerEnd = Number(odometer)
    if (!Number.isSafeInteger(odometerEnd) || odometerEnd < 0) {
      toast.error("Enter a valid whole-number odometer reading")
      return
    }
    try {
      await mutate.mutateAsync({ rentalId, odometerEnd })
      toast.success("Rental completed")
      onClose()
      setOdometer("")
    } catch { toast.error("Failed to complete rental") }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onClose() }}>
      <DialogContent>
        <DialogHeader><DialogTitle>Complete Rental</DialogTitle></DialogHeader>
        <div className="flex flex-col gap-3">
          <div><Label htmlFor="complete-odometer">Odometer Reading (km)</Label><Input id="complete-odometer" type="number" min={0} step={1} inputMode="numeric" value={odometer} onChange={e => setOdometer(e.target.value)} /></div>
          <Button onClick={submit} disabled={mutate.isPending || !odometer}>{mutate.isPending ? "Processing..." : "Complete Rental"}</Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
