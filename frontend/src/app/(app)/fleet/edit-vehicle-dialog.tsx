"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { useUpdateVehicle } from "@/hooks/use-vehicles"
import { toast } from "sonner"
import type { VehicleResponse, UpdateVehicleRequest } from "@/lib/types"

export function EditVehicleDialog({ vehicle, open, onOpenChange }: { vehicle: VehicleResponse; open: boolean; onOpenChange: (v: boolean) => void }) {
  const [form, setForm] = useState<UpdateVehicleRequest>({
    id: vehicle.id,
    licensePlate: vehicle.licensePlate,
    make: vehicle.make,
    model: vehicle.model,
    year: vehicle.year,
    color: vehicle.color,
    seatingCapacity: vehicle.seatingCapacity,
    dailyRate: vehicle.dailyRateAmount,
    currency: vehicle.dailyRateCurrency,
    businessId: vehicle.businessId,
  })
  const updateVehicle = useUpdateVehicle()

  const submit = async () => {
    try {
      await updateVehicle.mutateAsync(form)
      toast.success("Vehicle updated")
      onOpenChange(false)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to update vehicle")
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85dvh] overflow-y-auto">
        <DialogHeader><DialogTitle>Edit Vehicle</DialogTitle></DialogHeader>
        <div className="flex flex-col gap-3">
          <div><Label htmlFor="lp">License Plate</Label><Input id="lp" value={form.licensePlate} onChange={e => setForm({...form, licensePlate: e.target.value})} /></div>
          <div><Label htmlFor="make">Make</Label><Input id="make" value={form.make} onChange={e => setForm({...form, make: e.target.value})} /></div>
          <div><Label htmlFor="model">Model</Label><Input id="model" value={form.model} onChange={e => setForm({...form, model: e.target.value})} /></div>
          <div><Label htmlFor="year">Year</Label><Input id="year" type="number" value={form.year} onChange={e => setForm({...form, year: +e.target.value})} /></div>
          <div><Label htmlFor="color">Color</Label><Input id="color" value={form.color} onChange={e => setForm({...form, color: e.target.value})} /></div>
          <div><Label htmlFor="seats">Seats</Label><Input id="seats" type="number" value={form.seatingCapacity} onChange={e => setForm({...form, seatingCapacity: +e.target.value})} /></div>
          <div><Label htmlFor="rate">Daily Rate</Label><Input id="rate" type="number" value={form.dailyRate} onChange={e => setForm({...form, dailyRate: +e.target.value})} /></div>
          <Button onClick={submit} disabled={updateVehicle.isPending}>Save Changes</Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
