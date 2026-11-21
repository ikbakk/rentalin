"use client"

import { useSidebar } from "@/components/shared/sidebar-context"
import { cn } from "@/lib/utils"
import { BusinessSwitcher } from "./business-switcher"
import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useAuthActions } from "@convex-dev/auth/react"
import { Button } from "@/components/ui/button"
import { User, LogOut, Loader2 } from "lucide-react"
import { toast } from "sonner"

export function AppShell({ children }: { children: React.ReactNode }) {
  const { collapsed } = useSidebar()
  const { signOut } = useAuthActions()
  const router = useRouter()
  const [signingOut, setSigningOut] = useState(false)

  const handleSignOut = async () => {
    setSigningOut(true)
    try {
      await signOut()
      router.replace("/login")
    } catch {
      toast.error("Unable to sign out. Please try again.")
      setSigningOut(false)
    }
  }

  return (
    <>
      <main
      className={cn(
        "workspace min-w-0 flex-1 pb-[calc(5.5rem+env(safe-area-inset-bottom))] lg:pb-0 md:pl-[72px] md:pb-0 transition-[padding] duration-200",
        collapsed ? "lg:pl-16" : "lg:pl-60"
      )}
    >
        <div className="flex min-h-12 items-center justify-between gap-2 lg:justify-end bg-card px-4 pt-3 pb-1 sm:px-6 sm:pt-4">
          <span className="hidden shrink-0 text-base sm:inline font-bold tracking-tight lg:hidden">rentalin<span className="text-accent">.</span></span>
          <BusinessSwitcher />
          <div className="flex shrink-0 items-center gap-1 border-l border-border pl-2">
            <Link href="/settings" aria-label="Account settings" title="Account settings" className="inline-flex size-10 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
              <User className="size-4" />
            </Link>
            <Button variant="ghost" size="icon" className="size-10 text-muted-foreground" aria-label="Sign out" title="Sign out" disabled={signingOut} onClick={handleSignOut}>
              {signingOut ? <Loader2 className="size-4 animate-spin" /> : <LogOut className="size-4" />}
            </Button>
          </div>
        </div>
        {children}
      </main>
    </>
  )
}
