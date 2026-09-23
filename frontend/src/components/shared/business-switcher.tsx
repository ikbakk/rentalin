"use client"

import { useActiveBusiness, useBusinesses, useSelectBusiness } from "@/hooks/use-active-business"

export function BusinessSwitcher() {
  const { businessId } = useActiveBusiness()
  const businesses = useBusinesses()
  const selectBusiness = useSelectBusiness()

  if (!businesses?.length) return null

  return (
    <label className="fixed right-4 top-4 z-40 flex items-center gap-2 rounded-lg border bg-card px-3 py-2 text-sm shadow-sm">
      <span className="text-muted-foreground">Business</span>
      <select
        value={businessId ?? ""}
        onChange={(event) => void selectBusiness({ businessId: event.target.value as never })}
        className="bg-transparent font-medium outline-none"
        aria-label="Active business"
      >
        {businesses.map((business) => (
          <option key={business?._id} value={business?._id}>{business?.name}</option>
        ))}
      </select>
    </label>
  )
}
