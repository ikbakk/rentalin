"use client"

import { CommandPalette, useCommandPalette } from "@/components/shared/command-palette"
import { cn } from "@/lib/utils"

export function CommandPaletteWrapper() {
  const { open, setOpen } = useCommandPalette()

  return (
    <>
      <CommandPalette open={open} onOpenChange={setOpen} />
      <button
        onClick={() => setOpen(true)}
        aria-label="Open search"
        className={cn(
          "fixed bottom-24 left-1/2 z-50 flex -translate-x-1/2 items-center gap-2 rounded-lg",
          "bg-muted/80 backdrop-blur px-3 py-1.5 text-sm text-muted-foreground",
          "border border-border shadow-sm",
          "hover:bg-muted transition-colors",
          "md:bottom-4 md:left-auto md:right-4 md:translate-x-0 lg:right-20"
        )}
      >
        <div className="flex items-center gap-1">
          <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-xs font-medium text-muted-foreground">
            <span className="text-xs">⌘</span>K
          </kbd>
        </div>
        <span className="hidden sm:inline">Search</span>
      </button>
    </>
  )
}
