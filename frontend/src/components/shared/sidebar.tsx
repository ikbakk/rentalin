"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { LayoutList, Car, ClipboardList, Users, History, Settings, ChevronLeft, ChevronRight } from "lucide-react"
import { cn } from "@/lib/utils"
import { useSidebar } from "@/components/shared/sidebar-context"

const workLinks = [
  { href: "/operations", label: "Operations", icon: LayoutList },
  { href: "/fleet", label: "Fleet", icon: Car },
  { href: "/reservations", label: "Reservations", icon: ClipboardList },
  { href: "/inspections", label: "Inspections", icon: ClipboardList },
]

const managementLinks = [
  { href: "/customers", label: "Customers", icon: Users },
  { href: "/events", label: "Events", icon: History },
  { href: "/settings", label: "Settings", icon: Settings },
]

export function Sidebar() {
  const pathname = usePathname()
  const { collapsed, toggle } = useSidebar()

  return (
    <aside
      className={cn(
        "fixed left-0 top-0 z-40 hidden h-dvh flex-col border-r border-border bg-card transition-all duration-200 lg:flex",
        collapsed ? "w-16" : "w-60"
      )}
    >
      <div className={cn("flex h-14 items-center border-b border-border px-4", collapsed && "justify-center px-2")}>
        {!collapsed && (
          <span className="font-mono text-lg font-bold tracking-tight">Rentalin</span>
        )}
        {collapsed && (
          <span className="font-mono text-lg font-bold tracking-tight">R</span>
        )}
      </div>

      <nav className="flex-1 overflow-y-auto p-3">
        <div className="space-y-1">
          {!collapsed && (
            <p className="px-3 pb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Work
            </p>
          )}
          {workLinks.map(({ href, label, icon: Icon }) => {
            const active = pathname.startsWith(href)
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                  active
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground",
                  collapsed && "justify-center px-2"
                )}
              >
                <Icon className={cn("size-5 shrink-0", active && "text-primary-foreground")} />
                {!collapsed && <span>{label}</span>}
              </Link>
            )
          })}
        </div>

        <div className="mt-6 space-y-1">
          {!collapsed && (
            <p className="px-3 pb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Management
            </p>
          )}
          {managementLinks.map(({ href, label, icon: Icon }) => {
            const active = pathname.startsWith(href)
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                  active
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground",
                  collapsed && "justify-center px-2"
                )}
              >
                <Icon className={cn("size-5 shrink-0", active && "text-primary-foreground")} />
                {!collapsed && <span>{label}</span>}
              </Link>
            )
          })}
        </div>
      </nav>

      <div className="border-t border-border p-3">
        <button
          onClick={toggle}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          {collapsed ? <ChevronRight className="size-5" /> : <ChevronLeft className="size-5" />}
          {!collapsed && <span>Collapse</span>}
        </button>
      </div>
    </aside>
  )
}

export function NavRail() {
  const pathname = usePathname()

  const allLinks = [...workLinks, ...managementLinks]

  return (
    <nav className="fixed left-0 top-0 z-40 hidden h-dvh w-[72px] flex-col items-center border-r border-border bg-card md:flex lg:hidden">
      <div className="flex h-14 items-center justify-center border-b border-border">
        <span className="font-mono text-lg font-bold tracking-tight">R</span>
      </div>

      <div className="flex flex-1 flex-col items-center gap-2 py-4">
        {allLinks.map(({ href, label, icon: Icon }) => {
          const active = pathname.startsWith(href)
          return (
            <Link
              key={href}
              href={href}
              title={label}
              className={cn(
                "flex flex-col items-center gap-1 rounded-lg px-2 py-2 text-[10px] font-medium transition-colors",
                active
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              <Icon className={cn("size-5", active && "text-primary")} />
              <span className="truncate">{label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
