"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { useQuery } from "@tanstack/react-query"
import { api } from "@/lib/api"
import {
  CommandDialog,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandSeparator,
  CommandShortcut,
} from "@/components/ui/command"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Search,
  Car,
  Users,
  ClipboardList,
  Calendar,
  Plus,
  Settings,
  ArrowRight,
  Loader2,
} from "lucide-react"

interface SearchResult {
  vehicles: Array<{
    Id: string
    LicensePlate: string
    Make: string
    Model: string
    Status: string
    Type: "Vehicle"
  }>
  customers: Array<{
    Id: string
    Name: string
    Phone: string
    Type: "Customer"
  }>
  reservations: Array<{
    Id: string
    CustomerName: string
    VehicleSummary: string
    Status: string
    Type: "Reservation"
  }>
}

interface CommandPaletteProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function CommandPalette({ open, onOpenChange }: CommandPaletteProps) {
  const [query, setQuery] = useState("")
  const router = useRouter()

  const { data: searchResults, isLoading } = useQuery<SearchResult>({
    queryKey: ["search", query],
    queryFn: () => api.get<SearchResult>(`/api/search?q=${encodeURIComponent(query)}&includeReservations=true`),
    enabled: query.length >= 2,
  })

  const handleSelect = useCallback((href: string) => {
    onOpenChange(false)
    setQuery("")
    router.push(href)
  }, [onOpenChange, router])

  useEffect(() => {
    if (!open) setQuery("")
  }, [open])

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <CommandInput
        placeholder="Search vehicles, customers, reservations..."
        value={query}
        onValueChange={setQuery}
      />
      <CommandList>
        {isLoading && (
          <div className="py-6 flex items-center justify-center">
            <Loader2 className="size-4 animate-spin text-muted-foreground" />
          </div>
        )}

        <CommandEmpty>
          {query.length < 2 ? (
            <span className="text-muted-foreground">Type at least 2 characters to search...</span>
          ) : (
            <span>No results found for &quot;{query}&quot;</span>
          )}
        </CommandEmpty>

        {searchResults && (
          <>
            {searchResults.vehicles.length > 0 && (
              <CommandGroup heading="Vehicles">
                {searchResults.vehicles.map((v) => (
                  <CommandItem
                    key={v.Id}
                    value={`${v.LicensePlate} ${v.Make} ${v.Model}`}
                    onSelect={() => handleSelect(`/fleet?vehicle=${v.Id}`)}
                  >
                    <Car className="size-4 text-muted-foreground" />
                    <div className="flex flex-col gap-0.5 flex-1 min-w-0">
                      <span className="font-medium truncate">{v.Make} {v.Model}</span>
                      <span className="text-xs text-muted-foreground font-mono">{v.LicensePlate}</span>
                    </div>
                    <span className="text-xs text-muted-foreground">{v.Status}</span>
                    <ArrowRight className="size-3 opacity-50" />
                  </CommandItem>
                ))}
              </CommandGroup>
            )}

            {searchResults.customers.length > 0 && (
              <CommandGroup heading="Customers">
                {searchResults.customers.map((c) => (
                  <CommandItem
                    key={c.Id}
                    value={`${c.Name} ${c.Phone}`}
                    onSelect={() => handleSelect(`/customers?customer=${c.Id}`)}
                  >
                    <Users className="size-4 text-muted-foreground" />
                    <div className="flex flex-col gap-0.5 flex-1 min-w-0">
                      <span className="font-medium truncate">{c.Name}</span>
                      <span className="text-xs text-muted-foreground font-mono">{c.Phone}</span>
                    </div>
                    <ArrowRight className="size-3 opacity-50" />
                  </CommandItem>
                ))}
              </CommandGroup>
            )}

            {searchResults.reservations && searchResults.reservations.length > 0 && (
              <CommandGroup heading="Reservations">
                {searchResults.reservations.map((r) => (
                  <CommandItem
                    key={r.Id}
                    value={`${r.CustomerName} ${r.VehicleSummary}`}
                    onSelect={() => handleSelect(`/reservations?reservation=${r.Id}`)}
                  >
                    <ClipboardList className="size-4 text-muted-foreground" />
                    <div className="flex flex-col gap-0.5 flex-1 min-w-0">
                      <span className="font-medium truncate">{r.CustomerName}</span>
                      <span className="text-xs text-muted-foreground">{r.VehicleSummary}</span>
                    </div>
                    <span className="text-xs text-muted-foreground">{r.Status}</span>
                    <ArrowRight className="size-3 opacity-50" />
                  </CommandItem>
                ))}
              </CommandGroup>
            )}
          </>
        )}
      </CommandList>

      <CommandSeparator />

      <CommandGroup heading="Quick Actions">
        <CommandItem onSelect={() => handleSelect("/reservations?new=true")}>
          <Plus className="size-4 text-muted-foreground" />
          <span>New Inquiry</span>
          <CommandShortcut>⌘N</CommandShortcut>
        </CommandItem>
        <CommandItem onSelect={() => handleSelect("/fleet?add=true")}>
          <Plus className="size-4 text-muted-foreground" />
          <span>Add Vehicle</span>
        </CommandItem>
        <CommandItem onSelect={() => handleSelect("/inspections?new=true")}>
          <ClipboardList className="size-4 text-muted-foreground" />
          <span>Start Inspection</span>
        </CommandItem>
        <CommandItem onSelect={() => handleSelect("/customers?new=true")}>
          <Users className="size-4 text-muted-foreground" />
          <span>Add Customer</span>
        </CommandItem>
        <CommandSeparator />
        <CommandItem onSelect={() => handleSelect("/events")}>
          <Calendar className="size-4 text-muted-foreground" />
          <span>View Events</span>
        </CommandItem>
        <CommandItem onSelect={() => handleSelect("/settings")}>
          <Settings className="size-4 text-muted-foreground" />
          <span>Settings</span>
        </CommandItem>
      </CommandGroup>
    </CommandDialog>
  )
}

export function useCommandPalette() {
  const [open, setOpen] = useState(false)

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setOpen((prev) => !prev)
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [])

  return { open, setOpen }
}
