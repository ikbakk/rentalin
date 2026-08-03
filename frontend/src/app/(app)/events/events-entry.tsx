import type { TimelineEntryResponse } from "@/lib/types"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  MessageSquare, CheckCircle2, XCircle, Calendar, Wrench,
  Key, Handshake, Car, Search, UserPlus, ClipboardCheck
} from "lucide-react"
import { cn } from "@/lib/utils"

const iconMap: Record<string, { icon: typeof MessageSquare; bg: string; color: string }> = {
  InquiryCreated: { icon: MessageSquare, bg: "bg-amber-500/10", color: "text-amber-500" },
  InquiryConfirmed: { icon: CheckCircle2, bg: "bg-emerald-500/10", color: "text-emerald-500" },
  InquiryCancelled: { icon: XCircle, bg: "bg-destructive/10", color: "text-destructive" },
  ReservationCreated: { icon: Calendar, bg: "bg-blue-500/10", color: "text-blue-500" },
  PreparationStarted: { icon: Wrench, bg: "bg-orange-500/10", color: "text-orange-500" },
  ReadyForHandover: { icon: Key, bg: "bg-purple-500/10", color: "text-purple-500" },
  HandoverCompleted: { icon: Handshake, bg: "bg-emerald-500/10", color: "text-emerald-500" },
  RentalStarted: { icon: Car, bg: "bg-blue-500/10", color: "text-blue-500" },
  RentalCompleted: { icon: CheckCircle2, bg: "bg-emerald-500/10", color: "text-emerald-500" },
  InspectionCreated: { icon: Search, bg: "bg-amber-500/10", color: "text-amber-500" },
  InspectionCompleted: { icon: ClipboardCheck, bg: "bg-emerald-500/10", color: "text-emerald-500" },
  VehicleCreated: { icon: Car, bg: "bg-primary/10", color: "text-primary" },
  CustomerCreated: { icon: UserPlus, bg: "bg-blue-500/10", color: "text-blue-500" },
}

const typeColors: Record<string, string> = {
  Created: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
  Confirmed: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  Completed: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  Cancelled: "bg-destructive/10 text-destructive",
  Started: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
  Pending: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
}

export function EventsEntry({ entry }: { entry: TimelineEntryResponse }) {
  const config = iconMap[entry.eventType] || { icon: MessageSquare, bg: "bg-muted", color: "text-muted-foreground" }
  const Icon = config.icon

  const getColorClass = (eventType: string) => {
    for (const [key, value] of Object.entries(typeColors)) {
      if (eventType.includes(key)) return value
    }
    return "bg-muted text-muted-foreground"
  }

  return (
    <div className="relative pl-0 lg:pl-0">
      <div className={cn(
        "absolute left-4 top-4 flex size-8 items-center justify-center rounded-full lg:left-6",
        config.bg
      )}>
        <Icon className={cn("size-4", config.color)} />
      </div>

      <Card className="ml-12 mr-0 transition-all hover:shadow-sm lg:ml-20">
        <CardContent className="flex items-start justify-between gap-3 p-3">
          <div className="flex flex-col gap-1 min-w-0 flex-1">
            <p className="text-sm leading-snug">{entry.description}</p>
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className={cn("text-[10px] font-medium", getColorClass(entry.eventType))}>
                {entry.eventType}
              </Badge>
              <span className="font-mono text-[11px] text-muted-foreground">
                {new Date(entry.occurredAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
              </span>
              {entry.actor && entry.actor !== "System" && (
                <span className="text-[11px] text-muted-foreground">
                  · {entry.actor}
                </span>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
