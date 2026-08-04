"use client"

import { useState } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import { useRentalById, useCompleteRental } from "@/hooks/use-rentals"
import { ListSkeleton } from "@/components/shared/loading-skeleton"
import { EmptyState } from "@/components/shared/empty-state"
import { StatusChip } from "@/components/shared/status-chip"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import { ChevronLeft } from "lucide-react"
import { format } from "date-fns"

export default function ReturnRentalPage() {
  const params = useParams()
  const router = useRouter()
  const id = params.id as string

  const { data: rental, isLoading, isError } = useRentalById(id)
  const completeRental = useCompleteRental()
  const [odometerEnd, setOdometerEnd] = useState("")
  const [validationError, setValidationError] = useState("")

  if (isLoading) {
    return (
      <div className="p-4 lg:p-6">
        <div className="mb-6 h-6 w-32 animate-pulse rounded bg-muted" />
        <ListSkeleton count={3} />
      </div>
    )
  }

  if (isError || !rental) {
    return (
      <div className="p-4 lg:p-6">
        <EmptyState
          title="Rental not found"
          description="This rental may have been completed or does not exist."
          action={{
            label: "Back to Operations",
            onClick: () => router.push("/operations"),
          }}
        />
      </div>
    )
  }

  const handleSubmit = async () => {
    const odoEnd = Number(odometerEnd)

    if (rental.odometerStart != null && odoEnd < rental.odometerStart) {
      setValidationError(`Odometer end must be at least ${rental.odometerStart.toLocaleString()} km`)
      return
    }

    setValidationError("")

    try {
      await completeRental.mutateAsync({ rentalId: id, odometerEnd: odoEnd })
      toast.success("Rental completed successfully")
      router.push("/operations")
    } catch {
      toast.error("Failed to complete rental")
    }
  }

  const odometerMin = rental.odometerStart ?? 0

  return (
    <div className="p-4 lg:p-6 pb-20 lg:pb-6">
      <Link
        href="/operations"
        className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ChevronLeft className="size-4" />
        Back to Operations
      </Link>

      <h1 className="text-xl font-bold mb-6">Return Vehicle</h1>

      <Card className="mb-6">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Rental Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Vehicle</span>
            <span className="font-medium">{rental.vehicleSummary}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Customer</span>
            <span className="font-medium">{rental.customerName}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Start Date</span>
            <span className="font-medium">
              {rental.actualStart
                ? format(new Date(rental.actualStart), "MMM d, yyyy HH:mm")
                : "—"}
            </span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Odometer Start</span>
            <span className="font-medium">
              {rental.odometerStart != null
                ? `${rental.odometerStart.toLocaleString()} km`
                : "—"}
            </span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Status</span>
            <StatusChip status={rental.status} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Return Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="odometerEnd">Odometer Reading (km)</Label>
            <Input
              id="odometerEnd"
              type="number"
              required
              min={odometerMin}
              value={odometerEnd}
              onChange={(e) => {
                setOdometerEnd(e.target.value)
                setValidationError("")
              }}
              placeholder="Enter end odometer reading"
              className="mt-1.5"
            />
            {validationError && (
              <p className="mt-1 text-sm text-destructive">{validationError}</p>
            )}
          </div>
          <Button
            onClick={handleSubmit}
            disabled={completeRental.isPending || !odometerEnd}
            className="w-full"
          >
            {completeRental.isPending ? "Processing..." : "Complete Rental"}
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
