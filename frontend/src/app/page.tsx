import type { Metadata } from "next"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Car, MessageCircle, Shield, Clock, Users, Calendar, Camera, Activity, ArrowRight } from "lucide-react"

export const metadata: Metadata = {
  title: "Rentalin — Operational Coordination for Vehicle Rental Businesses",
  description: "Fleet management, inspections, and rental tracking for rental businesses with 1-50 vehicles. Indonesia-first. Works offline.",
}

const features = [
  {
    icon: Car,
    title: "Fleet Management",
    description: "Track every vehicle in your fleet. Monitor status, schedule maintenance, and keep complete vehicle history.",
  },
  {
    icon: Calendar,
    title: "Inquiries → Reservations → Rentals",
    description: "Convert customer interest into confirmed rentals with a streamlined workflow. Never miss an inquiry.",
  },
  {
    icon: Camera,
    title: "Inspection Checklists",
    description: "Document vehicle condition with photo capture before and after every rental. Build a complete audit trail.",
  },
  {
    icon: Activity,
    title: "Timeline Audit Trail",
    description: "Every event is recorded with timestamp and actor. Complete visibility into your business operations.",
  },
]

const signals = [
  { label: "For rental businesses with 1–50 vehicles" },
  { label: "Indonesia-first design" },
  { label: "Works offline, outdoors, one-handed" },
]

export default function LandingPage() {
  return (
    <div className="min-h-dvh bg-background">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 size-80 rounded-full bg-primary/5 blur-3xl" />
        <div className="absolute top-1/2 -left-40 size-60 rounded-full bg-primary/3 blur-3xl" />
      </div>

      <header className="relative border-b border-border">
        <div className="mx-auto max-w-6xl px-4 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex size-8 items-center justify-center rounded-lg bg-primary">
                <Car className="size-4 text-primary-foreground" />
              </div>
              <span className="font-mono text-lg font-bold tracking-tight">Rentalin</span>
            </div>
            <div className="flex items-center gap-3">
              <Link href="/login">
                <Button size="sm" className="gap-2">
                  Login
                  <ArrowRight className="size-4" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      <main className="relative">
        <section className="mx-auto max-w-6xl px-4 py-20 lg:py-32 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <div className="inline-flex items-center gap-2 rounded-full border border-border bg-muted/50 px-3 py-1 text-xs font-medium text-muted-foreground mb-6">
              <Shield className="size-3" />
              Operational tool — not a marketplace
            </div>
            <h1 className="text-4xl font-bold tracking-tight lg:text-6xl">
              Operational coordination for{" "}
              <span className="text-primary">vehicle rental</span>{" "}
              businesses
            </h1>
            <p className="mt-6 text-lg text-muted-foreground lg:text-xl">
              Manage your fleet, track inspections, and monitor rentals from one place.
              Built for rental businesses in Indonesia.
            </p>
            <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
              <Link href="/book">
                <Button size="lg" className="h-12 gap-2 px-8 text-base font-semibold">
                  <Car className="size-5" />
                  Book a Vehicle
                </Button>
              </Link>
              <Link href="/login">
                <Button size="lg" variant="outline" className="h-12 gap-2 px-8 text-base font-semibold">
                  Staff Login
                </Button>
              </Link>
            </div>

            <div className="mt-8 flex flex-wrap items-center justify-center gap-4 text-xs text-muted-foreground">
              {signals.map((s) => (
                <span key={s.label} className="flex items-center gap-1.5">
                  <span className="size-1.5 rounded-full bg-primary" />
                  {s.label}
                </span>
              ))}
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-4 py-16 lg:py-24 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-2xl font-bold tracking-tight lg:text-3xl">
              Everything you need to run your rental business
            </h2>
            <p className="mt-2 text-muted-foreground">
              From first inquiry to final inspection — track every step
            </p>
          </div>

          <div className="grid gap-6 lg:grid-cols-2 lg:gap-8">
            {features.map((feature) => {
              const Icon = feature.icon
              return (
                <div
                  key={feature.title}
                  className="relative overflow-hidden rounded-2xl border border-border bg-card p-6 lg:p-8"
                >
                  <div className="flex items-start gap-4">
                    <div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-primary/10">
                      <Icon className="size-6 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg">{feature.title}</h3>
                      <p className="mt-2 text-sm text-muted-foreground">
                        {feature.description}
                      </p>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-4 py-16 lg:py-24 lg:px-8">
          <div className="relative overflow-hidden rounded-3xl border border-border bg-gradient-to-br from-primary/10 via-background to-background p-8 lg:p-16">
            <div className="relative mx-auto max-w-2xl text-center">
              <h2 className="text-2xl font-bold tracking-tight lg:text-4xl">
                Ready to streamline your rental operations?
              </h2>
              <p className="mt-4 text-muted-foreground">
                Join rental businesses across Indonesia using Rentalin to manage their fleet.
              </p>
              <div className="mt-8 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
                <Link href="/book">
                  <Button size="lg" className="h-12 gap-2 px-8 text-base font-semibold">
                    <Car className="size-5" />
                    Book a Vehicle
                  </Button>
                </Link>
                <Link href="/login">
                  <Button size="lg" variant="outline" className="h-12 gap-2 px-8 text-base font-semibold">
                    Login to Dashboard
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-4 py-12 lg:px-8">
          <div className="flex flex-col items-center justify-between gap-6 text-center lg:flex-row lg:text-left">
            <div className="flex items-center gap-2">
              <div className="flex size-8 items-center justify-center rounded-lg bg-primary">
                <Car className="size-4 text-primary-foreground" />
              </div>
              <span className="font-mono text-lg font-bold tracking-tight">Rentalin</span>
            </div>
            <div className="flex items-center gap-6 text-sm text-muted-foreground">
              <Link href="/book" className="hover:text-foreground transition-colors">
                Book Vehicle
              </Link>
              <Link href="/login" className="hover:text-foreground transition-colors">
                Staff Login
              </Link>
              <div className="flex items-center gap-2">
                <MessageCircle className="size-4" />
                <span>WhatsApp Support</span>
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              © 2026 Rentalin. All rights reserved.
            </p>
          </div>
        </section>
      </main>
    </div>
  )
}
