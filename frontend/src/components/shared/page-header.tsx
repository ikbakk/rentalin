import { SearchBar } from "./search-bar"

export function PageHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-border px-4 pb-5 pt-6 sm:px-6">
      <div>
        <h1 className="font-heading text-2xl font-bold tracking-tight text-foreground sm:text-3xl">{title}<span className="text-accent">.</span></h1>
        {subtitle && <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>}
      </div>
      <SearchBar />
    </div>
  )
}
