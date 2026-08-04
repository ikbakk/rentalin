"use client"

import { useState, useMemo } from "react"
import { useVehicles } from "@/hooks/use-vehicles"
import { VehicleCard } from "./vehicle-card"
import { AddVehicleDialog } from "./add-vehicle-dialog"
import { EditVehicleDialog } from "./edit-vehicle-dialog"
import { SectionHeader } from "@/components/shared/section-header"
import { EmptyState } from "@/components/shared/empty-state"
import { ListSkeleton } from "@/components/shared/loading-skeleton"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Plus, Search, Car, SlidersHorizontal, ArrowUpDown, Pencil } from "lucide-react"
import { cn } from "@/lib/utils"
import { statusColor } from "@/lib/status-config"
import { useRouter } from "next/navigation"
import type { VehicleResponse } from "@/lib/types"

const statuses = [
  { key: "all", label: "All" },
  { key: "Available", label: "Available" },
  { key: "Rented", label: "Rented" },
  { key: "Maintenance", label: "Maintenance" },
  { key: "Retired", label: "Retired" },
]

type SortKey = "licensePlate" | "make" | "status" | "dailyRateAmount"
type SortDir = "asc" | "desc"

export function FleetView() {
  const { data: vehicles, isLoading } = useVehicles()
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [editingVehicle, setEditingVehicle] = useState<VehicleResponse | null>(null)
  const [filter, setFilter] = useState<string>("all")
  const [search, setSearch] = useState("")
  const [sortKey, setSortKey] = useState<SortKey>("licensePlate")
  const [sortDir, setSortDir] = useState<SortDir>("asc")

  const filtered = useMemo(() => {
    let result = vehicles ?? []

    if (filter !== "all") {
      result = result.filter(v => v.status === filter)
    }

    if (search) {
      const q = search.toLowerCase()
      result = result.filter(v =>
        v.licensePlate.toLowerCase().includes(q) ||
        v.make.toLowerCase().includes(q) ||
        v.model.toLowerCase().includes(q)
      )
    }

    return result
  }, [vehicles, filter, search])

  const sorted = useMemo(() => {
    return [...filtered].sort((a, b) => {
      let aVal: string | number = ""
      let bVal: string | number = ""

      switch (sortKey) {
        case "licensePlate": aVal = a.licensePlate; bVal = b.licensePlate; break
        case "make": aVal = a.make + a.model; bVal = b.make + b.model; break
        case "status": aVal = a.status; bVal = b.status; break
        case "dailyRateAmount": aVal = a.dailyRateAmount; bVal = b.dailyRateAmount; break
      }

      if (aVal < bVal) return sortDir === "asc" ? -1 : 1
      if (aVal > bVal) return sortDir === "asc" ? 1 : -1
      return 0
    })
  }, [filtered, sortKey, sortDir])

  const grouped = useMemo(() => {
    const groups: Record<string, VehicleResponse[]> = {}
    for (const v of sorted) {
      if (!groups[v.status]) groups[v.status] = []
      groups[v.status].push(v)
    }
    return groups
  }, [sorted])

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir(prev => prev === "asc" ? "desc" : "asc")
    } else {
      setSortKey(key)
      setSortDir("asc")
    }
  }

  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = { all: vehicles?.length ?? 0 }
    for (const v of vehicles ?? []) {
      counts[v.status] = (counts[v.status] ?? 0) + 1
    }
    return counts
  }, [vehicles])

  if (isLoading) {
    return (
      <div className="p-4 lg:p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="h-8 w-48 animate-pulse rounded-lg bg-muted" />
          <div className="h-10 w-full max-w-md animate-pulse rounded-xl bg-muted" />
        </div>
        <div className="mt-6 grid grid-cols-1 gap-3 lg:grid-cols-2 xl:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map(i => <CardSkeleton key={i} />)}
        </div>
      </div>
    )
  }

  if (!vehicles?.length) {
    return (
      <div className="flex flex-col items-center justify-center p-6">
        <EmptyState
          title="No vehicles yet"
          description="Add your first vehicle to start managing your fleet"
          action={{ label: "Add Vehicle", onClick: () => setOpen(true) }}
        />
        <AddVehicleDialog open={open} onOpenChange={setOpen} />
      </div>
    )
  }

  return (
    <div className="flex flex-col pb-20 lg:pb-6">
      <div className="px-4 py-4 lg:px-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search vehicles..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="h-10 w-full pl-9 lg:w-64 rounded-xl bg-muted/50"
              />
            </div>
            <Button variant="outline" size="icon" aria-label="Filter vehicles" className="shrink-0 size-10 rounded-xl">
              <SlidersHorizontal className="size-4" />
            </Button>
          </div>
        </div>

        <div className="mt-4 flex items-center gap-2 overflow-x-auto pb-2 lg:mt-6">
          {statuses.map(s => (
            <button
              key={s.key}
              onClick={() => setFilter(s.key)}
              className={cn(
                "flex items-center gap-2 shrink-0 rounded-full px-4 py-2 text-sm font-medium transition-all",
                filter === s.key
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "bg-muted text-muted-foreground hover:bg-muted/80"
              )}
            >
              {s.label}
              <span className={cn(
                "text-xs",
                filter === s.key ? "opacity-70" : ""
              )}>
                {statusCounts[s.key] ?? 0}
              </span>
            </button>
          ))}
        </div>
      </div>

      <div className="hidden lg:block px-6">
        {sorted.length > 0 ? (
          <Card>
            <CardHeader className="border-b py-3 px-4">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                className="h-8 gap-1 px-2"
                onClick={() => handleSort("licensePlate")}
              >
                Plate
                <ArrowUpDown className={cn("size-3", sortKey === "licensePlate" ? "text-primary" : "text-muted-foreground")} />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 gap-1 px-2"
                onClick={() => handleSort("make")}
              >
                Vehicle
                <ArrowUpDown className={cn("size-3", sortKey === "make" ? "text-primary" : "text-muted-foreground")} />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 gap-1 px-2"
                onClick={() => handleSort("status")}
              >
                Status
                <ArrowUpDown className={cn("size-3", sortKey === "status" ? "text-primary" : "text-muted-foreground")} />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 gap-1 px-2 ml-auto"
                onClick={() => handleSort("dailyRateAmount")}
              >
                Daily Rate
                <ArrowUpDown className={cn("size-3", sortKey === "dailyRateAmount" ? "text-primary" : "text-muted-foreground")} />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sorted.map(v => (
                  <TableRow key={v.id} className="cursor-pointer hover:bg-muted/50" onClick={() => router.push(`/fleet/${v.id}`)}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="flex size-9 items-center justify-center rounded-lg bg-primary/10">
                          <Car className="size-4 text-primary" />
                        </div>
                        <span className="font-mono text-sm font-semibold">{v.licensePlate}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-medium">{v.make} {v.model}</span>
                        <span className="text-xs text-muted-foreground">{v.year} · {v.color} · {v.seatingCapacity} seats</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={cn("font-medium", statusColor(v.status))}>
                        {v.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <span className="font-mono font-semibold">
                        {v.dailyRateCurrency} {v.dailyRateAmount.toLocaleString()}
                      </span>
                      <span className="text-xs text-muted-foreground">/day</span>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="icon"
                        aria-label={`Edit ${v.licensePlate}`}
                        onClick={e => { e.stopPropagation(); setEditingVehicle(v) }}
                        className="size-8 rounded-lg"
                      >
                        <Pencil className="size-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
          </Card>
        ) : (
          <div className="py-10 text-center text-sm text-muted-foreground">
            No vehicles match your search
          </div>
        )}
      </div>

      <div className="flex flex-col gap-3 px-4 lg:hidden">
        {filter === "all" ? (
          Object.entries(grouped).map(([status, vehicles]) => (
            <div key={status}>
              <SectionHeader title={status} count={vehicles.length} />
              <div className="space-y-2">
                {vehicles.map(v => (
                  <VehicleCard key={v.id} vehicle={v} onEdit={() => setEditingVehicle(v)} />
                ))}
              </div>
            </div>
          ))
        ) : (
          sorted.map(v => (
            <VehicleCard key={v.id} vehicle={v} onEdit={() => setEditingVehicle(v)} />
          ))
        )}
        {sorted.length === 0 && (
          <div className="py-8 text-center text-sm text-muted-foreground">
            No vehicles match your search
          </div>
        )}
      </div>

      <Button
        className="fixed bottom-20 right-4 size-14 rounded-2xl shadow-lg lg:bottom-6"
        onClick={() => setOpen(true)}
        size="icon"
        aria-label="Add vehicle"
      >
        <Plus className="size-5" />
      </Button>

      <AddVehicleDialog open={open} onOpenChange={setOpen} />

      {editingVehicle && (
        <EditVehicleDialog
          key={editingVehicle.id}
          vehicle={editingVehicle}
          open={true}
          onOpenChange={v => { if (!v) setEditingVehicle(null) }}
        />
      )}
    </div>
  )
}

function CardSkeleton() {
  return (
    <div className="h-24 rounded-xl bg-muted animate-shimmer" />
  )
}
