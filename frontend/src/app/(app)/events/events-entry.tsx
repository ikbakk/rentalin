"use client"

import type { TimelineEntryResponse } from "@/lib/types"
import { useRouter } from "next/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  MessageSquare, CheckCircle2, XCircle, Calendar, Wrench,
  Key, Clock, Car, Search, ClipboardCheck
} from "lucide-react"
import { cn } from "@/lib/utils"
import { statusColor } from "@/lib/status-config"

const iconMap: Record<string, { icon: typeof MessageSquare; bg: string; color: string }> = {
  InquiryCreated: { icon: MessageSquare, bg: "bg-amber-500/10", color: "text-amber-600 dark:text-amber-400" },
  InquiryConfirmed: { icon: CheckCircle2, bg: "bg-emerald-500/10", color: "text-emerald-600 dark:text-emerald-400" },
  InquiryCancelled: { icon: XCircle, bg: "bg-destructive/10", color: "text-destructive" },
  ReservationCreated: { icon: Calendar, bg: "bg-blue-500/10", color: "text-blue-600 dark:text-blue-400" },
  ReservationCancelled: { icon: XCircle, bg: "bg-destructive/10", color: "text-destructive" },
  PreparationStarted: { icon: Wrench, bg: "bg-orange-500/10", color: "text-orange-600 dark:text-orange-400" },
  ReadyForHandover: { icon: Key, bg: "bg-purple-500/10", color: "text-purple-600 dark:text-purple-400" },
  RentalStarted: { icon: Car, bg: "bg-blue-500/10", color: "text-blue-600 dark:text-blue-400" },
  RentalExtended: { icon: Clock, bg: "bg-blue-500/10", color: "text-blue-600 dark:text-blue-400" },
  RentalOverdue: { icon: Clock, bg: "bg-amber-500/10", color: "text-amber-600 dark:text-amber-400" },
  RentalRejected: { icon: XCircle, bg: "bg-destructive/10", color: "text-destructive" },
  RentalCompleted: { icon: CheckCircle2, bg: "bg-emerald-500/10", color: "text-emerald-600 dark:text-emerald-400" },
  InspectionCreated: { icon: Search, bg: "bg-amber-500/10", color: "text-amber-600 dark:text-amber-400" },
  InspectionCompleted: { icon: ClipboardCheck, bg: "bg-emerald-500/10", color: "text-emerald-600 dark:text-emerald-400" },
  InspectionFailed: { icon: XCircle, bg: "bg-destructive/10", color: "text-destructive" },
  VehicleCreated: { icon: Car, bg: "bg-primary/10", color: "text-primary" },
  MaintenanceCompleted: { icon: Wrench, bg: "bg-amber-500/10", color: "text-amber-600 dark:text-amber-400" },
}

const typeColors: Record<string, string> = {
  Created: statusColor("Created"),
  Confirmed: statusColor("Confirmed"),
  Completed: statusColor("Completed"),
  Cancelled: statusColor("Cancelled"),
  Started: statusColor("Started"),
  Pending: statusColor("Pending"),
}

const friendlyLabel: Record<string, string> = {
  InquiryCreated: "Inquiry created",
  InquiryConfirmed: "Inquiry confirmed",
  InquiryCancelled: "Inquiry cancelled",
  ReservationCreated: "Reservation created",
  ReservationCancelled: "Reservation cancelled",
  PreparationStarted: "Preparation started",
  ReadyForHandover: "Ready for handover",
  RentalStarted: "Rental started",
  RentalExtended: "Rental extended",
  RentalOverdue: "Rental overdue",
  RentalRejected: "Rental rejected",
  RentalCompleted: "Rental completed",
  InspectionCreated: "Inspection created",
  InspectionCompleted: "Inspection completed",
  InspectionFailed: "Inspection failed",
  VehicleCreated: "Vehicle created",
  MaintenanceCompleted: "Maintenance completed",
}

export function EventsEntry({ entry }: { entry: TimelineEntryResponse }) {
  const router = useRouter()
  const config = iconMap[entry.eventType] || { icon: MessageSquare, bg: "bg-muted", color: "text-muted-foreground" }
  const Icon = config.icon
  const label = friendlyLabel[entry.eventType] ?? entry.eventType.replace(/([A-Z])/g, " $1").trim()
  const isInquiry = entry.referenceType === "Inquiry"

  const description = entry.eventType.endsWith("Created")
    ? (friendlyLabel[entry.eventType] ?? label)
    : entry.description
        .replace(/\b[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\b/gi, "")
        .replace(/\s{2,}/g, " ")
        .replace(/\s+([.,])/g, "$1")
        .trim()

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

      <Card
        className={cn(
          "ml-12 mr-0 transition-all hover:shadow-sm lg:ml-20",
          isInquiry && "cursor-pointer hover:ring-2 hover:ring-primary/40 hover:shadow-md"
        )}
        onClick={isInquiry ? () => router.push(`/inquiries/${entry.referenceId}/review`) : undefined}
      >
        <CardContent className="flex items-start justify-between gap-3 p-3">
          <div className="flex flex-col gap-1 min-w-0 flex-1">
            <p className="text-sm leading-snug">{description}</p>
            <div className="flex items-center gap-1.5">
              <Badge variant="secondary" className={cn("text-xs font-medium", getColorClass(entry.eventType))}>
                {label}
              </Badge>
              <span className="font-mono text-xs text-muted-foreground">
                {new Date(entry.occurredAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
              </span>
              {entry.actor && entry.actor !== "System" && (
                <span className="text-xs text-muted-foreground">
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
