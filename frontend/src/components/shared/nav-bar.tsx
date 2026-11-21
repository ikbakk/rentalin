"use client"

import { useState } from "react"
import { Sheet, SheetContent, SheetTitle, SheetDescription } from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { LayoutList, Car, ClipboardList, Users, History, Settings, Menu } from "lucide-react"
import { cn } from "@/lib/utils"

const links = [
  { href: "/operations", label: "Today", icon: LayoutList },
  { href: "/fleet", label: "Fleet", icon: Car },
  { href: "/reservations", label: "Reservations", icon: ClipboardList },
  { href: "/inspections", label: "Insp", icon: ClipboardList },
  { href: "/customers", label: "Cust", icon: Users },
  { href: "/events", label: "Events", icon: History },
  { href: "/settings", label: "Settings", icon: Settings },
]

export function NavBar() {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)
  const secondary = links.slice(3)
  const moreActive = open || secondary.some(link => pathname.startsWith(link.href))

  return (
    <nav aria-label="Main navigation" className="fixed inset-x-3 bottom-[max(0.75rem,env(safe-area-inset-bottom))] z-40 mx-auto max-w-lg rounded-2xl border border-border bg-card p-1.5 shadow-lg md:hidden">
      <div className="flex h-14 gap-1">
        {links.slice(0, 3).map(({ href, label, icon: Icon }) => {
          const active = pathname.startsWith(href)
          return (
            <Link
              key={href}
              href={href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "flex min-w-0 flex-1 flex-col items-center justify-center gap-1 rounded-xl text-[11px] font-medium transition-colors duration-150 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
                active ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              <Icon className="size-5" strokeWidth={active ? 2 : 1.6} />
              <span className="max-w-full truncate">{label}</span>
            </Link>
          )
        })}
        <Button variant="ghost" onClick={() => setOpen(true)} aria-label="More navigation" aria-haspopup="dialog" aria-expanded={open} className={cn("h-full min-w-0 flex-1 flex-col gap-1 rounded-xl px-1 text-[11px] font-medium transition-colors duration-150", moreActive ? "bg-primary text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground" : "text-muted-foreground hover:bg-muted hover:text-foreground")}><Menu className="size-5" strokeWidth={moreActive ? 2 : 1.6} />More</Button>
      </div>
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="bottom" className="rounded-t-2xl p-5 pb-[max(1.25rem,env(safe-area-inset-bottom))]">
          <SheetTitle>More from your workspace</SheetTitle>
          <SheetDescription>Inspections, customer records and business tools.</SheetDescription>
          <div className="grid grid-cols-2 gap-2">
            {secondary.map(({href, label, icon: Icon}) => <Link key={href} href={href} onClick={() => setOpen(false)} aria-current={pathname.startsWith(href) ? "page" : undefined} className={cn("flex min-h-14 items-center gap-3 rounded-lg border border-border px-3 py-3 text-sm transition-colors hover:bg-muted focus-visible:outline-2 focus-visible:outline-ring", pathname.startsWith(href) && "bg-primary/10 text-primary")}><Icon className="size-5" />{label === "Insp" ? "Inspections" : label === "Cust" ? "Customers" : label}</Link>)}
          </div>
        </SheetContent>
      </Sheet>
    </nav>
  )
}
