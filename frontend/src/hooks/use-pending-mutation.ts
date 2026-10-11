"use client"

import { useState } from "react"

export function usePendingMutation<Args, Result>(
  mutation: (args: Args) => Promise<Result>,
) {
  const [isPending, setIsPending] = useState(false)

  const mutateAsync = async (args: Args) => {
    setIsPending(true)
    try {
      return await mutation(args)
    } finally {
      setIsPending(false)
    }
  }

  return { mutateAsync, isPending }
}
