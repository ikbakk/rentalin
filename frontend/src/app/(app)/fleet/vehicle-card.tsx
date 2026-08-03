import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Car, Users } from "lucide-react"
import type { VehicleResponse } from "@/lib/types"
import { cn } from "@/lib/utils"

const statusColors: Record<string, string> = {
  Available: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  Rented: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
  Maintenance: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
  Retired: "bg-muted text-muted-foreground",
}

export function VehicleCard({ vehicle }: { vehicle: VehicleResponse }) {
  return (
    <Card className="cursor-pointer transition-all hover:scale-[1.01] hover:shadow-md">
      <CardContent className="flex items-center gap-4 p-4">
        <div className="flex size-14 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-primary/20 to-primary/5">
          <Car className="size-6 text-primary" />
        </div>
        <div className="flex flex-1 flex-col gap-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-mono text-sm font-bold">{vehicle.licensePlate}</span>
            <Badge variant="outline" className={cn("text-[10px] font-medium px-1.5 py-0", statusColors[vehicle.status])}>
              {vehicle.status}
            </Badge>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span className="truncate">{vehicle.make} {vehicle.model}</span>
            <span>·</span>
            <span>{vehicle.year}</span>
          </div>
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <Users className="size-3" />
              {vehicle.seatingCapacity} seats
            </span>
            <span>{vehicle.color}</span>
          </div>
        </div>
        <div className="flex flex-col items-end gap-1 shrink-0">
          <span className="font-mono text-base font-bold text-primary">
            {vehicle.dailyRateCurrency} {vehicle.dailyRateAmount.toLocaleString()}
          </span>
          <span className="text-[10px] text-muted-foreground">/day</span>
        </div>
      </CardContent>
    </Card>
  )
}
