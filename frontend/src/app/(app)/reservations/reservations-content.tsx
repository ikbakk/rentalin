"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useInquiries, useConfirmInquiry } from "@/hooks/use-inquiries"
import { useReservations, useStartRental, useRentals, useCompleteRental } from "@/hooks/use-reservations"
import { InquiryCard } from "./inquiry-card"
import { ReservationCard } from "./reservation-card"
import { RentalCard } from "./rental-card"
import { NewInquiryDialog } from "./new-inquiry-dialog"
import { StartRentalDialog } from "./start-rental-dialog"
import { CompleteRentalDialog } from "./complete-rental-dialog"
import { EmptyState } from "@/components/shared/empty-state"
import { ListSkeleton } from "@/components/shared/loading-skeleton"
import { Plus, MessageSquare, Calendar, Car } from "lucide-react"
import { cn } from "@/lib/utils"

type Tab = "inquiries" | "reservations" | "rentals"

export function ReservationsContent() {
  const [tab, setTab] = useState<Tab>("inquiries")
  const [newOpen, setNewOpen] = useState(false)
  const [startOpen, setStartOpen] = useState<string | null>(null)
  const [completeOpen, setCompleteOpen] = useState<string | null>(null)

  const { data: inquiries, isLoading: iLoading } = useInquiries()
  const confirmInquiry = useConfirmInquiry()
  const { data: reservations, isLoading: rLoading } = useReservations()
  const startRental = useStartRental()
  const { data: rentals, isLoading: aLoading } = useRentals()
  const completeRental = useCompleteRental()

  const tabs: { key: Tab; label: string; icon: typeof MessageSquare }[] = [
    { key: "inquiries", label: "Inquiries", icon: MessageSquare },
    { key: "reservations", label: "Reservations", icon: Calendar },
    { key: "rentals", label: "Rentals", icon: Car },
  ]

  const stats = {
    inquiries: inquiries?.filter(i => i.status === "New").length ?? 0,
    reservations: reservations?.filter(r => r.status === "Confirmed").length ?? 0,
    rentals: rentals?.filter(r => r.status === "Active").length ?? 0,
  }

  return (
    <div className="flex flex-col pb-20 lg:pb-6">
      <div className="px-4 py-4 lg:px-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-wrap items-center gap-6">
            <div className="flex items-center gap-2">
              <div className="flex size-9 items-center justify-center rounded-lg bg-amber-500/10">
                <MessageSquare className="size-4 text-amber-600 dark:text-amber-400" />
              </div>
              <div>
                <p className="font-mono text-lg font-bold">{stats.inquiries}</p>
                <p className="text-xs text-muted-foreground">New</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex size-9 items-center justify-center rounded-lg bg-blue-500/10">
                <Calendar className="size-4 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="font-mono text-lg font-bold">{stats.reservations}</p>
                <p className="text-xs text-muted-foreground">Confirmed</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex size-9 items-center justify-center rounded-lg bg-emerald-500/10">
                <Car className="size-4 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div>
                <p className="font-mono text-lg font-bold">{stats.rentals}</p>
                <p className="text-xs text-muted-foreground">Active</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="border-b border-border/50 px-4 lg:px-6">
        <div className="flex gap-1">
          {tabs.map(t => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={cn(
                "relative flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors",
                tab === t.key ? "font-semibold text-foreground" : "text-muted-foreground hover:text-foreground"
              )}
            >
              <t.icon className="size-4" />
              {t.label}
              {stats[t.key] > 0 && (
                <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-xs">
                  {stats[t.key]}
                </Badge>
              )}
              {tab === t.key && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />
              )}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 p-4 lg:p-6">
        {tab === "inquiries" && (
          <div className="flex flex-col gap-3">
            {iLoading ? (
              <ListSkeleton count={3} />
            ) : inquiries?.length ? (
              inquiries.map((i, idx) => (
                <div key={i.id} className={cn("animate-fade-up", `stagger-${(idx % 8) + 1}`)}>
                  <InquiryCard inquiry={i} onConfirm={() => confirmInquiry.mutate(i.id)} />
                </div>
              ))
            ) : (
              <EmptyState
                title="No inquiries"
                description="Create your first customer inquiry to get started"
                action={{ label: "New Inquiry", onClick: () => setNewOpen(true) }}
              />
            )}
          </div>
        )}

        {tab === "reservations" && (
          <div className="flex flex-col gap-3">
            {rLoading ? (
              <ListSkeleton count={3} />
            ) : reservations?.length ? (
              reservations.map((r, idx) => (
                <div key={r.id} className={cn("animate-fade-up", `stagger-${(idx % 8) + 1}`)}>
                  <ReservationCard reservation={r} onStart={() => setStartOpen(r.id)} />
                </div>
              ))
            ) : (
              <EmptyState
                title="No reservations"
                description="Confirm an inquiry to create a reservation"
              />
            )}
          </div>
        )}

        {tab === "rentals" && (
          <div className="flex flex-col gap-3">
            {aLoading ? (
              <ListSkeleton count={3} />
            ) : rentals?.length ? (
              rentals.map((r, idx) => (
                <div key={r.id} className={cn("animate-fade-up", `stagger-${(idx % 8) + 1}`)}>
                  <RentalCard rental={r} onComplete={() => setCompleteOpen(r.id)} />
                </div>
              ))
            ) : (
              <EmptyState
                title="No active rentals"
                description="Start a reservation to begin a rental"
              />
            )}
          </div>
        )}
      </div>

      {tab === "inquiries" && (
        <Button
          className="fixed bottom-20 right-4 size-14 rounded-2xl shadow-lg lg:bottom-6"
          onClick={() => setNewOpen(true)}
          size="icon"
          aria-label="New inquiry"
        >
          <Plus className="size-5" />
        </Button>
      )}

      <NewInquiryDialog open={newOpen} onOpenChange={setNewOpen} />
      <StartRentalDialog open={!!startOpen} reservationId={startOpen} onClose={() => setStartOpen(null)} mutate={startRental} />
      <CompleteRentalDialog open={!!completeOpen} rentalId={completeOpen} onClose={() => setCompleteOpen(null)} mutate={completeRental} />
    </div>
  )
}
