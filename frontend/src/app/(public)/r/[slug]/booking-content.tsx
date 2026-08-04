"use client"

import { useState, useEffect } from "react"
import { usePublicVehiclesBySlug } from "@/hooks/use-public-vehicles-by-slug"
import { useCreatePublicInquiry } from "@/hooks/use-public-inquiry"
import { usePublicBusiness } from "@/hooks/use-public-business"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet"
import { Separator } from "@/components/ui/separator"
import { Skeleton } from "@/components/ui/skeleton"
import { toast } from "sonner"
import {
  Car,
  Users,
  CheckCircle2,
  MessageCircle,
  Calendar,
  Check,
  ArrowRight,
  Send,
  Loader2,
} from "lucide-react"
import { cn } from "@/lib/utils"

/** Token-based gradient per vehicle (cycled by index) — no raw palette colors. */
const GRADIENTS = [
  "from-primary/30 via-primary/10 to-secondary",
  "from-success/25 via-success/10 to-secondary",
  "from-warning/25 via-warning/10 to-secondary",
  "from-primary/20 via-secondary to-secondary/40",
] as const

function VehiclePlaceholder({ index, plate }: { index: number; plate: string }) {
  return (
    <div
      className={cn(
        "relative flex h-40 items-center justify-center overflow-hidden bg-gradient-to-br",
        GRADIENTS[index % GRADIENTS.length]
      )}
    >
      <div
        aria-hidden
        className="absolute inset-0 opacity-30 [background-image:repeating-linear-gradient(135deg,var(--foreground)_0,var(--foreground)_1px,transparent_1px,transparent_16px)]"
      />
      <Car
        aria-hidden
        className="relative size-12 text-foreground/30 transition-transform duration-300 group-hover:scale-110 group-hover:text-foreground/45"
      />
      {/* Indonesian-style plate chip */}
      <span className="absolute bottom-3 left-3 rounded-md border-2 border-red-600/60 bg-white px-2.5 py-1 font-mono text-[11px] font-bold tracking-[0.15em] text-black shadow-sm">
        {plate}
      </span>
    </div>
  )
}

