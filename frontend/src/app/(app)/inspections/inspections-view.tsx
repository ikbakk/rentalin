"use client"

import { useState, useMemo } from "react"
import { useInspections } from "@/hooks/use-inspections"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { EmptyState } from "@/components/shared/empty-state"
import { ListSkeleton } from "@/components/shared/loading-skeleton"
import { SectionHeader } from "@/components/shared/section-header"
import { Camera, CheckCircle2, AlertTriangle, Clock, ClipboardCheck } from "lucide-react"
import { cn } from "@/lib/utils"
import { useRouter } from "next/navigation"
import type { InspectionResponse } from "@/lib/types"

type FilterStatus = "all" | "Pending" | "Completed" | "Failed"
type FilterType = "all" | "PreRental" | "PostRental"

export function InspectionsView() {
  const { data: inspections, isLoading } = useInspections()
  const [statusFilter, setStatusFilter] = useState<FilterStatus>("all")
  const [typeFilter, setTypeFilter] = useState<FilterType>("all")

  const filtered = useMemo(() => {
    let result = inspections ?? []

    if (statusFilter !== "all") {
      result = result.filter(i => i.status === statusFilter)
    }

    if (typeFilter !== "all") {
      result = result.filter(i => i.inspectionType === typeFilter)
    }

    return result
  }, [inspections, statusFilter, typeFilter])

  const stats = useMemo(() => ({
    pending: inspections?.filter(i => i.status === "Pending").length ?? 0,
    completed: inspections?.filter(i => i.status === "Completed").length ?? 0,
    failed: inspections?.filter(i => i.status === "Failed").length ?? 0,
  }), [inspections])

  const grouped = useMemo(() => {
    const groups: Record<string, InspectionResponse[]> = {}
    for (const i of filtered) {
      if (!groups[i.status]) groups[i.status] = []
      groups[i.status].push(i)
    }
    return groups
  }, [filtered])

  if (isLoading) {
    return (
      <div className="p-4 lg:p-6">
        <div className="space-y-3">
          {[1, 2, 3].map(i => <div key={i} className="h-24 animate-pulse rounded-xl bg-muted" />)}
        </div>
      </div>
    )
  }

  if (!inspections?.length) {
    return (
      <div className="flex flex-col items-center justify-center p-6">
        <EmptyState
          title="No inspections"
          description="Inspections are created when rentals start and end"
        />
      </div>
    )
  }

  return (
    <div className="flex flex-col pb-20 lg:pb-6">
      <div className="px-4 py-4 lg:px-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="flex size-9 items-center justify-center rounded-lg bg-amber-500/10">
                <Clock className="size-4 text-amber-600 dark:text-amber-400" />
              </div>
              <div>
                <p className="font-mono text-lg font-bold">{stats.pending}</p>
                <p className="text-xs text-muted-foreground">Pending</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex size-9 items-center justify-center rounded-lg bg-emerald-500/10">
                <CheckCircle2 className="size-4 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div>
                <p className="font-mono text-lg font-bold">{stats.completed}</p>
                <p className="text-xs text-muted-foreground">Passed</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex size-9 items-center justify-center rounded-lg bg-destructive/10">
                <AlertTriangle className="size-4 text-destructive" />
              </div>
              <div>
                <p className="font-mono text-lg font-bold">{stats.failed}</p>
                <p className="text-xs text-muted-foreground">Failed</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="px-4 lg:px-6">
        <div className="flex flex-wrap gap-2">
          <div className="flex items-center gap-1 rounded-lg bg-muted p-1">
            <span className="px-2 py-1 text-xs font-medium text-muted-foreground uppercase tracking-wider">Type</span>
            {(["all", "PreRental", "PostRental"] as const).map(t => (
              <button
                key={t}
                onClick={() => setTypeFilter(t)}
                className={cn(
                  "rounded-md px-2 py-1 text-xs font-medium transition-colors",
                  typeFilter === t ? "bg-background shadow-sm" : "hover:bg-background/50"
                )}
              >
                {t === "all" ? "All" : t === "PreRental" ? "Pre-Rental" : "Post-Rental"}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-1 rounded-lg bg-muted p-1">
            <span className="px-2 py-1 text-xs font-medium text-muted-foreground uppercase tracking-wider">Status</span>
            {(["all", "Pending", "Completed", "Failed"] as const).map(s => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={cn(
                  "rounded-md px-2 py-1 text-xs font-medium transition-colors",
                  statusFilter === s ? "bg-background shadow-sm" : "hover:bg-background/50"
                )}
              >
                {s === "all" ? "All" : s}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-4 flex flex-col gap-4 px-4 lg:px-6">
        {(["Pending", "Completed", "Failed"] as const).map(status => {
          const items = grouped[status]
          if (!items?.length) return null

          const statusConfig = {
            Pending: { label: "Pending", color: "text-amber-600 dark:text-amber-400" },
            Completed: { label: "Passed", color: "text-emerald-600 dark:text-emerald-400" },
            Failed: { label: "Failed", color: "text-destructive" },
          }

          return (
            <div key={status}>
              <SectionHeader
                title={statusConfig[status].label}
                count={items.length}
                className={statusConfig[status].color}
              />
              <div className="space-y-2">
                {items.map((insp, idx) => (
                  <div key={insp.id} className={cn("animate-fade-up", `stagger-${(idx % 8) + 1}`)}>
                    <InspectionListItem inspection={insp} />
                  </div>
                ))}
              </div>
            </div>
          )
        })}

        {filtered.length === 0 && (
          <div className="py-8 text-center text-sm text-muted-foreground">
            No inspections match your filters
          </div>
        )}
      </div>
    </div>
  )
}

function InspectionListItem({ inspection }: { inspection: InspectionResponse }) {
  const router = useRouter()
  const isPreRental = inspection.inspectionType === "PreRental"

  const statusConfig: Record<string, { bg: string; text: string; label: string }> = {
    Pending: { bg: "bg-amber-500/10", text: "text-amber-600 dark:text-amber-400", label: "Pending" },
    Completed: { bg: "bg-emerald-500/10", text: "text-emerald-600 dark:text-emerald-400", label: "Passed" },
    Failed: { bg: "bg-destructive/10", text: "text-destructive", label: "Failed" },
  }

  const config = statusConfig[inspection.status]

  return (
    <Card className="transition-all hover:shadow-md cursor-pointer" onClick={() => router.push(`/inspections/${inspection.id}`)}>
      <CardContent className="flex items-center gap-4 p-4">
        <div className={cn("flex size-12 shrink-0 items-center justify-center rounded-xl", config.bg)}>
          <Camera className={cn("size-5", config.text)} />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs font-medium">
              {isPreRental ? "Pre-Rental" : "Post-Rental"}
            </Badge>
            <span className="text-xs text-muted-foreground">
              {inspection.inspectionDate
                ? new Date(inspection.inspectionDate).toLocaleDateString()
                : "No date"}
            </span>
          </div>

          {inspection.notes && (
            <p className="mt-1 text-sm text-muted-foreground truncate">{inspection.notes}</p>
          )}

          {inspection.photoUrls && inspection.photoUrls.length > 0 && (
            <div className="mt-2 flex items-center gap-1 text-xs text-muted-foreground">
              <Camera className="size-3" />
              <span>{inspection.photoUrls.length} photo{inspection.photoUrls.length !== 1 ? "s" : ""}</span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          <Badge variant="outline" className={cn("font-medium", config.bg, config.text)}>
            {config.label}
          </Badge>
        </div>
      </CardContent>
    </Card>
  )
}
