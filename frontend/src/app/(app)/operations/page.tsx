import { PageHeader } from "@/components/shared/page-header"
import { OperationsView } from "./operations-view"
import { Suspense } from "react"
import { ListSkeleton } from "@/components/shared/loading-skeleton"

export default function OperationsPage() {
  return (
    <>
      <PageHeader title="Today" subtitle={new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })} />
      <Suspense fallback={<ListSkeleton count={6} />}>
        <OperationsView />
      </Suspense>
    </>
  )
}