export function BookingContent({ slug }: { slug: string }) {
  const { data: vehicles, isLoading } = usePublicVehiclesBySlug(slug)
  const createInquiry = useCreatePublicInquiry(slug)
  const { data: business } = usePublicBusiness(slug)
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 1024)
    checkMobile()
    window.addEventListener("resize", checkMobile)
    return () => window.removeEventListener("resize", checkMobile)
  }, [])

  const available = vehicles ?? []

  const [selected, setSelected] = useState<string | null>(null)
  const [name, setName] = useState("")
  const [phone, setPhone] = useState("")
  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState("")
  const [submitted, setSubmitted] = useState(false)
  const [submittedData, setSubmittedData] = useState<{
    vehicle: string
    name: string
    phone: string
    start: string
    end: string
  } | null>(null)

  const selectedVehicle = available.find((v) => v.id === selected)

  const submit = async () => {
    if (!selected || !name || !phone || !startDate || !endDate) {
      toast.error("Please fill in all fields")
      return
    }
    try {
      await createInquiry.mutateAsync({
        customerName: name,
        customerPhone: phone,
        vehicleId: selected,
        startDate: new Date(startDate).toISOString(),
        endDate: new Date(endDate).toISOString(),
      })
      const veh = available.find((v) => v.id === selected)
      setSubmittedData({
        vehicle: veh
          ? `${veh.make} ${veh.model} (${veh.licensePlate})`
          : "Selected",
        name,
        phone,
        start: startDate,
        end: endDate,
      })
      setSubmitted(true)
    } catch {
      toast.error("Failed to submit. Please try again.")
    }
  }

  const resetBooking = () => {
    setSubmitted(false)
    setSelected(null)
    setName("")
    setPhone("")
    setStartDate("")
    setEndDate("")
  }

  const waLink = (number: string) =>
    `https://wa.me/${number.replace(/[^0-9]/g, "")}`

  if (isLoading) {
    return (
      <section className="py-10 sm:py-14">
        <div className="mb-6 space-y-2">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-64 max-w-full" />
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 lg:gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="overflow-hidden rounded-2xl ring-1 ring-border/60">
              <Skeleton className="h-40 rounded-none" />
              <div className="space-y-3 p-5">
                <div className="flex items-start justify-between gap-3">
                  <Skeleton className="h-5 w-32" />
                  <Skeleton className="h-5 w-20" />
                </div>
                <Skeleton className="h-3 w-40" />
                <Skeleton className="h-px w-full" />
                <Skeleton className="h-3 w-24" />
              </div>
            </div>
          ))}
        </div>
      </section>
    )
  }

  if (submitted && submittedData) {
    return (
      <section className="flex min-h-[60vh] items-center justify-center py-12">
        <div className="w-full max-w-lg animate-fade-up rounded-2xl bg-card p-8 text-center ring-1 ring-foreground/10">
          <div className="mx-auto flex size-16 items-center justify-center rounded-full bg-success/15 ring-1 ring-success/30">
            <CheckCircle2 className="size-8 text-success" />
          </div>
          <h2 className="mt-5 font-heading text-2xl font-bold tracking-tight">
            Booking Request Sent!
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            {submittedData.vehicle} · {business?.name ?? "our team"} will confirm shortly.
          </p>

          <div className="mt-6 grid grid-cols-2 gap-3 text-left">
            <div className="rounded-xl bg-muted/50 p-4">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Calendar className="size-3.5" />
                Period
              </div>
              <p className="mt-1.5 font-mono text-sm font-semibold tabular-nums">
                {submittedData.start}
              </p>
              <p className="text-xs text-muted-foreground">to {submittedData.end}</p>
            </div>
            <div className="rounded-xl bg-muted/50 p-4">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Users className="size-3.5" />
                Contact
              </div>
              <p className="mt-1.5 text-sm font-semibold">{submittedData.name}</p>
              <p className="font-mono text-xs text-muted-foreground">
                {submittedData.phone}
              </p>
            </div>
          </div>

          <div className="mt-4 flex items-center gap-3 rounded-xl bg-success/10 p-3.5 text-sm font-medium text-success ring-1 ring-success/20">
            <MessageCircle className="size-5 shrink-0" />
            We&apos;ll contact you via WhatsApp
          </div>

          <Button
            className="mt-4 h-12 w-full gap-2 rounded-xl bg-success text-base font-semibold text-success-foreground shadow-lg shadow-success/25 hover:bg-success/90"
            onClick={() => window.open(waLink(submittedData.phone), "_blank")}
          >
            <MessageCircle className="size-5" />
            Continue on WhatsApp
          </Button>

          <Button
            variant="outline"
            className="mt-3 h-11 w-full rounded-xl"
            onClick={resetBooking}
          >
            Book Another Vehicle
          </Button>
        </div>
      </section>
    )
  }

  if (available.length === 0) {
    return (
      <section className="flex min-h-[50vh] items-center justify-center py-12">
        <div className="w-full max-w-md animate-fade-up rounded-2xl bg-card p-8 text-center ring-1 ring-foreground/10">
          <div className="mx-auto flex size-16 items-center justify-center rounded-2xl bg-gradient-to-br from-primary/30 via-primary/10 to-secondary ring-1 ring-primary/20">
            <Car className="size-8 text-primary" />
          </div>
          <h2 className="mt-4 font-heading text-xl font-bold tracking-tight">
            No Vehicles Available
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Please check back later or contact us directly.
          </p>
          <Button
            className="mt-6 h-11 gap-2 rounded-xl bg-success text-success-foreground hover:bg-success/90"
            onClick={() => window.open(waLink(business?.phone ?? ""), "_blank")}
          >
            <MessageCircle className="size-4" />
            Contact Us
          </Button>
        </div>
      </section>
    )
  }

  return (
    <section className="py-10 sm:py-14">
      <div className="mb-6 flex items-end justify-between gap-4">
        <div>
          <h2 className="font-heading text-2xl font-bold tracking-tight sm:text-3xl">
            Available fleet
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Tap a vehicle to start your booking.
          </p>
        </div>
        <Badge variant="secondary" className="mb-1 hidden sm:inline-flex">
          {available.length} vehicle{available.length === 1 ? "" : "s"}
        </Badge>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 lg:gap-6">
        {available.map((v, index) => {
          const isSelected = selected === v.id

          return (
            <button
              key={v.id}
              type="button"
              aria-pressed={isSelected}
              onClick={() => setSelected(v.id)}
              className={cn(
                "group relative flex w-full cursor-pointer flex-col overflow-hidden rounded-2xl bg-card text-left ring-1 ring-border/80 transition-all duration-200 animate-fade-up",
                `stagger-${(index % 6) + 1}`,
                isSelected
                  ? "ring-2 ring-primary shadow-lg shadow-primary/10"
                  : "hover:-translate-y-1 hover:ring-2 hover:ring-primary/40 focus-visible:ring-2 focus-visible:ring-ring"
              )}
              style={{ animationDelay: `${index * 50}ms` }}
            >
              {isSelected && (
                <span className="absolute top-3 right-3 z-10 flex size-7 animate-scale-in items-center justify-center rounded-full bg-primary text-primary-foreground shadow-md">
                  <Check className="size-4" strokeWidth={3} />
                </span>
              )}

              <VehiclePlaceholder index={index} plate={v.licensePlate} />

              <div className="flex flex-1 flex-col gap-3 p-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h3 className="truncate font-heading text-lg font-bold leading-tight">
                      {v.make} {v.model}
                    </h3>
                    <p className="mt-0.5 text-xs text-muted-foreground">{v.year}</p>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="font-heading text-xl font-bold tracking-tight text-primary tabular-nums">
                      {v.dailyRateCurrency} {v.dailyRateAmount.toLocaleString()}
                    </p>
                    <p className="text-xs text-muted-foreground">/ day</p>
                  </div>
                </div>

                <div className="mt-auto flex items-center justify-between border-t border-border/60 pt-3">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1.5">
                      <Users className="size-3.5" />
                      {v.seatingCapacity}
                    </span>
                    <span aria-hidden>·</span>
                    <span className="capitalize">{v.color}</span>
                  </div>
                  <span
                    className={cn(
                      "flex items-center gap-1 text-xs font-semibold transition-colors",
                      isSelected
                        ? "text-primary"
                        : "text-muted-foreground group-hover:text-primary"
                    )}
                  >
                    {isSelected ? "Selected" : "Select"}
                    <ArrowRight className="size-3.5" />
                  </span>
                </div>
              </div>
            </button>
          )
        })}
      </div>

      <Sheet
        open={!!selectedVehicle}
        onOpenChange={(open) => !open && setSelected(null)}
      >
        <SheetContent
          side={isMobile ? "bottom" : "right"}
          className={cn(
            isMobile
              ? "rounded-t-3xl p-0 data-[side=bottom]:max-h-[92dvh] data-[side=bottom]:overflow-y-auto"
              : "rounded-l-3xl p-0 sm:max-w-lg!"
          )}
        >
          <SheetHeader className="gap-4 p-5">
            <div className="flex items-center gap-4 pr-10">
              <div className="flex size-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-primary/30 via-primary/10 to-secondary ring-1 ring-primary/20">
                <Car className="size-6 text-primary" />
              </div>
              <div className="min-w-0">
                <SheetTitle className="font-heading text-lg font-bold">
                  Book {selectedVehicle?.licensePlate}
                </SheetTitle>
                <SheetDescription className="mt-0.5">
                  {selectedVehicle?.make} {selectedVehicle?.model} ·{" "}
                  {selectedVehicle?.year}
                </SheetDescription>
              </div>
            </div>

            <div className="flex items-center justify-between rounded-xl bg-primary/10 p-4 ring-1 ring-primary/20">
              <div>
                <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Daily rate
                </p>
                <p className="mt-1 font-heading text-2xl font-bold tracking-tight text-primary tabular-nums">
                  {selectedVehicle?.dailyRateCurrency}{" "}
                  {selectedVehicle?.dailyRateAmount.toLocaleString()}
                  <span className="text-sm font-medium text-muted-foreground"> /day</span>
                </p>
              </div>
              <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                <Users className="size-4" />
                {selectedVehicle?.seatingCapacity} seats
              </div>
            </div>
          </SheetHeader>

          <div className="px-5 pb-6">
            <form
              onSubmit={(e) => {
                e.preventDefault()
                submit()
              }}
              className="space-y-4"
            >
              <div className="space-y-1.5">
                <Label
                  htmlFor="book-name"
                  className="text-xs font-semibold uppercase tracking-wider text-muted-foreground"
                >
                  Full Name
                </Label>
                <Input
                  id="book-name"
                  className="h-11 rounded-xl bg-background px-3.5"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Your full name"
                />
              </div>
              <div className="space-y-1.5">
                <Label
                  htmlFor="book-phone"
                  className="text-xs font-semibold uppercase tracking-wider text-muted-foreground"
                >
                  WhatsApp Number
                </Label>
                <Input
                  id="book-phone"
                  className="h-11 rounded-xl bg-background px-3.5 font-mono tabular-nums"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+62 812 3456 7890"
                  type="tel"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label
                    htmlFor="book-start"
                    className="text-xs font-semibold uppercase tracking-wider text-muted-foreground"
                  >
                    Pickup Date
                  </Label>
                  <Input
                    id="book-start"
                    className="h-11 rounded-xl bg-background px-3.5"
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label
                    htmlFor="book-end"
                    className="text-xs font-semibold uppercase tracking-wider text-muted-foreground"
                  >
                    Return Date
                  </Label>
                  <Input
                    id="book-end"
                    className="h-11 rounded-xl bg-background px-3.5"
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                  />
                </div>
              </div>

              <Separator />

              <Button
                type="submit"
                className="h-12 w-full gap-2 rounded-xl text-base font-semibold shadow-lg shadow-primary/25"
                disabled={createInquiry.isPending}
              >
                {createInquiry.isPending ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="size-5 animate-spin" />
                    Sending…
                  </span>
                ) : (
                  <>
                    <Send className="size-5" />
                    Send Booking Request
                  </>
                )}
              </Button>
              <p className="text-center text-xs text-muted-foreground">
                We&apos;ll confirm availability on WhatsApp — no payment needed now.
              </p>
            </form>
          </div>
        </SheetContent>
      </Sheet>
    </section>
  )
}
