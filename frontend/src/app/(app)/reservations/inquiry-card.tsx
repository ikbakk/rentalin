import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Calendar, User, MessageSquare, ArrowRight, Clock } from "lucide-react"
import { cn } from "@/lib/utils"
import { statusColor } from "@/lib/status-config"
import type { InquiryResponse } from "@/lib/types"

export function InquiryCard({ inquiry, onConfirm }: { inquiry: InquiryResponse; onConfirm: () => void }) {
  const startDate = new Date(inquiry.startDate)
  const endDate = new Date(inquiry.endDate)
  const days = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))

  return (
    <Card className="transition-all hover:shadow-md">
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <div className="flex size-8 items-center justify-center rounded-lg bg-primary/10">
                <User className="size-4 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold">{inquiry.customerName}</h3>
                <p className="text-xs text-muted-foreground">{inquiry.vehicleSummary}</p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
              <div className="flex items-center gap-1.5">
                <Calendar className="size-3.5" />
                <span>{startDate.toLocaleDateString()} — {endDate.toLocaleDateString()}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Clock className="size-3.5" />
                <span>{days} day{days !== 1 ? "s" : ""}</span>
              </div>
            </div>

            {inquiry.notes && (
              <div className="mt-2 flex items-start gap-1.5 rounded-lg bg-muted/50 p-2">
                <MessageSquare className="size-3.5 mt-0.5 shrink-0 text-muted-foreground" />
                <p className="text-xs text-muted-foreground">{inquiry.notes}</p>
              </div>
            )}
          </div>

          <div className="flex flex-col items-end gap-2">
            <Badge variant="outline" className={cn("font-medium", statusColor(inquiry.status))}>
              {inquiry.status}
            </Badge>
            {inquiry.status === "New" && (
              <Button size="sm" onClick={onConfirm} className="gap-1.5">
                Confirm
                <ArrowRight className="size-3" />
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
