"use client"

import { useCustomers } from "@/hooks/use-customers"
import { Card, CardContent } from "@/components/ui/card"
import { EmptyState } from "@/components/shared/empty-state"
import { ListSkeleton } from "@/components/shared/loading-skeleton"
import { cn } from "@/lib/utils"

const stagger = ["stagger-1", "stagger-2", "stagger-3", "stagger-4"]

export function CustomersList() {
  const { data: customers, isLoading } = useCustomers()

  if (isLoading) return <ListSkeleton count={3} />
  if (!customers?.length) return <EmptyState title="No customers" description="Customer contacts will appear here" />

  return (
    <div className="flex flex-col gap-3 p-4">
      {customers.map((c, i) => (
        <Card key={c.id} className={cn("animate-slide-up", stagger[i % stagger.length])}>
          <CardContent className="flex flex-col gap-1 p-4">
            <span className="font-semibold">{c.name}</span>
            <span className="font-mono text-sm text-muted-foreground">{c.phoneNumber}</span>
            {c.email && <span className="text-sm text-muted-foreground">{c.email}</span>}
            {c.notes && <span className="text-sm text-muted-foreground border-l-2 border-primary/30 pl-2 mt-1 italic">{c.notes}</span>}
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
