"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import type { UseMutationResult } from "@tanstack/react-query"
import type { RentalResponse } from "@/lib/types"

export function StartRentalDialog({ open, reservationId, onClose, mutate }: {
  open: boolean; reservationId: string | null; onClose: () => void;
  mutate: UseMutationResult<RentalResponse, Error, { reservationId: string; odometerStart: number }>
}) {
  const [odometer, setOdometer] = useState(0)

  const submit = async () => {
    if (!reservationId) return
    try {
      await mutate.mutateAsync({ reservationId, odometerStart: odometer })
      toast.success("Rental started")
      onClose()
      setOdometer(0)
    } catch { toast.error("Failed to start rental") }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onClose() }}>
      <DialogContent>
        <DialogHeader><DialogTitle>Start Rental</DialogTitle></DialogHeader>
        <div className="flex flex-col gap-3">
          <div><Label htmlFor="start-odometer">Odometer Reading (km)</Label><Input id="start-odometer" type="number" value={odometer} onChange={e => setOdometer(+e.target.value)} /></div>
          <Button onClick={submit} disabled={mutate.isPending}>Start Rental</Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
