import { cn } from "@/lib/utils"

export function CardSkeleton({ className }: { className?: string }) {
  return <div className={cn("h-24 rounded-xl bg-muted animate-shimmer", className)} />
}

export function RowSkeleton() {
  return (
    <div className="flex items-center gap-3 p-4">
      <div className="size-10 shrink-0 animate-shimmer rounded-full bg-muted" />
      <div className="flex-1 space-y-2">
        <div className="h-3 w-2/3 animate-shimmer rounded bg-muted" />
        <div className="h-3 w-1/3 animate-shimmer rounded bg-muted" />
      </div>
    </div>
  )
}

export function ListSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="flex flex-col gap-2 p-4">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 rounded-xl bg-muted p-4 animate-shimmer">
          <div className="size-10 shrink-0 rounded-lg bg-muted-foreground/20" />
          <div className="flex-1 space-y-2">
            <div className="h-3 w-2/3 rounded bg-muted-foreground/20" />
            <div className="h-3 w-1/3 rounded bg-muted-foreground/20" />
          </div>
        </div>
      ))}
    </div>
  )
}
