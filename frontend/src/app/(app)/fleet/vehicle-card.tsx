"use client"

import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Car, Pencil, Users } from "lucide-react"
import type { VehicleResponse } from "@/lib/types"
import { cn } from "@/lib/utils"
import { statusColor } from "@/lib/status-config"

export function VehicleCard({ vehicle, onEdit }: { vehicle: VehicleResponse; onEdit?: () => void }) {
  return (
    <Card className="cursor-pointer transition-all hover:ring-2 hover:ring-ring/40 hover:shadow-md">
      <CardContent className="flex items-center gap-4 p-4">
        <div className="flex size-14 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-primary/20 to-primary/5">
          <Car className="size-6 text-primary" />
        </div>
        <div className="flex flex-1 flex-col gap-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-mono text-sm font-bold">{vehicle.licensePlate}</span>
            <Badge variant="outline" className={cn("text-xs font-medium px-1.5", statusColor(vehicle.status))}>
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
          <span className="text-xs text-muted-foreground">/day</span>
          {onEdit && (
            <Button
              variant="ghost"
              size="icon"
              aria-label={`Edit ${vehicle.licensePlate}`}
              onClick={e => { e.stopPropagation(); onEdit() }}
              className="mt-1 size-8 rounded-lg"
            >
              <Pencil className="size-4" />
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
