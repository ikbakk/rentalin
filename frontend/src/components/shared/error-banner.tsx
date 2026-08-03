import { AlertTriangle, XCircle, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface ErrorBannerProps {
  title: string
  message: string
  onRetry?: () => void
  onDismiss?: () => void
  variant?: "error" | "warning"
}

export function ErrorBanner({ title, message, onRetry, onDismiss, variant = "error" }: ErrorBannerProps) {
  return (
    <div
      className={cn(
        "flex items-start gap-3 rounded-xl border p-4",
        variant === "error"
          ? "border-destructive/30 bg-destructive/5"
          : "border-warning/30 bg-warning/5"
      )}
    >
      {variant === "error" ? (
        <XCircle className="size-5 text-destructive shrink-0 mt-0.5" />
      ) : (
        <AlertTriangle className="size-5 text-warning shrink-0 mt-0.5" />
      )}
      <div className="flex flex-col gap-1 flex-1">
        <span className="text-sm font-semibold">{title}</span>
        <p className="text-sm text-muted-foreground">{message}</p>
        <div className="flex gap-2 mt-1">
          {onRetry && (
            <Button variant="outline" size="sm" onClick={onRetry}>
              <RefreshCw className="size-3 mr-1" />
              Retry
            </Button>
          )}
          {onDismiss && (
            <Button variant="ghost" size="sm" onClick={onDismiss}>
              Dismiss
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
