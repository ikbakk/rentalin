"use client"

import { useOperationsSummary } from "@/hooks/use-operations"
import { Card, CardContent } from "@/components/ui/card"
import { cn } from "@/lib/utils"

const stagger = ["stagger-1", "stagger-2", "stagger-3", "stagger-4", "stagger-5", "stagger-6"]

export function OperationsDashboard() {
  const { data: summary, isLoading } = useOperationsSummary()

  if (isLoading || !summary) return null

  const stats = [
    { label: "Total Fleet", value: summary.totalVehicles, sub: `${summary.availableVehicles} available`, accent: true },
    { label: "Rented Out", value: summary.rentedVehicles, sub: `${summary.totalVehicles - summary.availableVehicles - summary.rentedVehicles} other` },
    { label: "Inquiries", value: summary.activeInquiries, sub: "active" },
    { label: "Reservations", value: summary.activeReservations, sub: "confirmed" },
    { label: "Active Rentals", value: summary.activeRentals, sub: "in progress" },
    { label: "Inspections", value: summary.pendingInspections, sub: "pending" },
  ]

  return (
    <div className="grid grid-cols-2 gap-3 p-4">
      {stats.map((s, i) => (
        <Card key={s.label} className={cn("animate-slide-up", stagger[i])}>
          <CardContent className={cn("flex flex-col items-center p-4", s.accent && "bg-primary/5")}>
            <span className={cn("font-mono text-2xl font-bold tabular-nums", s.accent && "text-primary")}>{s.value}</span>
            <span className="mt-1 text-xs font-medium text-muted-foreground">{s.label}</span>
            <span className="text-xs text-muted-foreground">{s.sub}</span>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
