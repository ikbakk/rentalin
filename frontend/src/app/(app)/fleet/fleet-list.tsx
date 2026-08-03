"use client"

import { useState } from "react"
import { useVehicles } from "@/hooks/use-vehicles"
import { VehicleCard } from "./vehicle-card"
import { AddVehicleDialog } from "./add-vehicle-dialog"
import { EmptyState } from "@/components/shared/empty-state"
import { ListSkeleton } from "@/components/shared/loading-skeleton"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import { cn } from "@/lib/utils"

const stagger = ["stagger-1", "stagger-2", "stagger-3", "stagger-4", "stagger-5"]

export function FleetList() {
  const { data: vehicles, isLoading } = useVehicles()
  const [open, setOpen] = useState(false)

  if (isLoading) return <ListSkeleton count={4} />
  if (!vehicles?.length) return (
    <EmptyState title="No vehicles yet" description="Add your first vehicle to get started" action={{ label: "Add Vehicle", onClick: () => setOpen(true) }} />
  )

  return (
    <>
      <div className="flex flex-col gap-3 p-4">
        {vehicles.map((v, i) => (
          <div key={v.id} className={cn("animate-slide-up", stagger[i % stagger.length])}>
            <VehicleCard vehicle={v} />
          </div>
        ))}
      </div>
      <Button className="fixed right-4 bottom-20 size-14 rounded-full shadow-lg bg-primary text-primary-foreground hover:bg-primary/90" onClick={() => setOpen(true)} size="icon">
        <Plus className="size-6" />
      </Button>
      <AddVehicleDialog open={open} onOpenChange={setOpen} />
    </>
  )
}
