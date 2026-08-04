// Central status → semantic-tone config (audit D1).
// Every status badge in (app) renders through this single map so the same
// status looks the same everywhere. Tones map to globals.css tokens:
// --success / --warning / --destructive / --primary; unknown statuses fall
// back to a neutral muted tone instead of drifting to raw palette colors.

export const statusTone = {
  success: "bg-success/10 text-success",
  warning: "bg-warning/10 text-warning",
  info: "bg-primary/10 text-primary",
  destructive: "bg-destructive/10 text-destructive",
  neutral: "bg-muted text-muted-foreground",
} as const

export type StatusTone = keyof typeof statusTone

const statusToTone: Record<string, StatusTone> = {
  // Fleet
  Available: "success",
  Rented: "info",
  Maintenance: "warning",
  Retired: "neutral",
  // Reservations / rentals
  Confirmed: "success",
  Preparing: "warning",
  PreRental: "warning",
  Ready: "info",
  Active: "success",
  Completed: "neutral",
  Overdue: "destructive",
  Cancelled: "neutral",
  // Inquiries
  New: "warning",
  Pending: "warning",
  Responded: "success",
  // Timeline event-type suffixes (suffix-matched in events-entry)
  Created: "info",
  Started: "info",
}

export function statusColor(status: string): string {
  return statusTone[statusToTone[status] ?? "neutral"]
}
