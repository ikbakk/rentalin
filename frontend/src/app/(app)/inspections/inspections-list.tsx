"use client"

import { useInspections } from "@/hooks/use-inspections"
import { InspectionCard } from "./inspection-card"
import { EmptyState } from "@/components/shared/empty-state"
import { ListSkeleton } from "@/components/shared/loading-skeleton"

export function InspectionsList() {
  const { data: inspections, isLoading } = useInspections()

  if (isLoading) return <ListSkeleton count={3} />
  if (!inspections?.length) return <EmptyState title="No inspections" description="Inspections are created when rentals start and end" />

  return <div className="flex flex-col gap-3 p-4">{inspections.map((i) => <InspectionCard key={i.id} inspection={i} />)}</div>
}
