"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import type { UseMutationResult } from "@tanstack/react-query"
import type { RentalResponse } from "@/lib/types"

export function CompleteRentalDialog({ open, rentalId, onClose, mutate }: {
  open: boolean; rentalId: string | null; onClose: () => void;
  mutate: UseMutationResult<RentalResponse, Error, { rentalId: string; odometerEnd: number }>
}) {
  const [odometer, setOdometer] = useState(0)

  const submit = async () => {
    if (!rentalId) return
    try {
      await mutate.mutateAsync({ rentalId, odometerEnd: odometer })
      toast.success("Rental completed")
      onClose()
      setOdometer(0)
    } catch { toast.error("Failed to complete rental") }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onClose() }}>
      <DialogContent>
        <DialogHeader><DialogTitle>Complete Rental</DialogTitle></DialogHeader>
        <div className="flex flex-col gap-3">
          <div><Label>Odometer Reading (km)</Label><Input type="number" value={odometer} onChange={e => setOdometer(+e.target.value)} /></div>
          <Button onClick={submit} disabled={mutate.isPending}>Complete Rental</Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
