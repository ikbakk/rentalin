"use client"

import { useState, useEffect } from "react"
import { useCustomerById, useUpdateCustomer } from "@/hooks/use-customer-by-id"
import { useRentals } from "@/hooks/use-reservations"
import { useInquiries } from "@/hooks/use-inquiries"
import { PageHeader } from "@/components/shared/page-header"
import { StatusChip } from "@/components/shared/status-chip"
import { EmptyState } from "@/components/shared/empty-state"
import { ListSkeleton } from "@/components/shared/loading-skeleton"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { ChevronLeft, Phone, Mail, MessageCircle, Calendar, Plus, Save, Car, User } from "lucide-react"
import Link from "next/link"
import { format } from "date-fns"

export default function CustomerDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const [id, setId] = useState<string | null>(null)
  const [resolvedParams, setResolvedParams] = useState<{ id: string } | null>(null)

  if (!resolvedParams && id === null) {
    params.then(p => {
      setId(p.id)
      setResolvedParams(p)
    })
    return (
      <div className="p-4 lg:p-6">
        <ListSkeleton count={3} />
      </div>
    )
  }

  const customerId = id || resolvedParams?.id || ""

  return <CustomerDetailContent customerId={customerId} />
}

function CustomerDetailContent({ customerId }: { customerId: string }) {
  const { data: customer, isLoading: customerLoading } = useCustomerById(customerId)
  const { data: rentals } = useRentals()
  const { data: inquiries } = useInquiries()
  const updateCustomer = useUpdateCustomer()

  const [notes, setNotes] = useState("")
  const [dialogOpen, setDialogOpen] = useState(false)

  useEffect(() => {
    if (customer?.notes) {
      setNotes(customer.notes)
    }
  }, [customer?.notes])

  const customerRentals = rentals?.filter(r => r.customerId === customerId) ?? []
  const activeRentals = customerRentals.filter(r => r.status === "Active")
  const pastRentals = customerRentals.filter(r => r.status === "Completed")
  const customerInquiries = inquiries?.filter(i => i.customerId === customerId) ?? []

  const totalSpent = pastRentals.reduce((sum, r) => {
    return sum + (r.estimatedCost || 0)
  }, 0)

  if (customerLoading) {
    return (
      <div className="p-4 lg:p-6">
        <div className="flex items-center gap-4 mb-6">
          <div className="h-8 w-8 animate-pulse rounded-lg bg-muted" />
          <div className="h-8 w-48 animate-pulse rounded-lg bg-muted" />
        </div>
        <ListSkeleton count={3} />
      </div>
    )
  }

  if (!customer) {
    return (
      <div className="p-4 lg:p-6">
        <EmptyState
          title="Customer not found"
          description="This customer may have been removed or does not exist."
        />
      </div>
    )
  }

  const handleSaveNotes = () => {
    updateCustomer.mutate({
      id: customerId,
      name: customer.name,
      phoneNumber: customer.phoneNumber,
      email: customer.email,
      notes,
    })
    setDialogOpen(false)
  }

  return (
    <div className="pb-20 lg:pb-6">
      <div className="border-b border-border px-4 py-4 lg:px-6">
        <Link
          href="/customers"
          className="mb-3 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ChevronLeft className="size-4" />
          Back to Customers
        </Link>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex size-12 items-center justify-center rounded-xl bg-primary/10">
              <User className="size-6 text-primary" />
            </div>
            <div>
              <h1 className="text-xl font-bold">{customer.name}</h1>
              <p className="text-sm text-muted-foreground">{customer.phoneNumber}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="px-4 py-4 lg:px-6 space-y-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Contact Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center gap-3">
              <Phone className="size-4 text-muted-foreground" />
              <span className="font-mono text-sm">{customer.phoneNumber}</span>
              <Button
                size="sm"
                variant="ghost"
                className="ml-auto gap-1 text-[#25D366]"
                onClick={() => window.open(`https://wa.me/${customer.phoneNumber.replace(/[^0-9]/g, "")}`, "_blank")}
              >
                <MessageCircle className="size-4" />
                WhatsApp
              </Button>
            </div>
            {customer.email && (
              <div className="flex items-center gap-3">
                <Mail className="size-4 text-muted-foreground" />
                <span className="text-sm">{customer.email}</span>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="grid grid-cols-3 gap-3">
          <Card>
            <CardContent className="p-3 text-center">
              <p className="text-2xl font-bold">{customerRentals.length}</p>
              <p className="text-xs text-muted-foreground">Total Rentals</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-3 text-center">
              <p className="text-2xl font-bold">{activeRentals.length}</p>
              <p className="text-xs text-muted-foreground">Active</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-3 text-center">
              <p className="text-2xl font-bold font-mono">
                {customerRentals.length > 0 ? "IDR" : "-"}
              </p>
              <p className="text-xs text-muted-foreground">Total Spent</p>
            </CardContent>
          </Card>
        </div>

        {activeRentals.length > 0 && (
          <Card className="border-emerald-500/30 bg-emerald-500/5">
            <CardHeader className="pb-2">
              <CardTitle className="text-base text-emerald-600 dark:text-emerald-400">Active Rentals</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {activeRentals.map(r => (
                <div key={r.id} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <Car className="size-4 text-muted-foreground" />
                    <span>{r.vehicleSummary}</span>
                  </div>
                  <StatusChip status={r.status} />
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {customerInquiries.length > 0 && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Active Inquiries</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {customerInquiries.slice(0, 3).map(i => (
                <div key={i.id} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <Calendar className="size-4 text-muted-foreground" />
                    <span>{i.vehicleSummary}</span>
                  </div>
                  <StatusChip status={i.status} />
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Past Rentals</CardTitle>
              {pastRentals.length > 0 && (
                <span className="text-xs text-muted-foreground">{pastRentals.length} total</span>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {pastRentals.length > 0 ? (
              <div className="space-y-2">
                {pastRentals.slice(0, 5).map(r => (
                  <div key={r.id} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <Car className="size-4 text-muted-foreground" />
                      <span>{r.vehicleSummary}</span>
                    </div>
                    <StatusChip status={r.status} />
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4">No rental history yet</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Internal Notes</CardTitle>
              <Button size="sm" variant="ghost" onClick={() => setDialogOpen(true)}>
                Edit
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground whitespace-pre-wrap">
              {customer.notes || "No notes yet"}
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="fixed bottom-20 right-4 lg:bottom-6">
        <Button size="lg" className="rounded-2xl shadow-lg gap-2">
          <Plus className="size-5" />
          New Inquiry
        </Button>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Notes</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add internal notes about this customer..."
              className="min-h-[120px]"
            />
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleSaveNotes} className="gap-2">
                <Save className="size-4" />
                Save Notes
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
