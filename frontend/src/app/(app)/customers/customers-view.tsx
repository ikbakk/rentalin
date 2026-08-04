"use client"

import { useState, useMemo } from "react"
import { useCustomers } from "@/hooks/use-customers"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { EmptyState } from "@/components/shared/empty-state"
import { ListSkeleton } from "@/components/shared/loading-skeleton"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Search, User, Mail, Phone, MessageSquare, ArrowUpDown } from "lucide-react"
import { cn } from "@/lib/utils"
import { useRouter } from "next/navigation"
import type { CustomerResponse } from "@/lib/types"

type SortKey = "name" | "phoneNumber" | "email"
type SortDir = "asc" | "desc"

export function CustomersView() {
  const { data: customers, isLoading } = useCustomers()
  const router = useRouter()
  const [search, setSearch] = useState("")
  const [sortKey, setSortKey] = useState<SortKey>("name")
  const [sortDir, setSortDir] = useState<SortDir>("asc")

  const filtered = useMemo(() => {
    if (!customers) return []
    if (!search) return customers

    const q = search.toLowerCase()
    return customers.filter(c =>
      c.name.toLowerCase().includes(q) ||
      c.phoneNumber.toLowerCase().includes(q) ||
      c.email?.toLowerCase().includes(q)
    )
  }, [customers, search])

  const sorted = useMemo(() => {
    return [...filtered].sort((a, b) => {
      let aVal = ""
      let bVal = ""

      switch (sortKey) {
        case "name": aVal = a.name; bVal = b.name; break
        case "phoneNumber": aVal = a.phoneNumber; bVal = b.phoneNumber; break
        case "email": aVal = a.email || ""; bVal = b.email || ""; break
      }

      if (aVal < bVal) return sortDir === "asc" ? -1 : 1
      if (aVal > bVal) return sortDir === "asc" ? 1 : -1
      return 0
    })
  }, [filtered, sortKey, sortDir])

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir(prev => prev === "asc" ? "desc" : "asc")
    } else {
      setSortKey(key)
      setSortDir("asc")
    }
  }

  if (isLoading) {
    return (
      <div className="p-4 lg:p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="h-8 w-48 animate-pulse rounded-lg bg-muted" />
          <div className="h-10 w-full max-w-md animate-pulse rounded-xl bg-muted" />
        </div>
        <div className="mt-6 space-y-3">
          {[1, 2, 3, 4].map(i => <div key={i} className="h-20 animate-pulse rounded-xl bg-muted" />)}
        </div>
      </div>
    )
  }

  if (!customers?.length) {
    return (
      <div className="flex flex-col items-center justify-center p-6">
        <EmptyState
          title="No customers yet"
          description="Customer contacts will appear when you create inquiries"
        />
      </div>
    )
  }

  return (
    <div className="flex flex-col pb-20 lg:pb-6">
      <div className="px-4 py-4 lg:px-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search customers..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="h-10 w-full pl-9 lg:w-64 rounded-xl bg-muted/50"
            />
          </div>
        </div>
      </div>

      <div className="hidden lg:block px-6">
        <Card>
          <CardHeader className="border-b py-3 px-4">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                className="h-8 gap-1 px-2"
                onClick={() => handleSort("name")}
              >
                Name
                <ArrowUpDown className={cn("size-3", sortKey === "name" ? "text-primary" : "text-muted-foreground")} />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 gap-1 px-2"
                onClick={() => handleSort("phoneNumber")}
              >
                Phone
                <ArrowUpDown className={cn("size-3", sortKey === "phoneNumber" ? "text-primary" : "text-muted-foreground")} />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 gap-1 px-2"
                onClick={() => handleSort("email")}
              >
                Email
                <ArrowUpDown className={cn("size-3", sortKey === "email" ? "text-primary" : "text-muted-foreground")} />
              </Button>
              <div className="ml-auto">
                <span className="text-xs text-muted-foreground">Notes</span>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableBody>
                {sorted.map(c => (
                  <TableRow key={c.id} className="cursor-pointer hover:bg-muted/50" onClick={() => router.push(`/customers/${c.id}`)}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="flex size-9 items-center justify-center rounded-full bg-primary/10">
                          <User className="size-4 text-primary" />
                        </div>
                        <span className="font-medium">{c.name}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1.5">
                        <Phone className="size-3.5 text-muted-foreground" />
                        <span className="font-mono text-sm">{c.phoneNumber}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      {c.email ? (
                        <div className="flex items-center gap-1.5">
                          <Mail className="size-3.5 text-muted-foreground" />
                          <span className="text-sm">{c.email}</span>
                        </div>
                      ) : (
                        <span className="text-sm text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {c.notes && (
                        <div className="flex items-center gap-1.5 max-w-[200px]">
                          <MessageSquare className="size-3.5 shrink-0 text-muted-foreground" />
                          <span className="text-xs text-muted-foreground truncate">{c.notes}</span>
                        </div>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-col gap-3 px-4 lg:hidden">
        {sorted.map((c, i) => (
          <CustomerCard key={c.id} customer={c} index={i} />
        ))}
        {sorted.length === 0 && (
          <div className="py-8 text-center text-sm text-muted-foreground">
            No customers match your search
          </div>
        )}
      </div>
    </div>
  )
}

function CustomerCard({ customer, index }: { customer: CustomerResponse; index: number }) {
  return (
    <Card className={cn("animate-fade-up", `stagger-${(index % 8) + 1}`)}>
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <div className="flex size-12 items-center justify-center rounded-xl bg-primary/10 shrink-0">
            <span className="text-lg font-semibold text-primary">{customer.name.charAt(0).toUpperCase()}</span>
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2">
              <h3 className="font-semibold truncate">{customer.name}</h3>
            </div>
            <div className="mt-1.5 flex flex-col gap-1">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Phone className="size-3.5 shrink-0" />
                <span className="font-mono">{customer.phoneNumber}</span>
              </div>
              {customer.email && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Mail className="size-3.5 shrink-0" />
                  <span className="truncate">{customer.email}</span>
                </div>
              )}
            </div>
            {customer.notes && (
              <div className="mt-2 flex items-start gap-1.5 rounded-lg bg-muted/50 p-2">
                <MessageSquare className="size-3.5 mt-0.5 shrink-0 text-muted-foreground" />
                <p className="text-xs text-muted-foreground">{customer.notes}</p>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
