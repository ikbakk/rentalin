import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { User, Gauge, Calendar, ArrowRight, CheckCircle2 } from "lucide-react"
import { cn } from "@/lib/utils"
import type { RentalResponse } from "@/lib/types"

const statusColors: Record<string, string> = {
  Active: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  Completed: "bg-muted text-muted-foreground",
  Overdue: "bg-destructive/10 text-destructive",
}

export function RentalCard({ rental, onComplete }: { rental: RentalResponse; onComplete: () => void }) {
  const startDate = rental.actualStart ? new Date(rental.actualStart) : null
  const endDate = rental.actualEnd ? new Date(rental.actualEnd) : null

  return (
    <Card className="transition-all hover:shadow-md">
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <div className="flex size-8 items-center justify-center rounded-lg bg-emerald-500/10">
                <User className="size-4 text-emerald-500" />
              </div>
              <div>
                <h3 className="font-semibold">{rental.customerName}</h3>
                <p className="text-xs text-muted-foreground">{rental.vehicleSummary}</p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
              {startDate && (
                <div className="flex items-center gap-1.5">
                  <Calendar className="size-3.5" />
                  <span>Started {startDate.toLocaleDateString()}</span>
                </div>
              )}
              {endDate && (
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="size-3.5" />
                  <span>Ended {endDate.toLocaleDateString()}</span>
                </div>
              )}
              {rental.odometerStart != null && (
                <div className="flex items-center gap-1.5">
                  <Gauge className="size-3.5" />
                  <span>Odo: {rental.odometerStart.toLocaleString()} km</span>
                </div>
              )}
            </div>

            {rental.odometerEnd && (
              <div className="mt-2 flex items-center gap-1.5 rounded-lg bg-muted/50 p-2">
                <Gauge className="size-3.5 text-primary" />
                <span className="text-xs">
                  Final: <span className="font-mono font-medium text-foreground">{rental.odometerEnd.toLocaleString()} km</span>
                </span>
                <span className="text-xs text-muted-foreground">
                  (+{(rental.odometerEnd - (rental.odometerStart ?? 0)).toLocaleString()} km)
                </span>
              </div>
            )}
          </div>

          <div className="flex flex-col items-end gap-2">
            <Badge variant="outline" className={cn("font-medium", statusColors[rental.status] || "")}>
              {rental.status}
            </Badge>
            {rental.status === "Active" && (
              <Button size="sm" onClick={onComplete} className="gap-1.5">
                Complete
                <ArrowRight className="size-3" />
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
