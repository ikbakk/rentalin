import { PageHeader } from "@/components/shared/page-header"
import { CustomersView } from "./customers-view"
import { Suspense } from "react"
import { ListSkeleton } from "@/components/shared/loading-skeleton"

export default function CustomersPage() {
  return (
    <>
      <PageHeader title="Customers" />
      <Suspense fallback={<ListSkeleton count={5} />}>
        <CustomersView />
      </Suspense>
    </>
  )
}
