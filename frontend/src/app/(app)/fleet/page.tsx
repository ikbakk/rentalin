import { PageHeader } from "@/components/shared/page-header"
import { FleetView } from "./fleet-view"
import { Suspense } from "react"
import { ListSkeleton } from "@/components/shared/loading-skeleton"

export default function FleetPage() {
  return (
    <>
      <PageHeader title="Fleet" subtitle={`${new Date().toLocaleDateString("en-US", { month: "short", day: "numeric" })}`} />
      <Suspense fallback={<ListSkeleton count={5} />}>
        <FleetView />
      </Suspense>
    </>
  )
}
