"use client"

import { useState, useMemo } from "react"
import { useOperationsSummary } from "@/hooks/use-operations"
import { useVehicles } from "@/hooks/use-vehicles"
import { useReservations, useRentals } from "@/hooks/use-reservations"
import { useInquiries } from "@/hooks/use-inquiries"
import { SectionHeader } from "@/components/shared/section-header"
import { EmptyState } from "@/components/shared/empty-state"
import { ListSkeleton } from "@/components/shared/loading-skeleton"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"
import { cn } from "@/lib/utils"
import { Car, DollarSign, MessageSquare, TrendingUp, ArrowRight, Clock, AlertTriangle, CheckCircle2, CalendarDays } from "lucide-react"
import type { OperationItem } from "@/components/shared/operation-card"

type TimeFilter = "today" | "tomorrow" | "week" | "overdue" | "all"

const timeFilters: { key: TimeFilter; label: string; icon: typeof CalendarDays }[] = [
  { key: "today", label: "Today", icon: Clock },
  { key: "tomorrow", label: "Tomorrow", icon: CalendarDays },
  { key: "week", label: "This Week", icon: CalendarDays },
  { key: "overdue", label: "Overdue", icon: AlertTriangle },
  { key: "all", label: "All", icon: CalendarDays },
]

const priorityMap: Record<string, string> = {
  return: "action", late: "action",
  pickup: "attention", preparation: "attention", inspection: "attention",
  inquiry: "info",
}

interface ExtendedOperationItem extends OperationItem {
  date?: string
  endDate?: string
}

function getActionPath(item: ExtendedOperationItem): string {
  switch (item.type) {
    case "pickup":
      return `/reservations/${item.id}/handover`
    case "return":
      return `/rentals/${item.id}/return`
    case "preparation":
      return `/reservations/${item.id}/preparation`
    case "inquiry":
      return `/inquiries/${item.id}/review`
    default:
      return "/reservations"
  }
}

function buildOperationItems(
  vehicles: unknown[], reservations: unknown[], rentals: unknown[], inquiries: unknown[]
): ExtendedOperationItem[] {
  const items: ExtendedOperationItem[] = []

  for (const r of reservations as Array<{id: string; status: string; vehicleSummary: string; customerName: string; currency: string; estimatedCost: number; startDate?: string}>) {
    if (r.status === "Ready" || r.status === "Active") {
      const startDate = r.startDate ? new Date(r.startDate) : null
      items.push({
        id: r.id, type: "pickup" as const,
        title: `Pickup: ${r.vehicleSummary}`,
        subtitle: `${r.customerName} · ${r.currency} ${r.estimatedCost.toLocaleString()}`,
        status: r.status === "Ready" ? "Ready" : "Pending",
        customerName: r.customerName, vehiclePlate: r.vehicleSummary,
        actionLabel: "Start Handover",
        date: startDate?.toISOString(),
        endDate: startDate?.toISOString(),
      })
    }
  }

  for (const r of rentals as Array<{id: string; status: string; vehicleSummary: string; customerName: string; odometerStart?: number; actualEnd?: string}>) {
    if (r.status === "Active") {
      const endDate = r.actualEnd ? new Date(r.actualEnd) : null
      items.push({
        id: r.id, type: "return" as const,
        title: `Return: ${r.vehicleSummary}`,
        subtitle: `${r.customerName} · Odo: ${r.odometerStart?.toLocaleString() ?? "?"} km`,
        status: "Pending",
        customerName: r.customerName, vehiclePlate: r.vehicleSummary,
        actionLabel: "Process Return",
        date: endDate?.toISOString(),
        endDate: endDate?.toISOString(),
      })
    }
  }

  for (const r of reservations as Array<{id: string; status: string; customerName: string; vehicleSummary: string; currency: string; estimatedCost: number; startDate?: string}>) {
    if (r.status === "Active" || r.status === "Confirmed") {
      items.push({
        id: r.id, type: "preparation" as const,
        title: `Prepare: ${r.customerName}`,
        subtitle: `${r.vehicleSummary} · ${r.currency} ${r.estimatedCost.toLocaleString()}`,
        status: "Needs Attention",
        vehiclePlate: r.vehicleSummary,
        actionLabel: "Prepare Vehicle",
        date: r.startDate,
        endDate: r.startDate,
      })
    }
  }

  for (const i of inquiries as Array<{id: string; status: string; customerName: string; vehicleSummary: string; startDate: string; endDate: string}>) {
    if (i.status === "New" || i.status === "Pending") {
      items.push({
        id: i.id, type: "inquiry" as const,
        title: `Inquiry: ${i.customerName}`,
        subtitle: `${i.vehicleSummary} · ${new Date(i.startDate).toLocaleDateString()} – ${new Date(i.endDate).toLocaleDateString()}`,
        status: "New",
        customerName: i.customerName, vehiclePlate: i.vehicleSummary,
        actionLabel: "Review",
        date: i.startDate,
        endDate: i.endDate,
      })
    }
  }

  return items
}

