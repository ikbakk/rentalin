"use client"

import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import {
  useReservationById,
  usePrepareReservation,
  useReadyForHandover,
} from "@/hooks/use-reservations"
import { EmptyState } from "@/components/shared/empty-state"
import { ListSkeleton } from "@/components/shared/loading-skeleton"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import {
  ChevronLeft,
  Wrench,
  CheckCircle,
  ClipboardList,
  Calendar,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { statusColor } from "@/lib/status-config"
import { format } from "date-fns"

const statusLabels: Record<string, string> = {
  Confirmed: "Confirmed",
  PreRental: "Preparing",
  Ready: "Ready for Handover",
  Active: "Active",
  Cancelled: "Cancelled",
}

export default function PreparationPage() {
  const params = useParams()
  const router = useRouter()
  const id = params.id as string

  const { data: reservation, isLoading, error } = useReservationById(id)
  const prepareMutation = usePrepareReservation()
  const readyMutation = useReadyForHandover()

  if (isLoading) {
    return (
      <div className="p-4 lg:p-6">
        <ListSkeleton count={3} />
      </div>
    )
  }

  if (error || !reservation) {
    return (
      <div className="p-4 lg:p-6">
        <EmptyState
          title="Reservation not found"
          description="This reservation may have been removed or does not exist."
        />
      </div>
    )
  }

  const handlePrepare = async () => {
    await prepareMutation.mutateAsync(id)
    toast.success("Preparation started")
  }

  const handleReady = async () => {
    await readyMutation.mutateAsync(id)
    toast.success("Vehicle ready for handover")
    router.push("/operations")
  }

  const startDate = new Date(reservation.startDate)
  const endDate = new Date(reservation.endDate)
  const days = Math.max(
    1,
    Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))
  )

  return (
    <div className="pb-20 lg:pb-6">
      <div className="border-b border-border px-4 py-4 lg:px-6">
        <Link
          href="/reservations"
          className="mb-3 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ChevronLeft className="size-4" />
          Back to Reservations
        </Link>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex size-12 items-center justify-center rounded-xl bg-amber-500/10">
              <Wrench className="size-6 text-amber-600 dark:text-amber-400" />
            </div>
            <div>
              <h1 className="text-xl font-bold">{reservation.vehicleSummary}</h1>
              <p className="text-sm text-muted-foreground">
                Vehicle Preparation
              </p>
            </div>
          </div>
          <Badge
            variant="outline"
            className={cn(
              "font-medium",
              statusColor(reservation.status)
            )}
          >
            {statusLabels[reservation.status] || reservation.status}
          </Badge>
        </div>
      </div>

      <div className="p-4 lg:p-6">
        <div className="grid gap-4 lg:grid-cols-2">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <ClipboardList className="size-4 text-muted-foreground" />
                Reservation Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Customer</span>
                <span className="font-medium">{reservation.customerName}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Vehicle</span>
                <span className="font-medium">{reservation.vehicleSummary}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Start Date</span>
                <span className="font-medium">
                  {format(startDate, "MMM d, yyyy")}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">End Date</span>
                <span className="font-medium">
                  {format(endDate, "MMM d, yyyy")}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Duration</span>
                <span className="font-medium">
                  {days} day{days !== 1 ? "s" : ""}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Estimated Cost</span>
                <span className="font-mono font-medium">
                  {reservation.currency}{" "}
                  {reservation.estimatedCost.toLocaleString()}
                </span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Calendar className="size-4 text-muted-foreground" />
                Preparation Actions
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {reservation.status === "Confirmed" && (
                <Button
                  onClick={handlePrepare}
                  disabled={prepareMutation.isPending}
                  className="w-full gap-2"
                >
                  {prepareMutation.isPending ? (
                    <div className="size-4 animate-spin rounded-full border-2 border-background border-t-transparent" />
                  ) : (
                    <Wrench className="size-4" />
                  )}
                  Start Preparation
                </Button>
              )}

              {reservation.status === "PreRental" && (
                <Button
                  onClick={handleReady}
                  disabled={readyMutation.isPending}
                  className="w-full gap-2"
                >
                  {readyMutation.isPending ? (
                    <div className="size-4 animate-spin rounded-full border-2 border-background border-t-transparent" />
                  ) : (
                    <CheckCircle className="size-4" />
                  )}
                  Mark Ready for Handover
                </Button>
              )}

              {reservation.status === "Ready" && (
                <div className="flex flex-col items-center gap-3 py-4">
                  <div className="flex size-12 items-center justify-center rounded-full bg-emerald-500/10">
                    <CheckCircle className="size-6 text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <div className="text-center">
                    <p className="font-medium text-sm">Ready for Handover</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      This vehicle is ready to be handed over to the customer.
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-1.5"
                    onClick={() => router.push("/operations")}
                  >
                    Go to Operations
                  </Button>
                </div>
              )}

              {reservation.status === "Active" && (
                <p className="text-center text-sm text-muted-foreground py-4">
                  This reservation is currently an active rental.
                </p>
              )}

              {reservation.status === "Cancelled" && (
                <p className="text-center text-sm text-muted-foreground py-4">
                  This reservation has been cancelled.
                </p>
              )}

              {!["Confirmed", "PreRental", "Ready", "Active", "Cancelled"].includes(
                reservation.status
              ) && (
                <p className="text-center text-sm text-muted-foreground py-4">
                  No actions available for this reservation status.
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
