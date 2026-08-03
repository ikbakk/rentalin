import { cn } from "@/lib/utils"

export function SectionHeader({ title, count, className }: { title: string; count?: number; className?: string }) {
  return (
    <div className={cn("flex items-center justify-between px-1 py-2", className)}>
      <h2 className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">{title}</h2>
      {count !== undefined && (
        <span className="flex size-5 items-center justify-center rounded-md bg-muted text-[10px] font-medium text-muted-foreground">
          {count}
        </span>
      )}
    </div>
  )
}
