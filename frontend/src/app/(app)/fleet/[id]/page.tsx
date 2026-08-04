"use client"

import { useState, use } from "react"
import { useVehicleById } from "@/hooks/use-vehicle-by-id"
import { useVehicleRentalHistory } from "@/hooks/use-vehicle-rental-history"
import { EditVehicleDialog } from "../edit-vehicle-dialog"
import { StatusChip } from "@/components/shared/status-chip"
import { EmptyState } from "@/components/shared/empty-state"
import { ListSkeleton } from "@/components/shared/loading-skeleton"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Car, Calendar, Gauge, Wrench, Image, History, ChevronLeft, MapPin, Pencil } from "lucide-react"
import Link from "next/link"
import { cn } from "@/lib/utils"
import { statusColor } from "@/lib/status-config"
import { format } from "date-fns"

const tabs = [
  { key: "overview", label: "Overview", icon: Car },
  { key: "history", label: "History", icon: History },
  { key: "photos", label: "Photos", icon: Image },
  { key: "maintenance", label: "Maintenance", icon: Wrench },
]

export default function FleetDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)

  const vehicleId = id

  return <FleetDetailContent vehicleId={vehicleId} />
}

function FleetDetailContent({ vehicleId }: { vehicleId: string }) {
  const [tab, setTab] = useState("overview")
  const [editOpen, setEditOpen] = useState(false)
  const { data: vehicle, isLoading: vehicleLoading } = useVehicleById(vehicleId)
  const { data: history, isLoading: historyLoading } = useVehicleRentalHistory(vehicleId)

  if (vehicleLoading) {
    return (
      <div className="p-4 lg:p-6">
        <div className="flex items-center gap-4 mb-6">
          <div className="h-8 w-8 animate-pulse rounded-lg bg-muted" />
          <div className="h-8 w-48 animate-pulse rounded-lg bg-muted" />
        </div>
        <ListSkeleton count={3} />
      </div>
    )
  }

  if (!vehicle) {
    return (
      <div className="p-4 lg:p-6">
        <EmptyState
          title="Vehicle not found"
          description="This vehicle may have been removed or does not exist."
        />
      </div>
    )
  }

  return (
    <div className="pb-20 lg:pb-6">
      <div className="border-b border-border px-4 py-4 lg:px-6">
        <Link
          href="/fleet"
          className="mb-3 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ChevronLeft className="size-4" />
          Back to Fleet
        </Link>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex size-12 items-center justify-center rounded-xl bg-primary/10">
              <Car className="size-6 text-primary" />
            </div>
            <div>
              <h1 className="font-mono text-xl font-bold">{vehicle.licensePlate}</h1>
              <p className="text-sm text-muted-foreground">
                {vehicle.make} {vehicle.model}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              aria-label="Edit vehicle"
              onClick={() => setEditOpen(true)}
              className="size-9 rounded-lg"
            >
              <Pencil className="size-4" />
            </Button>
            <Badge variant="outline" className={cn("font-medium", statusColor(vehicle.status))}>
              {vehicle.status}
            </Badge>
          </div>
        </div>
      </div>

      <Tabs value={tab} onValueChange={setTab} className="mt-4">
        <div className="px-4 lg:px-6">
          <TabsList className="grid w-full grid-cols-4">
            {tabs.map(t => (
              <TabsTrigger key={t.key} value={t.key} className="gap-2">
                <t.icon className="size-4" />
                <span className="hidden sm:inline">{t.label}</span>
              </TabsTrigger>
            ))}
          </TabsList>
        </div>

        <TabsContent value="overview" className="mt-4 px-4 lg:px-6">
          <div className="grid gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Vehicle Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Make</span>
                  <span className="font-medium">{vehicle.make}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Model</span>
                  <span className="font-medium">{vehicle.model}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Year</span>
                  <span className="font-medium">{vehicle.year}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Color</span>
                  <span className="font-medium">{vehicle.color}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Seats</span>
                  <span className="font-medium">{vehicle.seatingCapacity}</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Rental Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Daily Rate</span>
                  <span className="font-mono font-medium">
                    {vehicle.dailyRateCurrency} {vehicle.dailyRateAmount.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Status</span>
                  <StatusChip status={vehicle.status} />
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Total Rentals</span>
                  <span className="font-medium">{history?.length ?? 0}</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="history" className="mt-4 px-4 lg:px-6">
          {historyLoading ? (
            <ListSkeleton count={3} />
          ) : history && history.length > 0 ? (
            <div className="space-y-3">
              {history.map(r => (
                <Card key={r.id}>
                  <CardContent className="flex items-center justify-between p-4">
                    <div className="flex items-center gap-3">
                      <div className="flex size-10 items-center justify-center rounded-lg bg-muted">
                        <MapPin className="size-5 text-muted-foreground" />
                      </div>
                      <div>
                        <p className="font-medium">{r.customerName}</p>
                        <p className="text-xs text-muted-foreground">
                          {r.actualStart && format(new Date(r.actualStart), "MMM d, yyyy")}
                          {r.actualEnd && ` - ${format(new Date(r.actualEnd), "MMM d, yyyy")}`}
                        </p>
                      </div>
                    </div>
                    <StatusChip status={r.status} />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <EmptyState
              title="No rental history"
              description="This vehicle hasn't been rented yet."
            />
          )}
        </TabsContent>

        <TabsContent value="photos" className="mt-4 px-4 lg:px-6">
          <EmptyState
            title="No inspection photos"
            description="Photos are added during inspections."
          />
        </TabsContent>

        <TabsContent value="maintenance" className="mt-4 px-4 lg:px-6">
          <div className="flex items-center justify-between mb-4">
            <EmptyState
              title="No maintenance records"
              description="Schedule your first maintenance service."
            />
            <Button size="sm" className="gap-2">
              <Wrench className="size-4" />
              Schedule Maintenance
            </Button>
          </div>
        </TabsContent>
      </Tabs>

      <EditVehicleDialog vehicle={vehicle} open={editOpen} onOpenChange={setEditOpen} />
    </div>
  )
}
