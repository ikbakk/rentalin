"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { useCreateVehicle } from "@/hooks/use-vehicles"
import { getAuth } from "@/lib/auth"
import { toast } from "sonner"
import type { CreateVehicleRequest } from "@/lib/types"

export function AddVehicleDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const [form, setForm] = useState<CreateVehicleRequest>({
    licensePlate: "", make: "", model: "", year: new Date().getFullYear(),
    color: "", seatingCapacity: 5, dailyRate: 0, currency: "IDR",
    businessId: getAuth()?.businessId ?? ""
  })
  const createVehicle = useCreateVehicle()

  const submit = async () => {
    try {
      await createVehicle.mutateAsync(form)
      toast.success("Vehicle added")
      onOpenChange(false)
      setForm({...form, licensePlate: "", make: "", model: "", color: "", dailyRate: 0})
    } catch { toast.error("Failed to add vehicle") }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85dvh] overflow-y-auto">
        <DialogHeader><DialogTitle>Add Vehicle</DialogTitle></DialogHeader>
        <div className="flex flex-col gap-3">
          <div><Label htmlFor="lp">License Plate</Label><Input id="lp" value={form.licensePlate} onChange={e => setForm({...form, licensePlate: e.target.value})} /></div>
          <div><Label htmlFor="make">Make</Label><Input id="make" value={form.make} onChange={e => setForm({...form, make: e.target.value})} /></div>
          <div><Label htmlFor="model">Model</Label><Input id="model" value={form.model} onChange={e => setForm({...form, model: e.target.value})} /></div>
          <div><Label htmlFor="year">Year</Label><Input id="year" type="number" value={form.year} onChange={e => setForm({...form, year: +e.target.value})} /></div>
          <div><Label htmlFor="color">Color</Label><Input id="color" value={form.color} onChange={e => setForm({...form, color: e.target.value})} /></div>
          <div><Label htmlFor="seats">Seats</Label><Input id="seats" type="number" value={form.seatingCapacity} onChange={e => setForm({...form, seatingCapacity: +e.target.value})} /></div>
          <div><Label htmlFor="rate">Daily Rate</Label><Input id="rate" type="number" value={form.dailyRate} onChange={e => setForm({...form, dailyRate: +e.target.value})} /></div>
          <Button onClick={submit} disabled={createVehicle.isPending}>Add Vehicle</Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
