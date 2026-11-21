"use client"

import { useState, useEffect } from "react"
import { BookingVerification } from "@/components/shared/booking-verification"
import { usePublicVehiclesBySlug } from "@/hooks/use-public-vehicles-by-slug"
import { useCreatePublicInquiry } from "@/hooks/use-public-inquiry"
import { usePublicBusiness } from "@/hooks/use-public-business"
import { businessDateToIso, DEFAULT_BUSINESS_TIME_ZONE } from "@/lib/business-time"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { VehicleBrowser } from "./vehicle-browser"
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
  Send,
  Loader2,
} from "lucide-react"
import { cn } from "@/lib/utils"

export function BookingContent({ slug }: { slug: string }) {
  const { data: vehicles, isLoading } = usePublicVehiclesBySlug(slug)
  const createInquiry = useCreatePublicInquiry(slug)
  const { data: business } = usePublicBusiness(slug)
  const businessTimeZone = business?.timeZone ?? DEFAULT_BUSINESS_TIME_ZONE
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
  const [turnstileToken, setTurnstileToken] = useState("")
  const [verificationAttempt, setVerificationAttempt] = useState(0)
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
    if (!turnstileToken) { toast.error("Complete the booking verification first"); return }
    const startDateIso = businessDateToIso(startDate, businessTimeZone)
    const endDateIso = businessDateToIso(endDate, businessTimeZone)
    if (!startDateIso || !endDateIso || Date.parse(endDateIso) <= Date.parse(startDateIso)) {
      toast.error("Return date must be after pickup date")
      return
    }
    try {
      await createInquiry.mutateAsync({
        turnstileToken,
        customerName: name,
        customerPhone: phone,
        vehicleId: selected,
        startDate: startDateIso,
        endDate: endDateIso,
      })
      const veh = available.find((v) => v.id === selected)
      setSubmittedData({
        vehicle: veh
          ? `${veh.make} ${veh.model}`
          : "Selected",
        name,
        phone,
        start: startDate,
        end: endDate,
      })
      setSubmitted(true)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to submit. Please try again.")
    } finally {
      setTurnstileToken("")
      setVerificationAttempt(attempt => attempt + 1)
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

  const waLink = (number: string, message?: string) =>
    `https://wa.me/${number.replace(/[^0-9]/g, "")}${message ? `?text=${encodeURIComponent(message)}` : ""}`

  if (isLoading) {
    return (
      <section className="py-6 sm:py-8">
        <div className="mb-6 space-y-2">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-64 max-w-full" />
        </div>
        <div className="mb-8 flex gap-2">
          {[1, 2, 3].map(i => <Skeleton key={i} className="h-11 w-24" />)}
        </div>
        <div className="grid gap-6 lg:grid-cols-[15rem_minmax(0,1fr)] lg:gap-10">
          <div className="space-y-4">
            <Skeleton className="h-11 w-full" />
            <Skeleton className="h-11 w-full" />
          </div>
          <div className="divide-y divide-border">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="space-y-3 py-5">
                <Skeleton className="h-6 w-48 max-w-full" />
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-11 w-36" />
              </div>
            ))}
          </div>
        </div>
      </section>
    )
  }

  if (submitted && submittedData) {
    return (
      <section className="flex min-h-[60vh] items-center justify-center py-12">
        <div className="w-full max-w-lg animate-fade-up rounded-xl bg-card p-5 sm:p-6 text-center ring-1 ring-foreground/10">
          <div className="mx-auto flex size-16 items-center justify-center rounded-full bg-success/15 ring-1 ring-success/30">
            <CheckCircle2 className="size-8 text-success" />
          </div>
          <h2 className="mt-5 font-heading text-2xl font-bold tracking-tight">
            Booking Request Sent!
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            {submittedData.vehicle} · {business?.name ?? "our team"} will confirm shortly.
          </p>

          <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2 text-left">
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
            Your booking request has been recorded for the rental team to review.
          </div>

          {business?.phone && (
            <Button
              className="mt-4 h-12 w-full gap-2 rounded-xl bg-success text-base font-semibold text-success-foreground  hover:bg-success/90"
              onClick={() => window.open(waLink(business.phone, `Hello, I submitted a rental request for ${submittedData.vehicle} from ${submittedData.start} to ${submittedData.end}.`), "_blank", "noopener,noreferrer")}
            >
              <MessageCircle className="size-5" />
              Message the rental team on WhatsApp
            </Button>
          )}

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
        <div className="w-full max-w-md animate-fade-up rounded-xl bg-card p-5 sm:p-6 text-center ring-1 ring-foreground/10">
          <div className="mx-auto flex size-16 items-center justify-center rounded-xl bg-primary/10 ring-1 ring-primary/20">
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
            onClick={() => window.open(waLink(business?.phone ?? ""), "_blank", "noopener,noreferrer")}
            disabled={!business?.phone}
          >
            <MessageCircle className="size-4" />
            Contact Us
          </Button>
        </div>
      </section>
    )
  }

  return (
    <section className="py-6 sm:py-8">
      <div className="mb-6">
        <h2 className="font-heading text-2xl font-bold tracking-tight sm:text-3xl">Find your next ride</h2>
        <p className="mt-2 text-sm text-muted-foreground">Compare the fleet and choose a vehicle for your trip.</p>
      </div>

      <VehicleBrowser vehicles={available} onSelect={setSelected} />

      <Sheet
        open={!!selectedVehicle}
        onOpenChange={(open) => !open && setSelected(null)}
      >
        <SheetContent
          side={isMobile ? "bottom" : "right"}
          className={cn(
            isMobile
              ? "rounded-t-xl p-0 data-[side=bottom]:max-h-[92dvh] data-[side=bottom]:overflow-y-auto"
              : "rounded-l-xl p-0 sm:max-w-lg!"
          )}
        >
          <SheetHeader className="gap-4 p-5">
            <div className="flex items-center gap-4 pr-10">
              <div className="flex size-14 shrink-0 items-center justify-center rounded-xl bg-primary/10 ring-1 ring-primary/20">
                <Car className="size-6 text-primary" />
              </div>
              <div className="min-w-0">
                <SheetTitle className="font-heading text-lg font-bold">
                  Request {selectedVehicle?.make} {selectedVehicle?.model}
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
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
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
                    min={startDate || undefined}
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                  />
                </div>
              </div>

              <Separator />
              <BookingVerification key={verificationAttempt} onToken={setTurnstileToken} />

              <Button
                type="submit"
                className="h-12 w-full gap-2 rounded-xl text-base font-semibold "
                disabled={createInquiry.isPending || !turnstileToken}
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
