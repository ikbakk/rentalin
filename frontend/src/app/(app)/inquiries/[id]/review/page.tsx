"use client"

import { useParams, useRouter } from "next/navigation"
import { useState } from "react"
import { useInquiryById, useCancelInquiry } from "@/hooks/use-inquiries"
import { useCreateReservation } from "@/hooks/use-reservations"
import { useVehicleById } from "@/hooks/use-vehicle-by-id"
import { EmptyState } from "@/components/shared/empty-state"
import { ListSkeleton } from "@/components/shared/loading-skeleton"
import { StatusChip } from "@/components/shared/status-chip"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { toast } from "sonner"
import { User, Car, Calendar, MessageSquare, ArrowLeft, Phone, CheckCircle, XCircle } from "lucide-react"
import Link from "next/link"
import { useBusiness } from "@/hooks/use-business"
import { businessDateToIso, DEFAULT_BUSINESS_TIME_ZONE, durationInBusinessDays, formatBusinessDate, isoToBusinessDate } from "@/lib/business-time"

export default function ReviewInquiryPage() {
  const params = useParams()
  const router = useRouter()
  const id = params.id as string

  const { data: inquiry, isLoading } = useInquiryById(id)
  const { data: business } = useBusiness()
  const { data: vehicle } = useVehicleById(inquiry?.vehicleId ?? "")
  const createReservation = useCreateReservation()
  const cancelInquiry = useCancelInquiry()
  const [dateDraft, setDateDraft] = useState<{ inquiryId: string; start: string; end: string }>({ inquiryId: "", start: "", end: "" })

  if (isLoading) {
    return (
      <div className="p-4 lg:p-6">
        <ListSkeleton count={3} />
      </div>
    )
  }

  if (!inquiry) {
    return (
      <div className="p-4 lg:p-6">
        <EmptyState
          title="Inquiry not found"
          description="This inquiry may have been cancelled or does not exist."
          action={{ label: "Back to Operations", onClick: () => router.push("/operations") }}
        />
      </div>
    )
  }

  const isPending = inquiry.status === "New" || inquiry.status === "Contacted"
  const businessTimeZone = business?.timeZone ?? DEFAULT_BUSINESS_TIME_ZONE
  const startDate = dateDraft.inquiryId === id ? dateDraft.start : isoToBusinessDate(inquiry.startDate, businessTimeZone)
  const endDate = dateDraft.inquiryId === id ? dateDraft.end : isoToBusinessDate(inquiry.endDate, businessTimeZone)
  const validDates = !!startDate && !!endDate && endDate > startDate

  const handleConfirm = async () => {
    try {
      const startDateIso = businessDateToIso(startDate, businessTimeZone)
      const endDateIso = businessDateToIso(endDate, businessTimeZone)
      if (!startDateIso || !endDateIso || Date.parse(endDateIso) <= Date.parse(startDateIso)) {
        throw new Error("Choose a pickup date and a later return date")
      }
      if (!vehicle?.dailyRateAmount) throw new Error("Set a daily rate for this vehicle before confirming the booking")
      const duration = durationInBusinessDays(startDateIso, endDateIso)
      if (duration === null) throw new Error("Choose a valid rental date range")
      const reservationId = await createReservation.mutateAsync({
        inquiryId: id,
        customerId: inquiry.customerId || undefined,
        vehicleId: inquiry.vehicleId,
        startDate: startDateIso,
        endDate: endDateIso,
        estimatedCost: vehicle.dailyRateAmount * duration,
        currency: vehicle.dailyRateCurrency,
      })
      toast.success("Reservation confirmed")
      router.push(`/reservations/${reservationId}/preparation`)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Inquiry could not be confirmed")
    }
  }

  const handleCancel = async () => {
    try {
      await cancelInquiry.mutateAsync(id)
      toast.success("Inquiry cancelled")
      router.push("/operations")
    } catch {
      toast.error("Inquiry could not be cancelled")
    }
  }

  const changeDate = (field: "start" | "end", value: string) => {
    setDateDraft({
      inquiryId: id,
      start: field === "start" ? value : startDate,
      end: field === "end" ? value : endDate,
    })
  }

  return (
    <div className="pb-20 lg:pb-6">
      <div className="border-b border-border px-4 py-4 lg:px-6">
        <Link
          href="/operations"
          className="mb-3 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="size-4" />
          Back to Operations
        </Link>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex size-12 items-center justify-center rounded-xl bg-primary/10">
              <User className="size-6 text-primary" />
            </div>
            <div>
              <h1 className="text-xl font-bold">{inquiry.customerName}</h1>
              <p className="text-sm text-muted-foreground">Review Inquiry</p>
            </div>
          </div>
          <StatusChip status={inquiry.status} />
        </div>
      </div>

      <div className="grid gap-4 p-4 lg:grid-cols-2 lg:px-6">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Inquiry Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center gap-2">
              <User className="size-4 text-muted-foreground shrink-0" />
              <div className="flex justify-between flex-1 text-sm">
                <span className="text-muted-foreground">Customer</span>
                <span className="font-medium">{inquiry.customerName}</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Phone className="size-4 text-muted-foreground shrink-0" />
              <div className="flex justify-between flex-1 text-sm">
                <span className="text-muted-foreground">Phone</span>
                <span className="font-medium">{inquiry.customerPhone || "—"}</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Car className="size-4 text-muted-foreground shrink-0" />
              <div className="flex justify-between flex-1 text-sm">
                <span className="text-muted-foreground">Vehicle</span>
                <span className="font-medium">{inquiry.vehicleSummary}</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="size-4 text-muted-foreground shrink-0" />
              <div className="flex justify-between flex-1 text-sm">
                <span className="text-muted-foreground">Rental Period</span>
                <span className="font-medium">
                  {validDates
                    ? `${formatBusinessDate(businessDateToIso(startDate, businessTimeZone)!, businessTimeZone)} – ${formatBusinessDate(businessDateToIso(endDate, businessTimeZone)!, businessTimeZone)}`
                    : "Rental dates not selected"}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {isPending && (
          <Card className="lg:col-span-2">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Rental Dates</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              <div className="grid gap-2">
                <Label htmlFor="inquiry-pickup-date">Pickup date ({businessTimeZone})</Label>
                <Input
                  id="inquiry-pickup-date"
                  type="date"
                  value={startDate}
                  onChange={(event) => changeDate("start", event.target.value)}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="inquiry-return-date">Return date ({businessTimeZone})</Label>
                <Input
                  id="inquiry-return-date"
                  type="date"
                  min={startDate || undefined}
                  value={endDate}
                  onChange={(event) => changeDate("end", event.target.value)}
                />
              </div>
            </CardContent>
          </Card>
        )}

        {inquiry.notes && (
          <>
            <Card className="lg:col-span-2">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <MessageSquare className="size-4 text-muted-foreground" />
                  Notes
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">{inquiry.notes}</p>
              </CardContent>
            </Card>
            <Separator className="lg:col-span-2" />
          </>
        )}

        <Card className="lg:col-span-2">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Actions</CardTitle>
          </CardHeader>
          <CardContent>
            {isPending ? (
              <div className="flex flex-col gap-3 sm:flex-row">
                <Button
                  size="lg"
                  className="flex-1 gap-2"
                  onClick={handleConfirm}
                  disabled={createReservation.isPending || !validDates}
                >
                  <CheckCircle className="size-4" />
                  {createReservation.isPending ? "Confirming..." : "Confirm & Create Reservation"}
                </Button>
                <Button
                  variant="outline"
                  size="lg"
                  className="flex-1 gap-2"
                  onClick={handleCancel}
                  disabled={cancelInquiry.isPending}
                >
                  <XCircle className="size-4" />
                  {cancelInquiry.isPending ? "Cancelling..." : "Cancel Inquiry"}
                </Button>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                This inquiry is <span className="font-medium">{inquiry.status}</span>. No actions available.
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
