import { cn } from "@/lib/utils"
import { CheckCircle2, AlertTriangle, AlertCircle, Info } from "lucide-react"

const config: Record<string, { bg: string; text: string; icon: typeof CheckCircle2; label: string }> = {
  ready:    { bg: "bg-success/10 text-success", text: "text-success", icon: CheckCircle2, label: "Ready" },
  attention:{ bg: "bg-warning/10 text-warning", text: "text-warning", icon: AlertTriangle, label: "Attention" },
  action:   { bg: "bg-destructive/10 text-destructive", text: "text-destructive", icon: AlertCircle, label: "Action" },
  info:     { bg: "bg-muted text-muted-foreground", text: "text-muted-foreground", icon: Info, label: "Info" },
}

const statusMap: Record<string, keyof typeof config> = {
  Available: "ready", Rented: "attention", Maintenance: "action", Retired: "info",
  Active: "attention", Completed: "ready", Cancelled: "info",
  Pending: "attention", New: "attention", Confirmed: "ready",
  Preparing: "attention", Ready: "ready", Overdue: "action",
  Failed: "action", PreRental: "attention", PostRental: "attention",
  Converted: "ready", Responded: "info",
}

export function StatusChip({ status, className }: { status: string; className?: string }) {
  const key = statusMap[status] ?? "info"
  const s = config[key]
  const Icon = s.icon

  return (
    <span className={cn("inline-flex items-center gap-1 rounded-md border border-transparent px-2 py-0.5 text-xs font-medium", s.bg, className)}>
      <Icon className="size-3" />
      {status}
    </span>
  )
}
