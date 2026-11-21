"use client"

import { useState } from "react"
import { ArrowRight, Search, Users } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import type { usePublicVehiclesBySlug } from "@/hooks/use-public-vehicles-by-slug"

type Vehicle = NonNullable<ReturnType<typeof usePublicVehiclesBySlug>["data"]>[number]

const sortOptions = [
  { value: "name", label: "Make & model" },
  { value: "price", label: "Daily rate: low to high" },
  { value: "year", label: "Newest year first" },
]

export function VehicleBrowser({ vehicles, onSelect }: {
  vehicles: Vehicle[]
  onSelect: (id: string) => void
}) {
  const [search, setSearch] = useState("")
  const [make, setMake] = useState<string | null>(null)
  const [seats, setSeats] = useState("all")
  const [sort, setSort] = useState("name")
  const makes = [...new Set(vehicles.map(v => v.make))].sort((a, b) => a.localeCompare(b))
  const capacities = [...new Set(vehicles.map(v => v.seatingCapacity).filter(n => n > 0))].sort((a, b) => a - b)
  const seatOptions = [{ value: "all", label: "Any seating" }, ...capacities.map(n => ({ value: String(n), label: `${n} seats` }))]
  const hasFilters = !!(search || make !== null || seats !== "all")
  const clearFilters = () => { setSearch(""); setMake(null); setSeats("all") }
  const query = search.trim().toLocaleLowerCase()
  const results = vehicles.filter(v =>
    (make === null || v.make === make) &&
    (seats === "all" || v.seatingCapacity === Number(seats)) &&
    `${v.make} ${v.model} ${v.color} ${v.year || ""}`.toLocaleLowerCase().includes(query)
  ).sort((a, b) => {
    // Keep currencies separate: comparing their raw amounts would be misleading.
    if (sort === "price") return a.dailyRateCurrency.localeCompare(b.dailyRateCurrency) || a.dailyRateAmount - b.dailyRateAmount
    if (sort === "year") return b.year - a.year
    return `${a.make} ${a.model}`.localeCompare(`${b.make} ${b.model}`)
  })
  const multipleCurrencies = new Set(vehicles.map(v => v.dailyRateCurrency)).size > 1

  return (
    <div className="space-y-8">
      {makes.length > 1 && (
        <section aria-labelledby="browse-make">
          <h3 id="browse-make" className="mb-3 text-sm font-semibold">Browse by make</h3>
          <div className="flex flex-wrap gap-2">
            <Button variant={make === null ? "default" : "outline"} aria-pressed={make === null} onClick={() => setMake(null)} className="h-11 px-4">All makes <span className="opacity-75">{vehicles.length}</span></Button>
            {makes.map(brand => (
              <Button key={brand} variant={make === brand ? "default" : "outline"} aria-pressed={make === brand} onClick={() => setMake(make === brand ? null : brand)} className="h-11 max-w-full whitespace-normal px-4 text-left">
                {brand} <span className="opacity-75">{vehicles.filter(v => v.make === brand).length}</span>
              </Button>
            ))}
          </div>
        </section>
      )}

      <div className="grid gap-6 lg:grid-cols-[15rem_minmax(0,1fr)] lg:gap-10">
        <aside aria-label="Filter vehicles" className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="fleet-search">Find your vehicle</Label>
            <div className="relative">
              <Search aria-hidden className="absolute left-3 top-3.5 size-4 text-muted-foreground" />
              <Input id="fleet-search" type="search" placeholder="Model, make or color" value={search} onChange={e => setSearch(e.target.value)} className="h-11 pl-9" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-1 lg:gap-4">
            <div className="min-w-0 space-y-2">
              <Label htmlFor="fleet-seats">Seating</Label>
              <Select items={seatOptions} value={seats} onValueChange={value => setSeats(value ?? "all")}>
                <SelectTrigger id="fleet-seats" className="data-[size=default]:h-11 w-full"><SelectValue /></SelectTrigger>
                <SelectContent>{seatOptions.map(option => <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="min-w-0 space-y-2">
              <Label htmlFor="fleet-sort">Sort by</Label>
              <Select items={sortOptions} value={sort} onValueChange={value => setSort(value ?? "name")}>
                <SelectTrigger id="fleet-sort" className="data-[size=default]:h-11 w-full"><SelectValue /></SelectTrigger>
                <SelectContent>{sortOptions.map(option => <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </div>
          {sort === "price" && multipleCurrencies && <p className="text-xs text-muted-foreground">Rates are sorted within each currency.</p>}
          {hasFilters && <Button variant="ghost" onClick={clearFilters} className="h-11">Clear filters</Button>}
          <p className="hidden border-t border-border pt-4 text-sm leading-relaxed text-muted-foreground lg:block">Choose a vehicle, then tell us your dates. The rental team will confirm availability on WhatsApp.</p>
        </aside>

        <section aria-label="Vehicle results" className="min-w-0">
          <div className="flex flex-wrap items-baseline justify-between gap-2 border-b border-border pb-3">
            <h3 className="font-heading text-xl font-semibold">{make ?? "Explore the fleet"}</h3>
            <p role="status" aria-live="polite" className="text-sm text-muted-foreground">{results.length} of {vehicles.length} vehicles</p>
          </div>
          {results.length === 0 ? (
            <div className="py-12 text-center">
              <h4 className="font-heading text-lg font-semibold">No vehicles match your filters</h4>
              <p className="mt-2 text-sm text-muted-foreground">Try another model, make or seating option.</p>
              <Button variant="outline" onClick={clearFilters} className="mt-5 h-11">Show all vehicles</Button>
            </div>
          ) : (
            <ul className="divide-y divide-border">
              {results.map(v => (
                <li key={v.id} className="grid gap-4 py-5 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center sm:gap-6 sm:py-6">
                  <div className="min-w-0">
                    <h4 className="break-words font-heading text-xl font-semibold tracking-tight">{v.make} {v.model}</h4>
                    <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
                      {v.year > 0 && <span>{v.year}</span>}
                      {v.seatingCapacity > 0 && <span className="inline-flex items-center gap-1.5"><Users aria-hidden className="size-4" />{v.seatingCapacity} seats</span>}
                      {v.color && <span className="capitalize">{v.color}</span>}
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center justify-between gap-3 sm:flex-col sm:items-end">
                    <p className="text-lg font-semibold tabular-nums">{v.dailyRateCurrency} {v.dailyRateAmount.toLocaleString()}<span className="ml-1 text-xs font-normal text-muted-foreground">/ day</span></p>
                    <Button variant="outline" className="h-11 gap-2 px-4" aria-label={`Request ${v.make} ${v.model}`} onClick={() => onSelect(v.id)}>Request vehicle <ArrowRight aria-hidden className="size-4" /></Button>
                  </div>
                </li>
              ))}
            </ul>
          )}
          <p className="mt-4 text-xs leading-relaxed text-muted-foreground">Daily rates shown. Availability for your dates is confirmed by the rental team.</p>
        </section>
      </div>
    </div>
  )
}
