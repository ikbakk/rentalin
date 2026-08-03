import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Calendar, User, Car, ArrowRight, DollarSign } from "lucide-react"
import { cn } from "@/lib/utils"
import type { ReservationResponse } from "@/lib/types"

const statusColors: Record<string, string> = {
  Confirmed: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  Preparing: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
  Ready: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
  Cancelled: "bg-muted text-muted-foreground",
}

export function ReservationCard({ reservation, onStart }: { reservation: ReservationResponse; onStart: () => void }) {
  const startDate = new Date(reservation.startDate)
  const endDate = new Date(reservation.endDate)
  const days = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))

  return (
    <Card className="transition-all hover:shadow-md">
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <div className="flex size-8 items-center justify-center rounded-lg bg-blue-500/10">
                <User className="size-4 text-blue-500" />
              </div>
              <div>
                <h3 className="font-semibold">{reservation.customerName}</h3>
                <p className="text-xs text-muted-foreground">{reservation.vehicleSummary}</p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
              <div className="flex items-center gap-1.5">
                <Calendar className="size-3.5" />
                <span>{startDate.toLocaleDateString()} — {endDate.toLocaleDateString()}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Car className="size-3.5" />
                <span>{days} day{days !== 1 ? "s" : ""}</span>
              </div>
            </div>
          </div>

          <div className="flex flex-col items-end gap-2">
            <Badge variant="outline" className={cn("font-medium", statusColors[reservation.status] || "")}>
              {reservation.status}
            </Badge>
            <div className="flex items-center gap-1 text-sm">
              <DollarSign className="size-4 text-primary" />
              <span className="font-mono font-semibold text-primary">
                {reservation.currency} {reservation.estimatedCost.toLocaleString()}
              </span>
            </div>
            {reservation.status === "Confirmed" && (
              <Button size="sm" onClick={onStart} className="gap-1.5">
                Start Rental
                <ArrowRight className="size-3" />
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
