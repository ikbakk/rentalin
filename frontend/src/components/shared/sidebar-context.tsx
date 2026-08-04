"use client"

import { createContext, useContext, useState, type ReactNode } from "react"

const SIDEBAR_STORAGE_KEY = "sidebar-collapsed"

interface SidebarContextValue {
  collapsed: boolean
  toggle: () => void
}

const SidebarContext = createContext<SidebarContextValue | null>(null)

export function SidebarProvider({ children }: { children: ReactNode }) {
  const [collapsed, setCollapsed] = useState(() => {
    if (typeof window === "undefined") return false
    return localStorage.getItem(SIDEBAR_STORAGE_KEY) === "true"
  })

  const toggle = () => {
    setCollapsed((prev) => {
      localStorage.setItem(SIDEBAR_STORAGE_KEY, String(!prev))
      return !prev
    })
  }

  return <SidebarContext.Provider value={{ collapsed, toggle }}>{children}</SidebarContext.Provider>
}

export function useSidebar() {
  const context = useContext(SidebarContext)
  if (!context) {
    throw new Error("useSidebar must be used within a SidebarProvider")
  }
  return context
}
