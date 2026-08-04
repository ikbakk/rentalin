"use client"

import { useParams, useRouter } from "next/navigation"
import { useInquiryById, useConfirmInquiry, useCancelInquiry } from "@/hooks/use-inquiries"
import { useCustomerById } from "@/hooks/use-customer-by-id"
import { EmptyState } from "@/components/shared/empty-state"
import { ListSkeleton } from "@/components/shared/loading-skeleton"
import { StatusChip } from "@/components/shared/status-chip"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { toast } from "sonner"
import { User, Car, Calendar, MessageSquare, ArrowLeft, Phone, CheckCircle, XCircle } from "lucide-react"
import Link from "next/link"
import { format } from "date-fns"

export default function ReviewInquiryPage() {
  const params = useParams()
  const router = useRouter()
  const id = params.id as string

  const { data: inquiry, isLoading } = useInquiryById(id)
  const { data: customer } = useCustomerById(inquiry?.customerId ?? "")
  const confirmInquiry = useConfirmInquiry()
  const cancelInquiry = useCancelInquiry()

  if (isLoading) {
    return (
      <div className="p-4 lg:p-6">
        <ListSkeleton count={3} />
      </div>
    )
  }

  if (!inquiry) {
    return (
      <div className="p-4 lg:p-6">
        <EmptyState
          title="Inquiry not found"
          description="This inquiry may have been cancelled or does not exist."
          action={{ label: "Back to Operations", onClick: () => router.push("/operations") }}
        />
      </div>
    )
  }

  const isPending = inquiry.status === "Pending"

  const handleConfirm = async () => {
    try {
      await confirmInquiry.mutateAsync(id)
      toast.success("Inquiry confirmed")
      router.push("/reservations")
    } catch {
      // Error toast already shown by the mutation's onError
    }
  }

  const handleCancel = async () => {
    try {
      await cancelInquiry.mutateAsync(id)
      toast.success("Inquiry cancelled")
      router.push("/operations")
    } catch {
      // Error toast already shown by the mutation's onError
    }
  }

  return (
    <div className="pb-20 lg:pb-6">
      <div className="border-b border-border px-4 py-4 lg:px-6">
        <Link
          href="/operations"
          className="mb-3 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="size-4" />
          Back to Operations
        </Link>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex size-12 items-center justify-center rounded-xl bg-primary/10">
              <User className="size-6 text-primary" />
            </div>
            <div>
              <h1 className="text-xl font-bold">{inquiry.customerName}</h1>
              <p className="text-sm text-muted-foreground">Review Inquiry</p>
            </div>
          </div>
          <StatusChip status={inquiry.status} />
        </div>
      </div>

      <div className="grid gap-4 p-4 lg:grid-cols-2 lg:px-6">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Inquiry Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center gap-2">
              <User className="size-4 text-muted-foreground shrink-0" />
              <div className="flex justify-between flex-1 text-sm">
                <span className="text-muted-foreground">Customer</span>
                <span className="font-medium">{inquiry.customerName}</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Phone className="size-4 text-muted-foreground shrink-0" />
              <div className="flex justify-between flex-1 text-sm">
                <span className="text-muted-foreground">Phone</span>
                <span className="font-medium">{customer?.phoneNumber || "—"}</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Car className="size-4 text-muted-foreground shrink-0" />
              <div className="flex justify-between flex-1 text-sm">
                <span className="text-muted-foreground">Vehicle</span>
                <span className="font-medium">{inquiry.vehicleSummary}</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="size-4 text-muted-foreground shrink-0" />
              <div className="flex justify-between flex-1 text-sm">
                <span className="text-muted-foreground">Rental Period</span>
                <span className="font-medium">
                  {format(new Date(inquiry.startDate), "MMM d, yyyy")}
                  {" – "}
                  {format(new Date(inquiry.endDate), "MMM d, yyyy")}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {inquiry.notes && (
          <>
            <Card className="lg:col-span-2">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <MessageSquare className="size-4 text-muted-foreground" />
                  Notes
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">{inquiry.notes}</p>
              </CardContent>
            </Card>
            <Separator className="lg:col-span-2" />
          </>
        )}

        <Card className="lg:col-span-2">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Actions</CardTitle>
          </CardHeader>
          <CardContent>
            {isPending ? (
              <div className="flex flex-col gap-3 sm:flex-row">
                <Button
                  size="lg"
                  className="flex-1 gap-2"
                  onClick={handleConfirm}
                  disabled={confirmInquiry.isPending}
                >
                  <CheckCircle className="size-4" />
                  {confirmInquiry.isPending ? "Confirming..." : "Confirm"}
                </Button>
                <Button
                  variant="outline"
                  size="lg"
                  className="flex-1 gap-2"
                  onClick={handleCancel}
                  disabled={cancelInquiry.isPending}
                >
                  <XCircle className="size-4" />
                  {cancelInquiry.isPending ? "Cancelling..." : "Cancel Inquiry"}
                </Button>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                This inquiry is <span className="font-medium">{inquiry.status}</span>. No actions available.
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
