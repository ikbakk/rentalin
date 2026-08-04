"use client"

import { CommandPalette, useCommandPalette } from "@/components/shared/command-palette"

export function CommandPaletteWrapper() {
  const { open, setOpen } = useCommandPalette()

  return (
    <>
      <CommandPalette open={open} onOpenChange={setOpen} />
    </>
  )
}
