import type { Metadata } from "next"
import { TxView } from "./tx-view"

export const metadata: Metadata = { title: "Your Rental — Rentalin" }

export default async function TxPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  return (
    <div className="min-h-dvh bg-background">
      <TxView rentalId={id} />
    </div>
  )
}
