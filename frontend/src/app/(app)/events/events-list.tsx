"use client"

import { useState, useMemo } from "react"
import { useTimeline } from "@/hooks/use-timeline"
import { EventsEntry } from "./events-entry"
import { EmptyState } from "@/components/shared/empty-state"
import { cn } from "@/lib/utils"

const dayFilters = [
  { key: "all", label: "All" },
  { key: "today", label: "Today" },
  { key: "yesterday", label: "Yesterday" },
  { key: "week", label: "This Week" },
]

export function EventsList() {
  const { data: entries, isLoading } = useTimeline()
  const [dayFilter, setDayFilter] = useState("all")

  const filtered = useMemo(() => {
    if (!entries) return []
    if (dayFilter === "all") return entries

    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const yesterday = new Date(today.getTime() - 86400000)
    const weekAgo = new Date(today.getTime() - 7 * 86400000)

    let targetStart: Date
    let targetEnd = new Date(today.getTime() + 86400000)

    switch (dayFilter) {
      case "today":
        targetStart = today
        break
      case "yesterday":
        targetStart = yesterday
        targetEnd = today
        break
      case "week":
        targetStart = weekAgo
        break
      default:
        return entries
    }

    return entries.filter(e => {
      const d = new Date(e.occurredAt)
      return d >= targetStart && d < targetEnd
    })
  }, [entries, dayFilter])

  const grouped = useMemo(() => {
    const groups: Record<string, typeof entries> = {}
    for (const e of filtered) {
      const date = new Date(e.occurredAt)
      const today = new Date()
      const yesterday = new Date(today)
      yesterday.setDate(yesterday.getDate() - 1)

      let key: string
      if (date.toDateString() === today.toDateString()) {
        key = "Today"
      } else if (date.toDateString() === yesterday.toDateString()) {
        key = "Yesterday"
      } else {
        key = date.toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" })
      }

      if (!groups[key]) groups[key] = []
      groups[key]!.push(e)
    }
    return groups
  }, [filtered])

  if (isLoading) {
    return (
      <div className="p-4">
        <div className="space-y-2">
          {[1, 2, 3, 4, 5].map(i => (
            <div key={i} className="flex items-start gap-3 p-3">
              <div className="size-8 animate-pulse rounded-full bg-muted" />
              <div className="flex-1 space-y-2">
                <div className="h-4 w-3/4 animate-pulse rounded bg-muted" />
                <div className="h-3 w-1/4 animate-pulse rounded bg-muted" />
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (!entries?.length) {
    return (
      <div className="flex flex-col items-center justify-center p-6">
        <EmptyState
          title="No activity yet"
          description="Events appear as actions are taken"
        />
      </div>
    )
  }

  return (
    <div className="flex flex-col pb-20 lg:pb-6">
      <div className="px-4 py-4">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-2 overflow-x-auto">
            {dayFilters.map(f => (
              <button
                key={f.key}
                onClick={() => setDayFilter(f.key)}
                className={cn(
                  "shrink-0 rounded-full px-4 py-2 text-sm font-medium transition-all",
                  dayFilter === f.key
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "bg-muted text-muted-foreground hover:bg-muted/80"
                )}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="flex flex-col px-4 lg:px-6">
        {Object.entries(grouped).map(([date, items]) => (
          <div key={date} className="mb-6">
            <div className="sticky top-0 z-10 bg-background/95 backdrop-blur py-2">
              <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                {date}
              </h2>
            </div>
            <div className="relative">
              <div className="absolute left-4 top-0 bottom-0 w-px bg-border lg:left-6" />
              <div className="space-y-2">
                {items!.map((entry, idx) => (
                  <div key={entry.id} className={cn("animate-fade-up", `stagger-${(idx % 8) + 1}`)}>
                    <EventsEntry entry={entry} />
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}

        {filtered.length === 0 && (
          <div className="py-12 text-center">
            <p className="text-sm text-muted-foreground">No activity for this period</p>
          </div>
        )}
      </div>
    </div>
  )
}
