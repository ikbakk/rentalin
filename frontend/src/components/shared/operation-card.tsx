import { cn } from "@/lib/utils"
import { StatusChip } from "./status-chip"
import { ChevronRight, Car, User, AlertTriangle, CheckCircle2 } from "lucide-react"

export interface OperationItem {
  id: string
  type: "pickup" | "return" | "preparation" | "late" | "inquiry" | "inspection"
  title: string
  subtitle: string
  time?: string
  status: string
  customerName?: string
  vehiclePlate?: string
  actionLabel: string
  urgent?: boolean
}

const typeIcons = {
  pickup: Car, return: Car, preparation: Car, late: AlertTriangle,
  inquiry: User, inspection: Car
}

const priorityConfig: Record<string, { label: string; class: string }> = {
  return: { label: "Action Required", class: "bg-destructive/10 text-destructive border-destructive/30" },
  late: { label: "Action Required", class: "bg-destructive/10 text-destructive border-destructive/30" },
  pickup: { label: "Needs Attention", class: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-500" },
  preparation: { label: "Needs Attention", class: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-500" },
  inspection: { label: "Pending", class: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-500" },
  inquiry: { label: "Informational", class: "bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-500" },
}

export function OperationCard({ item, onClick }: { item: OperationItem; onClick?: () => void }) {
  const Icon = typeIcons[item.type]
  const priority = priorityConfig[item.type] ?? priorityConfig.inquiry
  const isAction = item.type === "late" || item.type === "return" || item.urgent

  return (
    <button
      onClick={onClick}
      className={cn(
        "flex w-full items-start gap-3 rounded-xl border p-4 text-left transition-colors hover:bg-card/80",
        isAction && "border-destructive/30 bg-destructive/5"
      )}
    >
      <div className={cn("flex size-10 shrink-0 items-center justify-center rounded-lg", isAction ? "bg-destructive/10 text-destructive" : "bg-muted")}>
        <Icon className="size-5" />
      </div>
      <div className="flex flex-1 flex-col gap-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <span className="text-sm font-semibold truncate">{item.title}</span>
          <span className={cn("shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-semibold", priority.class)}>{priority.label}</span>
        </div>
        <p className="text-sm text-muted-foreground">{item.subtitle}</p>
        <div className="flex items-center gap-2 mt-1">
          <StatusChip status={item.status} />
          {item.vehiclePlate && <span className="font-mono text-xs text-muted-foreground">{item.vehiclePlate}</span>}
          {item.customerName && <span className="text-xs text-muted-foreground">{item.customerName}</span>}
        </div>
      </div>
      <ChevronRight className="size-5 shrink-0 self-center text-muted-foreground" />
    </button>
  )
}
