"use client"

import { useState } from "react"
import { useQuery } from "convex/react"
import { api } from "../../../../../convex/_generated/api"
import { useAuthActions } from "@convex-dev/auth/react"
import { useActiveBusiness, useBusinesses } from "@/hooks/use-active-business"
import { useRouter } from "next/navigation"
import { useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { User, Bell, LogOut, Building2, Loader2, Link2, Copy } from "lucide-react"
import { useBusiness } from "@/hooks/use-business"
import { useUpdateBusiness } from "@/hooks/use-update-business"
import type { BusinessResponse, UpdateBusinessRequest } from "@/lib/types"
import { FinanceExport, InvitationAccess, OwnerStaffAdministration } from "./staff-tools"
import { BUSINESS_TIME_ZONES } from "@/lib/business-time"

const frontendOrigin = process.env.NEXT_PUBLIC_FRONTEND_URL || "http://localhost:3000"

type BusinessValues = Pick<UpdateBusinessRequest, "name" | "address" | "phoneNumber" | "email" | "timeZone">

function BusinessForm({
  business,
  isPending,
  onSave,
}: {
  business: BusinessResponse
  isPending: boolean
  onSave: (values: BusinessValues) => void
}) {
  // Keyed by business.id in the parent — initializes once when data first arrives,
  // never clobbers in-progress edits on refetch.
  const [name, setName] = useState(business.name)
  const [address, setAddress] = useState(business.address)
  const [phoneNumber, setPhoneNumber] = useState(business.phoneNumber)
  const [email, setEmail] = useState(business.email)
  const [timeZone, setTimeZone] = useState(business.timeZone)

  const bookingUrl = `${frontendOrigin}/r/${business.slug}`

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(bookingUrl)
      toast.success("Link copied")
    } catch {
      toast.error("Failed to copy link")
    }
  }

  return (
    <CardContent className="space-y-4">
      <div className="space-y-3">
        <div className="grid gap-2">
          <Label htmlFor="business-name" className="text-xs text-muted-foreground">Business Name</Label>
          <Input
            id="business-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="h-10 rounded-lg"
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="business-address" className="text-xs text-muted-foreground">Address</Label>
          <Input
            id="business-address"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            className="h-10 rounded-lg"
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="business-phone" className="text-xs text-muted-foreground">Phone</Label>
          <Input
            id="business-phone"
            type="tel"
            value={phoneNumber}
            onChange={(e) => setPhoneNumber(e.target.value)}
            className="h-10 rounded-lg"
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="business-email" className="text-xs text-muted-foreground">Email</Label>
          <Input
            id="business-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="h-10 rounded-lg"
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="business-time-zone" className="text-xs text-muted-foreground">Business Time Zone</Label>
          <Select value={timeZone} onValueChange={(value) => { if (value) setTimeZone(value) }}>
            <SelectTrigger id="business-time-zone" className="h-10 rounded-lg">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {BUSINESS_TIME_ZONES.map((zone) => (
                <SelectItem key={zone.value} value={zone.value}>{zone.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="rounded-lg border bg-muted/40 p-3">
        <div className="mb-2 flex items-center gap-1.5">
          <Link2 className="size-3.5 text-muted-foreground" />
          <span className="text-xs font-medium text-muted-foreground">Public Booking Link</span>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="min-w-0 flex-1 justify-start font-mono text-xs">
            <span className="truncate">{bookingUrl}</span>
          </Badge>
          <Button
            type="button"
            variant="outline"
            size="icon"
            aria-label="Copy booking link"
            onClick={copyLink}
          >
            <Copy className="size-4" />
          </Button>
        </div>
        <p className="mt-2 text-xs text-muted-foreground">
          Generated from business name. Edit the name to change this link.
        </p>
      </div>

      <Button className="w-full" onClick={() => onSave({ name, address, phoneNumber, email, timeZone })} disabled={isPending}>
        {isPending && <Loader2 className="size-4 animate-spin" />}
        Save Changes
      </Button>
    </CardContent>
  )
}

export function SettingsView() {
  const router = useRouter()
  const { signOut } = useAuthActions()
  const { businessId } = useActiveBusiness()
  const businesses = useBusinesses()
  const currentUser = useQuery(api.tenancy.currentUser, {})
  const businessRole = businesses?.find((item) => item._id === businessId)?.role
  const { data: business, isLoading } = useBusiness()
  const updateBusiness = useUpdateBusiness()
  const queryClient = useQueryClient()

  const handleSave = async (values: BusinessValues) => {
    try {
      if (!businessId) throw new Error("No active business")
      await updateBusiness.mutateAsync({ id: businessId, ...values })
      toast.success("Business updated")
      queryClient.invalidateQueries({ queryKey: ["business", businessId] })
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to update business")
    }
  }

  return (
    <div className="flex flex-col gap-6 pb-20 lg:pb-6">
      <div className="flex flex-col gap-4 px-4 lg:px-6 lg:max-w-2xl">
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10">
                <User className="size-5 text-primary" />
              </div>
              <div>
                <CardTitle className="text-base">Profile</CardTitle>
                <CardDescription className="text-xs">Your personal information</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="flex size-14 items-center justify-center rounded-full bg-primary/10">
                <span className="text-xl font-semibold text-primary">
                  {(currentUser?.name || currentUser?.email || "U").charAt(0).toUpperCase()}
                </span>
              </div>
              <div>
                <p className="font-semibold">{currentUser?.name || currentUser?.email || "Rentalin user"}</p>
                <Badge variant="secondary" className="mt-1 text-xs">
                  {businessRole ? businessRole.charAt(0).toUpperCase() + businessRole.slice(1) : "No business"}
                </Badge>
              </div>
            </div>

            <Separator />

            <div className="space-y-3">
              <div className="grid gap-2">
                <Label htmlFor="name" className="text-xs text-muted-foreground">Full Name</Label>
                <Input id="name" value={currentUser?.name ?? ""} readOnly className="h-10 rounded-lg" />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="email" className="text-xs text-muted-foreground">Email</Label>
                <Input id="email" type="email" value={currentUser?.email ?? ""} readOnly className="h-10 rounded-lg" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-xl bg-blue-500/10">
                <Building2 className="size-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <CardTitle className="text-base">Business</CardTitle>
                <CardDescription className="text-xs">Company details and booking link</CardDescription>
              </div>
            </div>
          </CardHeader>
          {isLoading ? (
            <CardContent className="space-y-4">
              <Skeleton className="h-10 w-full rounded-lg" />
              <Skeleton className="h-10 w-full rounded-lg" />
              <Skeleton className="h-10 w-full rounded-lg" />
              <Skeleton className="h-10 w-full rounded-lg" />
              <Skeleton className="h-10 w-full rounded-lg" />
            </CardContent>
          ) : !business ? (
            <CardContent>
              <p className="text-sm text-muted-foreground">Unable to load business details.</p>
            </CardContent>
          ) : businessRole !== "owner" ? (
            <CardContent>
              <p className="text-sm text-muted-foreground">Business settings are managed by the business owner.</p>
            </CardContent>
          ) : (
            <BusinessForm
              key={business.id}
              business={business}
              isPending={updateBusiness.isPending}
              onSave={handleSave}
            />
          )}
        </Card>

        <InvitationAccess />
        {businessId && businessRole === "owner" && <OwnerStaffAdministration businessId={businessId} />}
        {businessId && (businessRole === "owner" || businessRole === "admin") && <FinanceExport businessId={businessId} />}

        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-xl bg-amber-500/10">
                <Bell className="size-5 text-amber-600 dark:text-amber-400" />
              </div>
              <div>
                <CardTitle className="text-base">Notifications</CardTitle>
                <CardDescription className="text-xs">Notification preferences</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">Automated alerts are not configured yet. Rentalin will not send email or push notifications.</p>
          </CardContent>
        </Card>

        <Card className="border-destructive/30">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-xl bg-destructive/10">
                <LogOut className="size-5 text-destructive" />
              </div>
              <div>
                <CardTitle className="text-base text-destructive">Danger Zone</CardTitle>
                <CardDescription className="text-xs">Irreversible actions</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Button
              variant="destructive"
              className="w-full"
              onClick={() => {
                void signOut()
                router.push("/login")
              }}
            >
              <LogOut className="size-4 mr-2" />
              Sign Out
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
