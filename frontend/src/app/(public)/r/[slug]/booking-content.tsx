"use client"

import { useState, useMemo, useEffect } from "react"
import { useVehicles } from "@/hooks/use-vehicles"
import { useCreateInquiry } from "@/hooks/use-inquiries"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet"
import { Separator } from "@/components/ui/separator"
import { toast } from "sonner"
import { Car, Users, CheckCircle2, MessageCircle, Calendar, ArrowRight, Star, Shield, Clock } from "lucide-react"
import { cn } from "@/lib/utils"

export function BookingContent() {
  const { data: vehicles, isLoading } = useVehicles()
  const createInquiry = useCreateInquiry()
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 1024)
    checkMobile()
    window.addEventListener("resize", checkMobile)
    return () => window.removeEventListener("resize", checkMobile)
  }, [])

  const available = useMemo(
    () => vehicles?.filter((v) => v.status === "Available") ?? [],
    [vehicles]
  )

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

  if (isLoading) {
    return (
      <div className="px-6 py-8">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-48 animate-pulse rounded-2xl bg-muted" />
          ))}
        </div>
      </div>
    )
  }

  if (submitted && submittedData) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center px-6 py-12">
        <Card className="w-full max-w-lg animate-fade-up">
          <CardContent className="p-6">
            <div className="flex flex-col items-center text-center">
              <div className="flex size-16 items-center justify-center rounded-full bg-success/10">
                <CheckCircle2 className="size-8 text-success" />
              </div>
              <h2 className="mt-4 font-mono text-2xl font-bold">Inquiry Sent!</h2>
              <p className="mt-1 font-mono text-sm text-muted-foreground">
                {submittedData.vehicle}
              </p>
            </div>

            <div className="mt-6 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-lg bg-muted/50 p-3">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                    <Calendar className="size-3.5" />
                    Period
                  </div>
                  <p className="font-mono text-sm font-medium">{submittedData.start}</p>
                  <p className="text-xs text-muted-foreground">to {submittedData.end}</p>
                </div>
                <div className="rounded-lg bg-muted/50 p-3">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                    <Users className="size-3.5" />
                    Contact
                  </div>
                  <p className="font-medium">{submittedData.name}</p>
                  <p className="font-mono text-xs text-muted-foreground">{submittedData.phone}</p>
                </div>
              </div>

              <div className="flex items-center gap-3 rounded-lg bg-[#25D366]/10 p-3 text-[#25D366]">
                <MessageCircle className="size-5" />
                <span className="text-sm font-medium">We&apos;ll contact you via WhatsApp</span>
              </div>

              <Button
                className="h-12 w-full gap-2 rounded-xl bg-[#25D366] text-base font-semibold text-white hover:bg-[#25D366]/90"
                onClick={() =>
                  window.open(
                    `https://wa.me/${submittedData.phone.replace(/[^0-9]/g, "")}`,
                    "_blank"
                  )
                }
              >
                <MessageCircle className="size-5" />
                Continue on WhatsApp
              </Button>

              <Button
                variant="outline"
                className="h-11 w-full rounded-xl"
                onClick={() => {
                  setSubmitted(false)
                  setSelected(null)
                  setName("")
                  setPhone("")
                  setStartDate("")
                  setEndDate("")
                }}
              >
                Book Another Vehicle
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (available.length === 0) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center px-6 py-12">
        <Card className="w-full max-w-md animate-fade-up">
          <CardContent className="flex flex-col items-center justify-center p-8 text-center">
            <div className="mx-auto flex size-16 items-center justify-center rounded-2xl bg-muted">
              <Car className="size-8 text-muted-foreground" />
            </div>
            <h2 className="mt-4 font-semibold text-lg">No Vehicles Available</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Please check back later or contact us directly.
            </p>
            <Button
              className="mt-6 gap-2 bg-[#25D366] hover:bg-[#25D366]/90"
              onClick={() => window.open("https://wa.me/", "_blank")}
            >
              <MessageCircle className="size-4" />
              Contact Us
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="px-2 pb-8 lg:px-4 lg:pb-12">
      <div className="flex items-center gap-4 mb-6">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Shield className="size-4 text-primary" />
          <span>Secure booking</span>
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Clock className="size-4 text-primary" />
          <span>24/7 Support</span>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:gap-6">
        {available.map((v, index) => {
          const isSelected = selected === v.id

          return (
            <div
              key={v.id}
              className={cn(
                "group cursor-pointer animate-fade-up",
                `stagger-${(index % 6) + 1}`
              )}
              style={{ animationDelay: `${index * 50}ms` }}
              onClick={() => setSelected(v.id)}
            >
              <Card
                className={cn(
                  "overflow-hidden transition-all duration-200",
                  isSelected
                    ? "ring-2 ring-primary"
                    : "hover:shadow-md"
                )}
              >
                <CardContent className="p-5">
                  <div className="flex items-start gap-4">
                    <div className="flex size-16 shrink-0 items-center justify-center rounded-2xl bg-muted">
                      <Car className="size-8 text-muted-foreground" />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="font-mono text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                            {v.licensePlate}
                          </p>
                          <h3 className="mt-0.5 text-lg font-bold leading-tight">
                            {v.make} {v.model}
                          </h3>
                        </div>
                        <div className="text-right shrink-0">
                          <p className="font-mono text-xl font-bold text-primary">
                            {v.dailyRateCurrency} {v.dailyRateAmount.toLocaleString()}
                          </p>
                          <p className="text-xs text-muted-foreground">per day</p>
                        </div>
                      </div>

                      <div className="mt-3 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                            <Users className="size-3.5" />
                            {v.seatingCapacity}
                          </span>
                          <span className="text-xs text-muted-foreground">·</span>
                          <span className="text-xs text-muted-foreground">{v.year}</span>
                          <span className="text-xs text-muted-foreground">·</span>
                          <span className="text-xs text-muted-foreground">{v.color}</span>
                        </div>
                        <Badge
                          variant={isSelected ? "default" : "outline"}
                          className={cn(
                            "gap-1 transition-all",
                            isSelected ? "px-3" : "px-2"
                          )}
                        >
                          {isSelected ? (
                            <>
                              <CheckCircle2 className="size-3" />
                              Selected
                            </>
                          ) : (
                            <>
                              Select
                              <ArrowRight className="size-3" />
                            </>
                          )}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )
        })}
      </div>

      <Sheet open={!!selectedVehicle} onOpenChange={(open) => !open && setSelected(null)}>
        <SheetContent side={isMobile ? "bottom" : "right"} className={cn(isMobile ? "rounded-t-2xl p-4" : "rounded-none rounded-l-2xl max-w-lg p-4")}>
          <SheetHeader>
            <div className="flex items-center gap-3">
              <div className="flex size-12 items-center justify-center rounded-xl bg-muted">
                <Car className="size-5 text-foreground" />
              </div>
              <div>
                <SheetTitle>Book {selectedVehicle?.licensePlate}</SheetTitle>
                <SheetDescription>
                  {selectedVehicle?.make} {selectedVehicle?.model}
                </SheetDescription>
              </div>
            </div>
          </SheetHeader>

          <CardContent className="p-0 mt-6">
            <div className="mb-4 flex items-center justify-between rounded-lg bg-muted/50 p-3">
              <div className="flex items-center gap-2">
                <Star className="size-4 text-amber-500" />
                <span className="text-sm font-medium">Daily rate</span>
              </div>
              <p className="font-mono text-lg font-bold text-primary">
                {selectedVehicle?.dailyRateCurrency} {selectedVehicle?.dailyRateAmount.toLocaleString()}
                <span className="text-xs font-normal text-muted-foreground">/day</span>
              </p>
            </div>

            <form onSubmit={(e) => { e.preventDefault(); submit() }} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="book-name" className="text-xs font-medium">Full Name</Label>
                <Input
                  id="book-name"
                  className="h-11 rounded-lg"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Enter your full name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="book-phone" className="text-xs font-medium">WhatsApp Number</Label>
                <Input
                  id="book-phone"
                  className="h-11 rounded-lg"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+62 812 xxxx xxxx"
                  type="tel"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="book-start" className="text-xs font-medium">Pickup Date</Label>
                  <Input
                    id="book-start"
                    className="h-11 rounded-lg"
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="book-end" className="text-xs font-medium">Return Date</Label>
                  <Input
                    id="book-end"
                    className="h-11 rounded-lg"
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                  />
                </div>
              </div>

              <Separator />

              <Button
                type="submit"
                className="h-12 w-full gap-2 rounded-xl text-base font-semibold"
                disabled={createInquiry.isPending}
              >
                {createInquiry.isPending ? (
                  <span className="flex items-center gap-2">
                    <svg className="size-4 animate-spin" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Sending...
                  </span>
                ) : (
                  <>
                    <MessageCircle className="size-5" />
                    Send Inquiry via WhatsApp
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </SheetContent>
      </Sheet>
    </div>
  )
}
