import type { Metadata } from "next"
import { BookingPageClient } from "./booking-page-client"

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  return { title: `Book at ${slug}` }
}

export default async function BookingPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  return <BookingPageClient slug={slug} />
}
