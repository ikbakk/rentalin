"use client"

import { useQuery } from "@tanstack/react-query"
import { CheckCircle2, Clock, Circle, MessageCircle, Car, Calendar, Gauge, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { cn } from "@/lib/utils"

interface RentalData {
  rentalId: string
  status: string
  customerName: string
  customerPhone: string
  vehiclePlate: string
  vehicleMake: string
  vehicleModel: string
  startDate: string
  endDate: string
  estimatedCost: number
  currency: string
  rentalStarted?: string
  rentalEnded?: string
  odometerStart?: number
  odometerEnd?: number
  inspectionStatus?: string
  inspectionNotes?: string
}

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5000"

const steps = [
  { key: "Confirmed", label: "Confirmed", icon: CheckCircle2 },
  { key: "Preparing", label: "Preparing", icon: Clock },
  { key: "Ready", label: "Ready for Pickup", icon: Car },
  { key: "Active", label: "On Rent", icon: Calendar },
  { key: "Completed", label: "Completed", icon: CheckCircle2 },
]

const statusConfig: Record<string, { bg: string; text: string; label: string }> = {
  Confirmed: { bg: "bg-blue-500/10", text: "text-blue-500", label: "Confirmed" },
  Preparing: { bg: "bg-orange-500/10", text: "text-orange-500", label: "Preparing" },
  Ready: { bg: "bg-purple-500/10", text: "text-purple-500", label: "Ready" },
  Active: { bg: "bg-emerald-500/10", text: "text-emerald-500", label: "On Rent" },
  Completed: { bg: "bg-muted", text: "text-muted-foreground", label: "Completed" },
}

export function TxView({ rentalId }: { rentalId: string }) {
  const { data: rental, isLoading, error } = useQuery<RentalData>({
    queryKey: ["tx", rentalId],
    queryFn: () =>
      fetch(`${API_BASE}/api/portal/reservation/${rentalId}`).then((r) =>
        r.ok ? r.json() : Promise.reject(new Error("Not found"))
      ),
    refetchInterval: 30_000,
    retry: false,
  })

  if (isLoading) {
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center gap-4">
        <div className="size-12 animate-pulse rounded-full bg-muted" />
        <p className="text-sm text-muted-foreground">Loading your rental...</p>
      </div>
    )
  }

  if (error || !rental) {
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center gap-4 p-6">
        <div className="flex size-16 items-center justify-center rounded-full bg-destructive/10">
          <AlertCircle className="size-8 text-destructive" />
        </div>
        <div className="text-center">
          <h2 className="font-semibold">Rental Not Found</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            This link may have expired or is invalid.
          </p>
        </div>
        <Button
          className="mt-4 gap-2 bg-[#25D366] hover:bg-[#25D366]/90"
          onClick={() => window.open("https://wa.me/", "_blank")}
        >
          <MessageCircle className="size-4" />
          Contact Us
        </Button>
      </div>
    )
  }

  const currentStepIdx = steps.findIndex((s) => s.key === rental.status)
  const showSteps = currentStepIdx >= 0

  const statusInfo = statusConfig[rental.status] || statusConfig.Confirmed
  const startDate = new Date(rental.startDate)
  const endDate = new Date(rental.endDate)
  const days = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))

  return (
    <div className="min-h-dvh bg-gradient-to-b from-background to-background/80">
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-20 -right-20 size-60 rounded-full bg-primary/5 blur-3xl" />
      </div>

      <div className="relative mx-auto max-w-lg px-4 pb-8">
        <header className="pt-8 pb-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Rental ID</p>
              <p className="font-mono text-sm text-muted-foreground">{rental.rentalId.slice(0, 8)}</p>
            </div>
            <Badge className={cn("px-3 py-1 text-xs font-medium", statusInfo.bg, statusInfo.text)}>
              {statusInfo.label}
            </Badge>
          </div>
        </header>

        <Card className="mb-6 overflow-hidden">
          <div className="bg-gradient-to-r from-primary/20 to-primary/5 p-4">
            <div className="flex items-center gap-4">
              <div className="flex size-14 items-center justify-center rounded-xl bg-background/80">
                <Car className="size-7 text-primary" />
              </div>
              <div>
                <p className="font-mono text-lg font-bold">{rental.vehiclePlate}</p>
                <p className="text-sm text-muted-foreground">
                  {rental.vehicleMake} {rental.vehicleModel}
                </p>
              </div>
            </div>
          </div>
          <CardContent className="p-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">Renter</p>
                <p className="font-medium">{rental.customerName}</p>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">Contact</p>
                <p className="font-mono text-sm">{rental.customerPhone}</p>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">Pickup</p>
                <p className="font-medium">{startDate.toLocaleDateString()}</p>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">Return</p>
                <p className="font-medium">{endDate.toLocaleDateString()}</p>
              </div>
            </div>

            <Separator className="my-4" />

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Calendar className="size-4" />
                <span>{days} day{days !== 1 ? "s" : ""}</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="text-lg font-bold text-primary">
                  {rental.currency} {rental.estimatedCost.toLocaleString()}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {showSteps && (
          <Card className="mb-6">
            <CardContent className="p-4">
              <h3 className="mb-4 text-sm font-semibold">Rental Status</h3>
              <div className="relative">
                <div className="absolute left-4 top-0 bottom-0 w-px bg-border" />
                <div className="space-y-0">
                  {steps.map((step, i) => {
                    const done = i < currentStepIdx
                    const current = i === currentStepIdx
                    const upcoming = i > currentStepIdx
                    const Icon = step.icon

                    return (
                      <div key={step.key} className="relative flex items-start gap-4 pb-6 last:pb-0">
                        <div
                          className={cn(
                            "relative z-10 flex size-8 shrink-0 items-center justify-center rounded-full",
                            done
                              ? "bg-success text-success"
                              : current
                                ? "bg-primary text-primary"
                                : "bg-muted text-muted-foreground"
                          )}
                        >
                          {done ? (
                            <CheckCircle2 className="size-4" />
                          ) : current ? (
                            <Icon className="size-4" />
                          ) : (
                            <Circle className="size-4" />
                          )}
                        </div>
                        <div className="flex flex-col pt-1">
                          <span
                            className={cn(
                              "text-sm font-medium",
                              done && "text-success",
                              current && "text-primary",
                              upcoming && "text-muted-foreground"
                            )}
                          >
                            {step.label}
                          </span>
                          {current && (
                            <span className="text-xs text-muted-foreground">In progress</span>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {(rental.rentalStarted || rental.odometerStart) && (
          <Card className="mb-6">
            <CardContent className="p-4">
              <h3 className="mb-3 text-sm font-semibold">Rental Details</h3>
              <div className="grid grid-cols-2 gap-4">
                {rental.rentalStarted && (
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">Pickup Time</p>
                    <p className="text-sm font-medium">
                      {new Date(rental.rentalStarted).toLocaleString()}
                    </p>
                  </div>
                )}
                {rental.rentalEnded && (
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">Return Time</p>
                    <p className="text-sm font-medium">
                      {new Date(rental.rentalEnded).toLocaleString()}
                    </p>
                  </div>
                )}
                {rental.odometerStart != null && (
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">Start Odometer</p>
                    <div className="flex items-center gap-1.5">
                      <Gauge className="size-3.5 text-muted-foreground" />
                      <span className="font-mono text-sm">{rental.odometerStart.toLocaleString()} km</span>
                    </div>
                  </div>
                )}
                {rental.odometerEnd != null && (
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">End Odometer</p>
                    <div className="flex items-center gap-1.5">
                      <Gauge className="size-3.5 text-muted-foreground" />
                      <span className="font-mono text-sm">{rental.odometerEnd.toLocaleString()} km</span>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {rental.inspectionStatus && (
          <Card
            className={cn(
              "mb-6",
              rental.inspectionStatus === "Completed"
                ? "border-success/30 bg-success/5"
                : "border-warning/30 bg-warning/5"
            )}
          >
            <CardContent className="flex items-center gap-4 p-4">
              {rental.inspectionStatus === "Completed" ? (
                <CheckCircle2 className="size-6 text-success" />
              ) : (
                <Clock className="size-6 text-warning" />
              )}
              <div>
                <p className="font-semibold">Vehicle Inspection</p>
                <p className="text-sm text-muted-foreground">{rental.inspectionStatus}</p>
                {rental.inspectionNotes && (
                  <p className="mt-1 text-xs text-muted-foreground">{rental.inspectionNotes}</p>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        <Button
          className="h-12 w-full gap-2 rounded-xl text-base font-semibold bg-[#25D366] text-white hover:bg-[#25D366]/90"
          onClick={() =>
            window.open(
              `https://wa.me/${rental.customerPhone.replace(/[^0-9]/g, "")}`,
              "_blank"
            )
          }
        >
          <MessageCircle className="size-5" />
          Contact via WhatsApp
        </Button>

        <p className="mt-4 text-center text-xs text-muted-foreground">
          Powered by Rentalin
        </p>
      </div>
    </div>
  )
}
