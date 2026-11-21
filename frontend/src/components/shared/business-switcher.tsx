"use client"

import { useActiveBusiness, useBusinesses, useSelectBusiness } from "@/hooks/use-active-business"

export function BusinessSwitcher() {
  const { businessId } = useActiveBusiness()
  const businesses = useBusinesses()
  const selectBusiness = useSelectBusiness()

  if (!businesses?.length) return null

  return (
    <label className="flex min-w-0 max-w-[72%] items-center gap-1.5 rounded-md border border-transparent bg-transparent px-2.5 py-1.5 text-xs transition-colors hover:bg-muted focus-within:border-ring sm:gap-2 sm:px-3 sm:py-2 sm:text-sm">
      <span className="hidden shrink-0 text-muted-foreground min-[360px]:inline">Business</span>
      <select
        value={businessId ?? ""}
        onChange={(event) => void selectBusiness({ businessId: event.target.value as never })}
        className="min-w-0 max-w-[min(12rem,58vw)] truncate bg-transparent font-medium outline-none"
        aria-label="Active business"
      >
        {businesses.map((business) => (
          <option key={business?._id} value={business?._id}>{business?.name}</option>
        ))}
      </select>
    </label>
  )
}
