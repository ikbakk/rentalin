"use client"

import { useState } from "react"
import { useMutation, useQuery } from "convex/react"
import { api } from "../../../../../../../convex/_generated/api"
import type { Id } from "../../../../../../../convex/_generated/dataModel"
import { useActiveBusiness, useBusinesses } from "@/hooks/use-active-business"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "sonner"

export function ReservationFinancePanel({ reservationId }: { reservationId: string }) {
  const { businessId } = useActiveBusiness()
  const businesses = useBusinesses()
  const role = businesses?.find((business) => business._id === businessId)?.role
  const canManage = role === "owner" || role === "admin"
  const id = reservationId as Id<"reservations">
  const summary = useQuery(api.finance.summaryByReservation, { reservationId: id })
  const entries = useQuery(api.finance.listByReservation, canManage ? { reservationId: id } : "skip")
  const addPayment = useMutation(api.finance.add)
  const [kind, setKind] = useState<"payment" | "deposit" | "refund">("payment")
  const [method, setMethod] = useState<"cash" | "bank_transfer" | "other">("cash")
  const [amount, setAmount] = useState("")
  const [reference, setReference] = useState("")
  const [note, setNote] = useState("")
  const [requestKey, setRequestKey] = useState<string | null>(null)
  const [isPending, setIsPending] = useState(false)

  const submit = async () => {
    const numericAmount = Number(amount)
    if (!Number.isSafeInteger(numericAmount) || numericAmount <= 0) {
      toast.error("Enter a positive whole IDR amount")
      return
    }
    const retryKey = requestKey ?? crypto.randomUUID()
    setRequestKey(retryKey)
    setIsPending(true)
    try {
      await addPayment({ reservationId: id, kind, amount: numericAmount, method, reference: reference || undefined, note: note || undefined, requestKey: retryKey })
      setAmount("")
      setReference("")
      setNote("")
      setRequestKey(null)
      toast.success(kind === "refund" ? "Refund recorded" : "Payment recorded")
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Payment entry could not be saved")
    } finally {
      setIsPending(false)
    }
  }

  if (!summary) return null

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Payment record</CardTitle>
        <CardDescription>Manual IDR records. Deposits count toward the estimate. Entries are permanent; fix mistakes with a refund and a corrected entry.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-3 gap-3 text-sm">
          <div><p className="text-muted-foreground">Estimate</p><p className="font-medium">IDR {summary.estimatedCost.toLocaleString()}</p></div>
          <div><p className="text-muted-foreground">Received</p><p className="font-medium">IDR {summary.received.toLocaleString()}</p></div>
          <div><p className="text-muted-foreground">Outstanding</p><p className="font-medium">IDR {summary.outstanding.toLocaleString()}</p></div>
        </div>
        {canManage ? (
          <>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="grid gap-2">
                <Label>Entry type</Label>
                <Select value={kind} onValueChange={(value) => { if (value === "payment" || value === "deposit" || value === "refund") setKind(value) }}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="payment">Payment</SelectItem><SelectItem value="deposit">Deposit</SelectItem><SelectItem value="refund">Refund</SelectItem></SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label>Method</Label>
                <Select value={method} onValueChange={(value) => { if (value === "cash" || value === "bank_transfer" || value === "other") setMethod(value) }}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="cash">Cash</SelectItem><SelectItem value="bank_transfer">Bank transfer</SelectItem><SelectItem value="other">Other</SelectItem></SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="payment-amount">Amount (IDR)</Label>
                <Input id="payment-amount" type="number" min={1} step={1} inputMode="numeric" value={amount} onChange={(event) => setAmount(event.target.value)} />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="payment-reference">Reference</Label>
                <Input id="payment-reference" value={reference} maxLength={120} onChange={(event) => setReference(event.target.value)} placeholder="Optional receipt or bank reference" />
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="payment-note">Note</Label>
              <Input id="payment-note" value={note} maxLength={500} onChange={(event) => setNote(event.target.value)} />
            </div>
            <Button type="button" onClick={() => void submit()} disabled={isPending}>{isPending ? "Saving..." : `Record ${kind}`}</Button>
            {entries && entries.length > 0 && (
              <div className="space-y-2 border-t pt-4">
                <h3 className="text-sm font-medium">Payment history</h3>
                {entries.map((entry) => (
                  <div key={entry._id} className="flex justify-between gap-3 text-sm">
                    <span className="capitalize text-muted-foreground">{entry.kind.replace("_", " ")} · {new Date(entry.recordedAt).toLocaleString()}</span>
                    <span className="font-mono">{entry.kind === "refund" ? "−" : "+"} IDR {entry.amount.toLocaleString()}</span>
                  </div>
                ))}
              </div>
            )}
          </>
        ) : (
          <p className="text-xs text-muted-foreground">Only the business owner and admin can manage payment records.</p>
        )}
      </CardContent>
    </Card>
  )
}
