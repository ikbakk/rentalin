"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { useVehicles } from "@/hooks/use-vehicles"
import { useCreateInquiry } from "@/hooks/use-inquiries"
import { toast } from "sonner"
import { ArrowRight, ArrowLeft, Check, MessageCircle, Calendar } from "lucide-react"

type Step = "contact" | "details" | "done"

export function NewInquiryDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const [step, setStep] = useState<Step>("contact")
  const [quickMode, setQuickMode] = useState(false)
  const [form, setForm] = useState({
    customerPhone: "",
    customerName: "",
    vehicleId: "",
    startDate: "",
    endDate: "",
    notes: "",
  })

  const { data: vehicles } = useVehicles()
  const createInquiry = useCreateInquiry()

  const reset = () => {
    setStep("contact")
    setQuickMode(false)
    setForm({ customerPhone: "", customerName: "", vehicleId: "", startDate: "", endDate: "", notes: "" })
  }

  const handleClose = (v: boolean) => {
    if (!v) reset()
    onOpenChange(v)
  }

  const submit = async () => {
    if (!form.customerPhone || !form.vehicleId) {
      toast.error("Phone and vehicle are required")
      return
    }
    try {
      await createInquiry.mutateAsync({
        customerPhone: form.customerPhone,
        customerName: form.customerName || undefined,
        vehicleId: form.vehicleId,
        startDate: form.startDate ? new Date(form.startDate).toISOString() : "",
        endDate: form.endDate ? new Date(form.endDate).toISOString() : undefined,
        notes: form.notes || undefined,
      })
      setStep("done")
      setTimeout(() => handleClose(false), 1500)
    } catch {
      toast.error("Failed to create inquiry")
    }
  }

  const canProceed = form.customerPhone.length >= 8 && form.vehicleId

  if (step === "done") {
    return (
      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent className="max-w-sm">
          <div className="flex flex-col items-center gap-3 py-6">
            <div className="flex size-14 items-center justify-center rounded-full bg-success/10">
              <Check className="size-7 text-success" />
            </div>
            <div className="text-center">
              <p className="font-semibold">Inquiry Created</p>
              <p className="text-sm text-muted-foreground">Customer notified via WhatsApp</p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  if (quickMode) {
    return (
      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Quick Inquiry</DialogTitle>
            <DialogDescription>Just the essentials — add more details later</DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-4 py-2">
            <div className="space-y-2">
              <Label>WhatsApp Number *</Label>
              <Input
                value={form.customerPhone}
                onChange={e => setForm({ ...form, customerPhone: e.target.value })}
                placeholder="+62 812 xxxx xxxx"
                type="tel"
                autoFocus
              />
            </div>
            <div className="space-y-2">
              <Label>Vehicle *</Label>
              <select
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={form.vehicleId}
                onChange={e => setForm({ ...form, vehicleId: e.target.value })}
              >
                <option value="">Select vehicle...</option>
                {vehicles?.filter(v => v.status === "Available").map(v => (
                  <option key={v.id} value={v.id}>
                    {v.licensePlate} — {v.make} {v.model}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <DialogFooter className="flex-row gap-2 sm:flex-col">
            <Button variant="outline" onClick={() => setQuickMode(false)} className="flex-1">
              More Details
            </Button>
            <Button onClick={submit} disabled={!canProceed || createInquiry.isPending} className="flex-1 gap-2">
              {createInquiry.isPending ? "Creating..." : "Create"}
              <ArrowRight className="size-4" />
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-h-[85dvh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle>New Inquiry</DialogTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setQuickMode(true)}
              className="text-xs text-muted-foreground"
            >
              Quick Mode
            </Button>
          </div>
          <DialogDescription>
            {step === "contact" ? "Who&apos;s inquiring and for what vehicle?" : "Add more details (optional)"}
          </DialogDescription>
        </DialogHeader>

        {step === "contact" && (
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-3 rounded-lg bg-muted/50 p-3">
              <MessageCircle className="size-5 text-muted-foreground" />
              <Input
                value={form.customerPhone}
                onChange={e => setForm({ ...form, customerPhone: e.target.value })}
                placeholder="+62 812 xxxx xxxx"
                type="tel"
                className="border-0 bg-transparent p-0 h-auto focus-visible:ring-0"
                autoFocus
              />
            </div>

            <div className="space-y-2">
              <Label>Vehicle *</Label>
              <select
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={form.vehicleId}
                onChange={e => setForm({ ...form, vehicleId: e.target.value })}
              >
                <option value="">Select vehicle...</option>
                {vehicles?.filter(v => v.status === "Available").map(v => (
                  <option key={v.id} value={v.id}>
                    {v.licensePlate} — {v.make} {v.model}
                  </option>
                ))}
              </select>
            </div>

            <Button onClick={() => setStep("details")} disabled={!canProceed} className="gap-2 w-full">
              Continue
              <ArrowRight className="size-4" />
            </Button>
          </div>
        )}

        {step === "details" && (
          <div className="flex flex-col gap-4">
            <Button variant="ghost" size="sm" onClick={() => setStep("contact")} className="self-start gap-1 -ml-2">
              <ArrowLeft className="size-4" /> Back
            </Button>

            <div className="flex flex-col gap-3">
              <div className="space-y-2">
                <Label>Customer Name</Label>
                <Input
                  value={form.customerName}
                  onChange={e => setForm({ ...form, customerName: e.target.value })}
                  placeholder="Optional — add later"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>
                    <Calendar className="size-3 inline mr-1" />
                    Pickup
                  </Label>
                  <Input
                    type="date"
                    value={form.startDate}
                    onChange={e => setForm({ ...form, startDate: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>
                    <Calendar className="size-3 inline mr-1" />
                    Return
                  </Label>
                  <Input
                    type="date"
                    value={form.endDate}
                    onChange={e => setForm({ ...form, endDate: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Notes</Label>
                <Input
                  value={form.notes}
                  onChange={e => setForm({ ...form, notes: e.target.value })}
                  placeholder="Special requests, flight info, etc."
                />
              </div>
            </div>

            <div className="flex gap-2">
              <Button variant="outline" onClick={submit} className="flex-1">
                Skip — Add Later
              </Button>
              <Button onClick={submit} disabled={createInquiry.isPending} className="flex-1 gap-2">
                {createInquiry.isPending ? "Creating..." : "Create Inquiry"}
                <Check className="size-4" />
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
