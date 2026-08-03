import type { Metadata } from "next"
import { BookingContent } from "./booking-content"

export const metadata: Metadata = { title: "Book a Vehicle — Rentalin" }

export default function BookingPage({ params }: { params: Promise<{ slug: string }> }) {
  return (
    <div className="min-h-dvh bg-background">
      <div className="mx-auto max-w-5xl">
        <header className="border-b border-border px-6 py-8 lg:py-10">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground mb-1">Rentalin</p>
              <h1 className="font-mono text-2xl font-bold tracking-tight lg:text-3xl">
                Book Your Ride
              </h1>
              <p className="mt-1 text-sm text-muted-foreground">
                Choose from our available fleet
              </p>
            </div>
            <div className="hidden lg:flex size-12 items-center justify-center rounded-xl bg-muted">
              <svg className="size-6 text-foreground" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.5 2.8c-.1.2-.1.4-.1.6v4.7c0 .6.4 1 1 1h2" />
                <circle cx="7" cy="17" r="2" />
                <circle cx="17" cy="17" r="2" />
              </svg>
            </div>
          </div>
        </header>
        <BookingContent />
      </div>
    </div>
  )
}