function getTimeBucket(item: ExtendedOperationItem, now: Date): TimeFilter {
  if (!item.date) return "all"

  const itemDate = new Date(item.date)
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const tomorrow = new Date(today.getTime() + 86400000)
  const weekEnd = new Date(today.getTime() + 7 * 86400000)

  if (itemDate < today) return "overdue"
  if (itemDate.toDateString() === today.toDateString()) return "today"
  if (itemDate.toDateString() === tomorrow.toDateString()) return "tomorrow"
  if (itemDate <= weekEnd) return "week"
  return "all"
}

const typeConfig: Record<string, { icon: typeof Car; bg: string; text: string; label: string }> = {
  pickup: { icon: Clock, bg: "bg-blue-500/10", text: "text-blue-600 dark:text-blue-400", label: "Pickup" },
  return: { icon: ArrowRight, bg: "bg-amber-500/10", text: "text-amber-600 dark:text-amber-400", label: "Return" },
  preparation: { icon: Car, bg: "bg-purple-500/10", text: "text-purple-600 dark:text-purple-400", label: "Prep" },
  late: { icon: AlertTriangle, bg: "bg-destructive/10", text: "text-destructive", label: "Late" },
  inquiry: { icon: MessageSquare, bg: "bg-primary/10", text: "text-primary", label: "Inquiry" },
  inspection: { icon: CheckCircle2, bg: "bg-emerald-500/10", text: "text-emerald-600 dark:text-emerald-400", label: "Inspection" },
}

const timeBucketOrder: TimeFilter[] = ["overdue", "today", "tomorrow", "week"]

