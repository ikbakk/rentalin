import { NavBar } from "@/components/shared/nav-bar"
import { Sidebar, NavRail } from "@/components/shared/sidebar"
import { Toaster } from "@/components/ui/sonner"
import { AuthGuard } from "@/components/shared/auth-guard"
import { CommandPaletteWrapper } from "@/components/shared/command-palette-wrapper"
import { SidebarProvider } from "@/components/shared/sidebar-context"
import { AppShell } from "@/components/shared/app-shell"

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGuard>
      <SidebarProvider>
        <div className="flex min-h-dvh flex-col">
          <Sidebar />
          <NavRail />
          <AppShell>{children}</AppShell>
          <NavBar />
          <Toaster />
          <CommandPaletteWrapper />
        </div>
      </SidebarProvider>
    </AuthGuard>
  )
}
