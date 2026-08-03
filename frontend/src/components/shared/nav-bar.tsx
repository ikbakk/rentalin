"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { LayoutList, Car, ClipboardList, Users, History, Settings } from "lucide-react"
import { cn } from "@/lib/utils"

const links = [
  { href: "/operations", label: "Ops", icon: LayoutList },
  { href: "/fleet", label: "Fleet", icon: Car },
  { href: "/reservations", label: "Resv", icon: ClipboardList },
  { href: "/inspections", label: "Insp", icon: ClipboardList },
  { href: "/customers", label: "Cust", icon: Users },
  { href: "/events", label: "Events", icon: History },
  { href: "/settings", label: "Settings", icon: Settings },
]

export function NavBar() {
  const pathname = usePathname()

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-border bg-card md:hidden">
      <div className="mx-auto flex max-w-lg h-14">
        {links.map(({ href, label, icon: Icon }) => {
          const active = pathname.startsWith(href)
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex flex-1 flex-col items-center justify-center gap-0.5 text-[11px] font-medium transition-colors",
                active ? "text-primary" : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Icon className={cn("size-5", active && "text-primary")} />
              <span>{label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
