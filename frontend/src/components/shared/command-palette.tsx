"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { useQuery } from "@tanstack/react-query"
import { api } from "@/lib/api"
import {
  Command,
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
    id: string
    licensePlate: string
    make: string
    model: string
    status: string
    type: "Vehicle"
  }>
  customers: Array<{
    id: string
    name: string
    phone: string
    type: "Customer"
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

  const handleOpenChange = useCallback((next: boolean) => {
    onOpenChange(next)
    if (!next) setQuery("")
  }, [onOpenChange])

  return (
    <CommandDialog open={open} onOpenChange={handleOpenChange}>
      <Command shouldFilter={false}>
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

          {query.length >= 2 && searchResults && (
            <>
              {searchResults.vehicles.length === 0 && searchResults.customers.length === 0 && (
                <CommandEmpty>
                  <span>No results found for &quot;{query}&quot;</span>
                </CommandEmpty>
              )}

              {searchResults.vehicles.length > 0 && (
                <CommandGroup heading="Vehicles">
                  {searchResults.vehicles.map((v) => (
                    <CommandItem
                      key={v.id}
                      value={`${v.licensePlate} ${v.make} ${v.model}`}
                      onSelect={() => handleSelect(`/fleet?vehicle=${v.id}`)}
                    >
                      <Car className="size-4 text-muted-foreground" />
                      <div className="flex flex-col gap-0.5 flex-1 min-w-0">
                        <span className="font-medium truncate">{v.make} {v.model}</span>
                        <span className="text-xs text-muted-foreground font-mono">{v.licensePlate}</span>
                      </div>
                      <span className="text-xs text-muted-foreground">{v.status}</span>
                      <ArrowRight className="size-3 opacity-50" />
                    </CommandItem>
                  ))}
                </CommandGroup>
              )}

              {searchResults.customers.length > 0 && (
                <CommandGroup heading="Customers">
                  {searchResults.customers.map((c) => (
                    <CommandItem
                      key={c.id}
                      value={`${c.name} ${c.phone}`}
                      onSelect={() => handleSelect(`/customers?customer=${c.id}`)}
                    >
                      <Users className="size-4 text-muted-foreground" />
                      <div className="flex flex-col gap-0.5 flex-1 min-w-0">
                        <span className="font-medium truncate">{c.name}</span>
                        <span className="text-xs text-muted-foreground font-mono">{c.phone}</span>
                      </div>
                      <ArrowRight className="size-3 opacity-50" />
                    </CommandItem>
                  ))}
                </CommandGroup>
              )}
            </>
          )}
        </CommandList>

        {query.length < 2 && (
          <>
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
          </>
        )}
      </Command>
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
