import { PageHeader } from "@/components/shared/page-header"
import { EventsList } from "./events-list"
import { Suspense } from "react"
import { ListSkeleton } from "@/components/shared/loading-skeleton"

export default function EventsPage() {
  return (
    <>
      <PageHeader title="Events" subtitle="Chronological event log" />
      <Suspense fallback={<ListSkeleton count={8} />}>
        <EventsList />
      </Suspense>
    </>
  )
}
