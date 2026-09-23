"use client"

import { useSidebar } from "@/components/shared/sidebar-context"
import { cn } from "@/lib/utils"
import { BusinessSwitcher } from "./business-switcher"

export function AppShell({ children }: { children: React.ReactNode }) {
  const { collapsed } = useSidebar()

  return (
    <>
      <BusinessSwitcher />
      <main
      className={cn(
        "flex-1 pb-16 lg:pb-0 md:pl-[72px] md:pb-0 transition-[padding] duration-200",
        collapsed ? "lg:pl-16" : "lg:pl-60"
      )}
    >
        {children}
      </main>
    </>
  )
}
