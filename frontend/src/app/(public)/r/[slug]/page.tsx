import type { Metadata } from "next"
import { BookingPageClient } from "./booking-page-client"

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5000"

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  try {
    const res = await fetch(`${API_BASE}/api/public/${slug}`, {
      cache: "no-store",
      signal: AbortSignal.timeout(4000),
    })
    if (res.ok) {
      const business: { name?: string } = await res.json()
      if (business.name) return { title: `Book at ${business.name}` }
    }
  } catch {
    // API unreachable at request time — fall through to the static default
  }
  return { title: "Book a Vehicle — Rentalin" }
}

export default async function BookingPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  return <BookingPageClient slug={slug} />
}
