"use client"

import { useState, useEffect, useRef } from "react"
import { useQuery } from "convex/react"
import { api } from "../../../../convex/_generated/api"
import { useActiveBusiness } from "@/hooks/use-active-business"
import { useRouter } from "next/navigation"
import { Search, X, Car, User } from "lucide-react"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"

interface SearchResult {
  vehicles: { Id: string; LicensePlate: string; Make: string; Model: string; Status: string }[]
  customers: { Id: string; Name: string; Phone: string }[]
}

export function SearchBar() {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState("")
  const { businessId } = useActiveBusiness()
  const searchData = useQuery(api.search.search, businessId && query.length >= 2 ? { businessId, query } : "skip")
  const results: SearchResult | null = searchData ? { vehicles: searchData.vehicles.map(v => ({ Id: v._id, LicensePlate: v.plateNumber, Make: v.make, Model: v.model, Status: v.status })), customers: searchData.customers.map(c => ({ Id: c._id, Name: c.name, Phone: c.phoneNumber })) } : null
  const router = useRouter()
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false)
    }
    window.addEventListener("keydown", handler)
    return () => window.removeEventListener("keydown", handler)
  }, [])

  if (!open) return (
    <button onClick={() => setOpen(true)} aria-label="Open search" className="flex items-center gap-2 rounded-lg border px-3 py-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
      <Search className="size-4" />
      <span>Search</span>
      <kbd className="ml-auto text-xs tracking-wider opacity-50">⌘K</kbd>
    </button>
  )

  return (
    <div role="dialog" aria-modal="true" aria-label="Search" className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm" onClick={() => setOpen(false)}>
      <div ref={ref} className="mx-auto mt-20 max-w-lg px-4" onClick={e => e.stopPropagation()}>
        <div className="flex items-center gap-2 rounded-xl border bg-card p-3">
          <Search className="size-5 text-muted-foreground shrink-0" />
          <Input value={query} onChange={e => setQuery(e.target.value)} aria-label="Search vehicles, customers" placeholder="Search vehicles, customers..." className="border-0 bg-transparent p-0 text-base shadow-none focus-visible:ring-0" autoFocus />
          <button onClick={() => setOpen(false)} aria-label="Close search"><X className="size-5 text-muted-foreground" /></button>
        </div>
        {results && (
          <div className="mt-2 rounded-xl border bg-card p-2 max-h-64 overflow-y-auto">
            {results.vehicles.map(v => (
              <button key={v.Id} onClick={() => { router.push("/fleet"); setOpen(false) }} className="flex w-full items-center gap-3 rounded-lg p-3 hover:bg-muted text-left">
                <Car className="size-5 text-muted-foreground" />
                <div className="flex flex-col"><span className="font-mono text-sm font-bold">{v.LicensePlate}</span><span className="text-xs text-muted-foreground">{v.Make} {v.Model} · {v.Status}</span></div>
              </button>
            ))}
            {results.customers.map(c => (
              <button key={c.Id} onClick={() => { router.push("/customers"); setOpen(false) }} className="flex w-full items-center gap-3 rounded-lg p-3 hover:bg-muted text-left">
                <User className="size-5 text-muted-foreground" />
                <div className="flex flex-col"><span className="text-sm font-semibold">{c.Name}</span><span className="font-mono text-xs text-muted-foreground">{c.Phone}</span></div>
              </button>
            ))}
            {results.vehicles.length === 0 && results.customers.length === 0 && (
              <p className="p-3 text-sm text-muted-foreground text-center">No results for &ldquo;{query}&rdquo;</p>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
