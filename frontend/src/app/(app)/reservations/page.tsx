import { PageHeader } from "@/components/shared/page-header"
import { ReservationsContent } from "./reservations-content"

export default function ReservationsPage() {
  return (
    <>
      <PageHeader title="Reservations" />
      <ReservationsContent />
    </>
  )
}
