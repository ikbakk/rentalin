"use client"

import { useState } from "react"
import { useMutation, useQuery } from "convex/react"
import { api } from "../../../../../convex/_generated/api"
import type { Id } from "../../../../../convex/_generated/dataModel"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "sonner"

export function InvitationAccess() {
  const [token, setToken] = useState("")
  const [isPending, setIsPending] = useState(false)
  const accept = useMutation(api.staff.acceptInvitation)

  const submit = async () => {
    setIsPending(true)
    try {
      await accept({ token: token.trim() })
      setToken("")
      toast.success("You joined the business")
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Invitation could not be accepted")
    } finally {
      setIsPending(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Join a business</CardTitle>
        <CardDescription>Enter the single-use invitation code shared with you by the business owner.</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-3 sm:flex-row">
        <Input
          value={token}
          onChange={(event) => setToken(event.target.value)}
          aria-label="Invitation code"
          autoComplete="off"
          onKeyDown={(event) => { if (event.key === "Enter" && token.trim().length >= 32 && !isPending) void submit() }}
        />
        <Button type="button" onClick={() => void submit()} disabled={token.trim().length < 32 || isPending}>
          {isPending ? "Joining..." : "Accept invitation"}
        </Button>
      </CardContent>
    </Card>
  )
}

export function OwnerStaffAdministration({ businessId }: { businessId: Id<"businesses"> }) {
  const [email, setEmail] = useState("")
  const [role, setRole] = useState<"admin" | "staff">("staff")
  const [inviteToken, setInviteToken] = useState("")
  const currentUser = useQuery(api.tenancy.currentUser, {})
  const members = useQuery(api.staff.list, { businessId })
  const createInvite = useMutation(api.staff.createInvitation)
  const deactivate = useMutation(api.staff.deactivateMembership)

  const invite = async () => {
    try {
      const result = await createInvite({ businessId, email, role })
      setInviteToken(result.token)
      toast.success("Invitation created. Share the code directly with the invited person.")
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Invitation could not be created")
    }
  }

  const copyToken = async () => {
    try {
      await navigator.clipboard.writeText(inviteToken)
      toast.success("Invitation code copied")
    } catch {
      toast.error("Could not copy invitation code")
    }
  }

  const removeMember = async (membershipId: Id<"memberships">) => {
    try {
      await deactivate({ membershipId })
      toast.success("Member access removed")
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Member access could not be removed")
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Staff access</CardTitle>
        <CardDescription>Invite access expires in 24 hours and can be used once. Rentalin does not send the invitation for you.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="grid gap-3 sm:grid-cols-[1fr_9rem_auto] sm:items-end">
          <div className="grid gap-2">
            <Label htmlFor="invite-email">Email address</Label>
            <Input id="invite-email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="invite-role">Role</Label>
            <Select value={role} onValueChange={(value) => { if (value === "admin" || value === "staff") setRole(value) }}>
              <SelectTrigger id="invite-role"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="staff">Staff</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button type="button" onClick={() => void invite()} disabled={!email.trim()}>Create invitation</Button>
        </div>
        {inviteToken && (
          <div className="space-y-2 rounded-lg border bg-muted/40 p-3">
            <Label htmlFor="invite-token">Share this one-time code with {email}</Label>
            <div className="flex gap-2">
              <Input id="invite-token" readOnly value={inviteToken} className="font-mono text-xs" />
              <Button type="button" variant="outline" onClick={() => void copyToken()}>Copy</Button>
            </div>
          </div>
        )}
        <div className="space-y-2">
          <h3 className="text-sm font-medium">Current members</h3>
          {members?.map((member) => (
            <div key={member.membershipId} className="flex items-center justify-between gap-3 rounded-lg border p-3">
              <div className="min-w-0">
                <p className="truncate text-sm font-medium">{member.name || member.email || "Rentalin user"}</p>
                <p className="truncate text-xs text-muted-foreground">{member.email} · {member.role}{member.isActive ? "" : " · Inactive"}</p>
              </div>
              {member.isActive && member.userId !== currentUser?.id && (
                <Button type="button" size="sm" variant="outline" onClick={() => void removeMember(member.membershipId)}>Remove access</Button>
              )}
            </div>
          ))}
          {members?.length === 0 && <p className="text-sm text-muted-foreground">No business members found.</p>}
        </div>
      </CardContent>
    </Card>
  )
}

export function FinanceExport({ businessId }: { businessId: Id<"businesses"> }) {
  const exported = useQuery(api.finance.exportCsv, { businessId })
  const download = () => {
    if (!exported) return
    const blob = new Blob([exported.csv], { type: "text/csv;charset=utf-8" })
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement("a")
    anchor.href = url
    anchor.download = "rentalin-payment-ledger.csv"
    anchor.click()
    URL.revokeObjectURL(url)
    if (exported.truncated) toast.warning("Export contains the first 5,000 entries. Contact your admin before exporting older ledger history.")
    else toast.success(`Downloaded ${exported.rowCount} payment records`)
  }
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Payment export</CardTitle>
        <CardDescription>Download the tenant-scoped manual payment ledger as CSV.</CardDescription>
      </CardHeader>
      <CardContent>
        <Button type="button" variant="outline" onClick={download} disabled={!exported}>Download payment CSV</Button>
      </CardContent>
    </Card>
  )
}
