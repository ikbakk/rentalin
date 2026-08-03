"use client"

import * as React from "react"
import { Tabs as BaseUITabs } from "@base-ui/react/tabs"

import { cn } from "@/lib/utils"

const Tabs = BaseUITabs.Root

const TabsList = React.forwardRef<
  React.ComponentRef<typeof BaseUITabs.List>,
  React.ComponentPropsWithoutRef<typeof BaseUITabs.List>
>(({ className, ...props }, ref) => (
  <BaseUITabs.List
    ref={ref}
    className={cn(
      "inline-flex h-10 items-center justify-center rounded-lg bg-muted p-1 text-muted-foreground",
      className
    )}
    {...props}
  />
))
TabsList.displayName = "TabsList"

const TabsTrigger = React.forwardRef<
  React.ComponentRef<typeof BaseUITabs.Tab>,
  React.ComponentPropsWithoutRef<typeof BaseUITabs.Tab>
>(({ className, ...props }, ref) => (
  <BaseUITabs.Tab
    ref={ref}
    className={cn(
      "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md px-3 py-1.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[selected]:bg-background data-[selected]:text-foreground data-[selected]:shadow-sm",
      className
    )}
    {...props}
  />
))
TabsTrigger.displayName = "TabsTrigger"

const TabsContent = React.forwardRef<
  React.ComponentRef<typeof BaseUITabs.Panel>,
  React.ComponentPropsWithoutRef<typeof BaseUITabs.Panel>
>(({ className, ...props }, ref) => (
  <BaseUITabs.Panel
    ref={ref}
    className={cn(
      "mt-2 ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
      className
    )}
    {...props}
  />
))
TabsContent.displayName = "TabsContent"

export { Tabs, TabsList, TabsTrigger, TabsContent }
