"use client"

import { useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { useReservationById, useStartRental } from "@/hooks/use-reservations"
import { useVehicleById } from "@/hooks/use-vehicle-by-id"
import { EmptyState } from "@/components/shared/empty-state"
import { ListSkeleton } from "@/components/shared/loading-skeleton"
import { StatusChip } from "@/components/shared/status-chip"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import { Car, Gauge, Calendar, DollarSign, User, ArrowLeft } from "lucide-react"
import Link from "next/link"
import { format } from "date-fns"

export default function HandoverPage() {
  const params = useParams()
  const router = useRouter()
  const id = params.id as string

  const { data: reservation, isLoading: reservationLoading } = useReservationById(id)
  const { data: vehicle } = useVehicleById(reservation?.vehicleId ?? "")
  const startRental = useStartRental()

  const [odometer, setOdometer] = useState("")

  if (reservationLoading) {
    return (
      <div className="p-4 lg:p-6">
        <ListSkeleton count={3} />
      </div>
    )
  }

  if (!reservation) {
    return (
      <div className="p-4 lg:p-6">
        <EmptyState
          title="Reservation not found"
          description="This reservation may have been cancelled or does not exist."
        />
      </div>
    )
  }

  const handleStartRental = async () => {
    const odoValue = Number(odometer)
    if (!odometer || isNaN(odoValue) || odoValue < 0) {
      toast.error("Please enter a valid odometer reading")
      return
    }
    try {
      await startRental.mutateAsync({
        reservationId: id,
        odometerStart: odoValue,
      })
      toast.success("Rental started successfully")
      router.push("/operations")
    } catch {
      // Error toast already shown by the mutation's onError
    }
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
              <Car className="size-6 text-primary" />
            </div>
            <div>
              <h1 className="font-mono text-xl font-bold">
                {vehicle?.licensePlate ?? reservation.vehicleSummary}
              </h1>
              <p className="text-sm text-muted-foreground">Vehicle Handover</p>
            </div>
          </div>
          <StatusChip status={reservation.status} />
        </div>
      </div>

      <div className="grid gap-4 p-4 lg:grid-cols-2 lg:px-6">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Reservation Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center gap-2">
              <User className="size-4 text-muted-foreground shrink-0" />
              <div className="flex justify-between flex-1 text-sm">
                <span className="text-muted-foreground">Customer</span>
                <span className="font-medium">{reservation.customerName}</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Car className="size-4 text-muted-foreground shrink-0" />
              <div className="flex justify-between flex-1 text-sm">
                <span className="text-muted-foreground">Vehicle</span>
                <span className="font-medium">{reservation.vehicleSummary}</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="size-4 text-muted-foreground shrink-0" />
              <div className="flex justify-between flex-1 text-sm">
                <span className="text-muted-foreground">Rental Period</span>
                <span className="font-medium">
                  {format(new Date(reservation.startDate), "MMM d, yyyy")}
                  {" – "}
                  {format(new Date(reservation.endDate), "MMM d, yyyy")}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <DollarSign className="size-4 text-muted-foreground shrink-0" />
              <div className="flex justify-between flex-1 text-sm">
                <span className="text-muted-foreground">Estimated Cost</span>
                <span className="font-mono font-medium">
                  {reservation.currency} {reservation.estimatedCost.toLocaleString()}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Start Rental</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="odometer" className="flex items-center gap-1.5">
                <Gauge className="size-4 text-muted-foreground" />
                Odometer Reading (km)
              </Label>
              <Input
                id="odometer"
                type="number"
                inputMode="numeric"
                min={0}
                placeholder="Enter current odometer reading"
                value={odometer}
                onChange={(e) => setOdometer(e.target.value)}
              />
            </div>
            <Button
              className="w-full"
              size="lg"
              onClick={handleStartRental}
              disabled={startRental.isPending}
            >
              {startRental.isPending ? "Starting Rental..." : "Start Rental"}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
