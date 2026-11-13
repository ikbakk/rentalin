import { cn } from "@/lib/utils"

export function SectionHeader({ title, count, className }: { title: string; count?: number; className?: string }) {
  return (
    <div className={cn("flex items-center justify-between px-1 py-2", className)}>
      <h2 className="font-mono text-xs font-bold uppercase tracking-wider text-primary">{title}</h2>
      {count !== undefined && (
        <span className="flex size-6 items-center justify-center rounded-md bg-muted text-xs font-medium text-muted-foreground">
          {count}
        </span>
      )}
    </div>
  )
}
