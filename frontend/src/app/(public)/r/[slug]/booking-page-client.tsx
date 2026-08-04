"use client"

import { notFound } from "next/navigation"
import { usePublicBusiness } from "@/hooks/use-public-business"
import { BookingContent } from "./booking-content"
import { Skeleton } from "@/components/ui/skeleton"
import { MapPin, Phone } from "lucide-react"

export function BookingPageClient({ slug }: { slug: string }) {
  const { data: business, isLoading, isError } = usePublicBusiness(slug)

  if (isError) notFound()

  return (
    <div className="animate-fade-in">
      <section className="relative overflow-hidden border-b border-border/60">
        {/* decorative glow */}
        <div aria-hidden className="pointer-events-none absolute inset-0">
          <div className="absolute -top-32 right-[-8%] size-80 rounded-full bg-primary/10 blur-3xl" />
          <div className="absolute -bottom-24 left-[-6%] size-64 rounded-full bg-success/10 blur-3xl" />
        </div>

        <div className="relative flex flex-col gap-8 py-12 sm:py-16 md:flex-row md:items-center md:justify-between md:gap-12 lg:py-20">
          <div className="max-w-2xl">
            {isLoading ? (
              <div className="space-y-3">
                <Skeleton className="h-3 w-24" />
                <Skeleton className="h-12 w-72 sm:h-14 sm:w-96" />
                <Skeleton className="h-5 w-80 max-w-full" />
                <Skeleton className="h-4 w-56" />
              </div>
            ) : (
              <>
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-primary">
                  Book a vehicle
                </p>
                <h1 className="mt-3 font-heading text-4xl font-bold tracking-tight text-balance sm:text-5xl">
                  Book at {business?.name ?? "Us"}
                </h1>
                <p className="mt-4 max-w-xl text-base text-muted-foreground sm:text-lg">
                  Choose from our available fleet and send a booking request — we&apos;ll
                  confirm on WhatsApp.
                </p>
                {business && (
                  <div className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-muted-foreground">
                    {business.address && (
                      <span className="flex items-center gap-1.5">
                        <MapPin className="size-4 text-primary" />
                        {business.address}
                      </span>
                    )}
                    {business.phone && (
                      <span className="flex items-center gap-1.5 font-mono tabular-nums">
                        <Phone className="size-4 text-primary" />
                        {business.phone}
                      </span>
                    )}
                  </div>
                )}
              </>
            )}
          </div>

          <div className="md:shrink-0">
            {isLoading ? (
              <Skeleton className="size-28 rounded-3xl sm:size-36" />
            ) : (
              <div className="flex size-28 items-center justify-center rounded-3xl bg-gradient-to-br from-primary/30 via-primary/10 to-secondary ring-1 ring-primary/20 sm:size-36">
                {business?.logoUrl ? (
                  <img
                    src={business.logoUrl}
                    alt={business.name}
                    className="size-16 rounded-2xl object-cover sm:size-20"
                  />
                ) : (
                  <span className="font-heading text-5xl font-bold text-primary sm:text-6xl">
                    {business?.name?.charAt(0) ?? "R"}
                  </span>
                )}
              </div>
            )}
          </div>
        </div>
      </section>

      <BookingContent slug={slug} />
    </div>
  )
}
