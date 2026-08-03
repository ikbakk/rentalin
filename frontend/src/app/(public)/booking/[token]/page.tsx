import type { Metadata } from "next"
import { BookingView } from "./booking-view"

export const metadata: Metadata = { title: "Your Booking — Rentalin" }

export default async function BookingPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params
  return (
    <div className="min-h-dvh bg-background">
      <BookingView reservationId={token} />
    </div>
  )
}
