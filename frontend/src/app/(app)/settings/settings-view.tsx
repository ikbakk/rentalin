"use client"

import { getAuth, clearAuth } from "@/lib/auth"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { User, Mail, Shield, Bell, LogOut, Building2, Clock } from "lucide-react"
import { cn } from "@/lib/utils"

export function SettingsView() {
  const auth = getAuth()
  const router = useRouter()

  return (
    <div className="flex flex-col gap-6 pb-20 lg:pb-6">
      <div className="px-4 py-4 lg:px-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>
          <p className="text-sm text-muted-foreground">
            Manage your account and business preferences
          </p>
        </div>
      </div>

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
                  {auth?.name?.charAt(0).toUpperCase() || "U"}
                </span>
              </div>
              <div>
                <p className="font-semibold">{auth?.name || "User"}</p>
                <Badge variant="secondary" className="mt-1 text-xs">
                  {auth?.role || "Staff"}
                </Badge>
              </div>
            </div>

            <Separator />

            <div className="space-y-3">
              <div className="grid gap-2">
                <Label htmlFor="name" className="text-xs text-muted-foreground">Full Name</Label>
                <Input id="name" defaultValue={auth?.name || ""} className="h-10 rounded-lg" />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="email" className="text-xs text-muted-foreground">Email</Label>
                <Input id="email" type="email" defaultValue={auth?.email || ""} className="h-10 rounded-lg" />
              </div>
            </div>

            <Button className="w-full">Save Changes</Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-xl bg-blue-500/10">
                <Building2 className="size-5 text-blue-500" />
              </div>
              <div>
                <CardTitle className="text-base">Business</CardTitle>
                <CardDescription className="text-xs">Company details and preferences</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="grid gap-2">
                <Label htmlFor="company" className="text-xs text-muted-foreground">Company Name</Label>
                <Input id="company" defaultValue="Rentalin" className="h-10 rounded-lg" />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="timezone" className="text-xs text-muted-foreground">Timezone</Label>
                <Input id="timezone" defaultValue="Asia/Jakarta ( WIB )" className="h-10 rounded-lg" />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="currency" className="text-xs text-muted-foreground">Default Currency</Label>
                <Input id="currency" defaultValue="IDR" className="h-10 rounded-lg" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-xl bg-amber-500/10">
                <Bell className="size-5 text-amber-500" />
              </div>
              <div>
                <CardTitle className="text-base">Notifications</CardTitle>
                <CardDescription className="text-xs">Configure how you receive alerts</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex flex-col gap-0.5">
                <span className="text-sm font-medium">Push Notifications</span>
                <span className="text-xs text-muted-foreground">Receive alerts on your device</span>
              </div>
              <Switch defaultChecked />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div className="flex flex-col gap-0.5">
                <span className="text-sm font-medium">Email Alerts</span>
                <span className="text-xs text-muted-foreground">Daily summary to your email</span>
              </div>
              <Switch />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div className="flex flex-col gap-0.5">
                <span className="text-sm font-medium">Late Return Alerts</span>
                <span className="text-xs text-muted-foreground">Notify when rentals are overdue</span>
              </div>
              <Switch defaultChecked />
            </div>
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
                clearAuth()
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
