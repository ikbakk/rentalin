export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col bg-background text-foreground">
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 sm:px-6">{children}</main>
      <footer className="border-t border-border/60">
        <div className="mx-auto w-full max-w-5xl px-4 py-6 sm:px-6">
          <p className="text-center text-xs text-muted-foreground">
            Powered by <span className="font-semibold text-foreground">Rentalin</span> — vehicle
            rental, simplified
          </p>
        </div>
      </footer>
    </div>
  )
}
