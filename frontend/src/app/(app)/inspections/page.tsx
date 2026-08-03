import { PageHeader } from "@/components/shared/page-header"
import { InspectionsView } from "./inspections-view"
import { Suspense } from "react"
import { ListSkeleton } from "@/components/shared/loading-skeleton"

export default function InspectionsPage() {
  return (
    <>
      <PageHeader title="Inspections" />
      <Suspense fallback={<ListSkeleton count={3} />}>
        <InspectionsView />
      </Suspense>
    </>
  )
}