export function OperationsView() {
  const { data: summary } = useOperationsSummary()
  const { data: vehicles, isLoading: vLoading } = useVehicles()
  const { data: reservations, isLoading: rLoading } = useReservations()
  const { data: rentals, isLoading: aLoading } = useRentals()
  const { data: inquiries, isLoading: iLoading } = useInquiries()
  const [timeFilter, setTimeFilter] = useState<TimeFilter>("today")
  const router = useRouter()
  const loading = vLoading || rLoading || aLoading || iLoading

  const items = useMemo(() =>
    buildOperationItems(vehicles ?? [], reservations ?? [], rentals ?? [], inquiries ?? []),
    [vehicles, reservations, rentals, inquiries]
  )

  const now = useMemo(() => new Date(), [])

  const filtered = useMemo(() => {
    if (timeFilter === "all") return items
    return items.filter(item => getTimeBucket(item, now) === timeFilter)
  }, [items, timeFilter, now])

  const groupedByTime = useMemo(() => {
    const groups: Record<TimeFilter, ExtendedOperationItem[]> = {
      overdue: [], today: [], tomorrow: [], week: [], all: []
    }
    for (const item of items) {
      const bucket = getTimeBucket(item, now)
      if (bucket !== "all") groups[bucket].push(item)
    }
    return groups
  }, [items, now])

  const stats = useMemo(() => summary ? [
    { icon: Car, label: "Available", value: summary.availableVehicles, trend: `${summary.availableVehicles} ready` },
    { icon: TrendingUp, label: "Rented", value: summary.rentedVehicles, trend: `${summary.activeRentals} active` },
    { icon: MessageSquare, label: "Inquiries", value: summary.activeInquiries, trend: "awaiting response" },
    { icon: DollarSign, label: "Revenue", value: `${summary.revenueCurrency} ${summary.todayRevenue.toLocaleString()}`, trend: "today" },
  ] : [], [summary])

  const counts = useMemo(() => ({
    overdue: groupedByTime.overdue.length,
    today: groupedByTime.today.length,
    tomorrow: groupedByTime.tomorrow.length,
    week: groupedByTime.week.length,
    all: items.length,
  }), [groupedByTime, items])

  if (loading) {
    return (
      <div className="p-4 space-y-4">
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {[1, 2, 3, 4].map(i => <div key={i} className="h-24 animate-pulse rounded-xl bg-muted" />)}
        </div>
        <div className="space-y-3">
          {[1, 2, 3].map(i => <div key={i} className="h-20 animate-pulse rounded-xl bg-muted" />)}
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col pb-8">

      <div className="px-4 lg:px-6">
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {stats.map((s, i) => (
            <Card key={s.label} className={cn("animate-fade-in overflow-hidden", `stagger-${i + 1}`)}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className={cn("flex size-10 items-center justify-center rounded-lg", s.icon === Car ? "bg-emerald-500/10" : s.icon === TrendingUp ? "bg-blue-500/10" : s.icon === MessageSquare ? "bg-amber-500/10" : "bg-primary/10")}>
                    <s.icon className={cn("size-5", s.icon === Car ? "text-emerald-600 dark:text-emerald-400" : s.icon === TrendingUp ? "text-blue-600 dark:text-blue-400" : s.icon === MessageSquare ? "text-amber-600 dark:text-amber-400" : "text-primary")} />
                  </div>
                </div>
                <div className="mt-3">
                  <p className="font-mono text-2xl font-bold tabular-nums">{s.value}</p>
                  <p className="text-xs font-medium text-muted-foreground">{s.label}</p>
                  <p className="text-xs text-muted-foreground mt-1">{s.trend}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      <div className="mt-6 px-4 lg:px-6">
        <div className="flex items-center gap-2 overflow-x-auto pb-2">
          {timeFilters.map(f => (
            <button
              key={f.key}
              onClick={() => setTimeFilter(f.key)}
              className={cn(
                "shrink-0 flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-medium transition-all",
                timeFilter === f.key
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "bg-muted text-muted-foreground hover:bg-muted/80"
              )}
            >
              <f.icon className="size-3.5" />
              {f.label}
              {counts[f.key] > 0 && (
                <span className={cn(
                  "ml-1 px-1.5 py-0.5 rounded-full text-xs",
                  timeFilter === f.key ? "bg-primary-foreground/20" : "bg-muted"
                )}>
                  {counts[f.key]}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-4 space-y-6 px-4 lg:px-6">
        {timeBucketOrder.map(timeBucket => {
          if (timeFilter !== "all" && timeFilter !== timeBucket) return null
          const bucketItems = groupedByTime[timeBucket]
          if (!bucketItems?.length) return null

          const bucketLabels: Record<TimeFilter, string> = {
            overdue: "Overdue",
            today: "Today",
            tomorrow: "Tomorrow",
            week: "This Week",
            all: "All",
          }
          const bucketColors: Record<TimeFilter, string> = {
            overdue: "text-destructive",
            today: "text-foreground",
            tomorrow: "text-muted-foreground",
            week: "text-muted-foreground",
            all: "text-foreground",
          }

          const actionItems = bucketItems.filter(item => priorityMap[item.type] === "action")
          const attentionItems = bucketItems.filter(item => priorityMap[item.type] === "attention")
          const infoItems = bucketItems.filter(item => priorityMap[item.type] === "info")

          return (
            <div key={timeBucket}>
              <SectionHeader
                title={bucketLabels[timeBucket]}
                count={bucketItems.length}
                className={bucketColors[timeBucket]}
              />

              {actionItems.length > 0 && (
                <div className="space-y-2 mb-4">
                  {actionItems.map((item, i) => {
                    const config = typeConfig[item.type] || typeConfig.inquiry
                    return (
                      <Card
                        key={item.id}
                        className={cn(
                          "cursor-pointer transition-all hover:ring-2 hover:ring-ring/40 hover:shadow-md animate-slide-up border-destructive/30 bg-destructive/5",
                          `stagger-${(i % 8) + 1}`
                        )}
                        onClick={() => router.push(getActionPath(item))}
                      >
                        <CardContent className="flex items-center gap-4 p-4">
                          <div className={cn("flex size-10 shrink-0 items-center justify-center rounded-lg", config.bg)}>
                            <config.icon className={cn("size-5", config.text)} />
                          </div>
                          <div className="flex flex-1 flex-col gap-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-semibold truncate">{item.title}</span>
                              <Badge variant="destructive" className="shrink-0">
                                {config.label}
                              </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground truncate">{item.subtitle}</p>
                          </div>
                          <div className="flex shrink-0 items-center gap-2">
                            <Button size="sm" variant="ghost" className="h-8 text-xs font-medium">
                              {item.actionLabel}
                            </Button>
                            <ArrowRight className="size-4 text-muted-foreground" />
                          </div>
                        </CardContent>
                      </Card>
                    )
                  })}
                </div>
              )}

              {attentionItems.length > 0 && (
                <div className="space-y-2 mb-4">
                  {attentionItems.map((item, i) => {
                    const config = typeConfig[item.type] || typeConfig.inquiry
                    return (
                      <Card
                        key={item.id}
                        className={cn(
                          "cursor-pointer transition-all hover:ring-2 hover:ring-ring/40 hover:shadow-md animate-slide-up",
                          `stagger-${(i % 8) + 1}`
                        )}
                        onClick={() => router.push(getActionPath(item))}
                      >
                        <CardContent className="flex items-center gap-4 p-4">
                          <div className={cn("flex size-10 shrink-0 items-center justify-center rounded-lg", config.bg)}>
                            <config.icon className={cn("size-5", config.text)} />
                          </div>
                          <div className="flex flex-1 flex-col gap-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-semibold truncate">{item.title}</span>
                              <Badge variant="secondary" className="shrink-0">
                                {config.label}
                              </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground truncate">{item.subtitle}</p>
                          </div>
                          <div className="flex shrink-0 items-center gap-2">
                            <Button size="sm" variant="ghost" className="h-8 text-xs font-medium">
                              {item.actionLabel}
                            </Button>
                            <ArrowRight className="size-4 text-muted-foreground" />
                          </div>
                        </CardContent>
                      </Card>
                    )
                  })}
                </div>
              )}

              {infoItems.length > 0 && (
                <div className="space-y-2">
                  {infoItems.map((item, i) => {
                    const config = typeConfig[item.type] || typeConfig.inquiry
                    return (
                      <Card
                        key={item.id}
                        className={cn(
                          "cursor-pointer transition-all hover:ring-2 hover:ring-ring/40 hover:shadow-md animate-slide-up",
                          `stagger-${(i % 8) + 1}`
                        )}
                        onClick={() => router.push(getActionPath(item))}
                      >
                        <CardContent className="flex items-center gap-4 p-4">
                          <div className={cn("flex size-10 shrink-0 items-center justify-center rounded-lg", config.bg)}>
                            <config.icon className={cn("size-5", config.text)} />
                          </div>
                          <div className="flex flex-1 flex-col gap-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-semibold truncate">{item.title}</span>
                              <Badge variant="outline" className="shrink-0">
                                {config.label}
                              </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground truncate">{item.subtitle}</p>
                          </div>
                          <div className="flex shrink-0 items-center gap-2">
                            <Button size="sm" variant="ghost" className="h-8 text-xs font-medium">
                              {item.actionLabel}
                            </Button>
                            <ArrowRight className="size-4 text-muted-foreground" />
                          </div>
                        </CardContent>
                      </Card>
                    )
                  })}
                </div>
              )}
            </div>
          )
        })}

        {filtered.length === 0 && items.length === 0 && (
          <EmptyState
            title="All clear for today"
            description="No pending actions. New inquiries and reservations will appear here."
            action={{ label: "View Fleet", onClick: () => router.push("/fleet") }}
          />
        )}

        {filtered.length === 0 && items.length > 0 && (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <p className="text-sm text-muted-foreground">No items in this time period</p>
          </div>
        )}
      </div>
    </div>
  )
}
