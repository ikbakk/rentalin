import { SearchBar } from "./search-bar"

export function PageHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-3 border-b border-border bg-card px-4 pb-4 pt-2 sm:gap-y-4 sm:px-6 sm:pb-5 sm:pt-2">
      <div className="min-w-0">
        <h1 className="font-heading text-xl font-bold tracking-tight text-foreground sm:text-3xl">{title}<span className="text-accent">.</span></h1>
        {subtitle && <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{subtitle}</p>}
      </div>
      <SearchBar />
    </div>
  )
}
