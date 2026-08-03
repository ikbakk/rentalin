import { NavBar } from "@/components/shared/nav-bar"
import { Sidebar, NavRail } from "@/components/shared/sidebar"
import { Toaster } from "@/components/ui/sonner"
import { AuthGuard } from "@/components/shared/auth-guard"
import { CommandPaletteWrapper } from "@/components/shared/command-palette-wrapper"

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGuard>
      <div className="flex min-h-dvh flex-col">
        <Sidebar />
        <NavRail />
        <main className="flex-1 pb-16 lg:pl-60 lg:pb-0 md:pl-[72px] md:pb-0">
          {children}
        </main>
        <NavBar />
        <Toaster />
        <CommandPaletteWrapper />
      </div>
    </AuthGuard>
  )
}
