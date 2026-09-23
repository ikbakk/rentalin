"use client";

import { useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { toast } from "sonner";
import { useState } from "react";
import type { BusinessResponse, UpdateBusinessRequest } from "@/lib/types";

export function useUpdateBusiness() {
  const update = useMutation(api.businesses.updateByExternalId);
  const [isPending, setIsPending] = useState(false);

  const mutateAsync = async (request: UpdateBusinessRequest) => {
    setIsPending(true);
    try {
      const business = await update({
        externalId: request.id,
        name: request.name,
        address: request.address,
        phone: request.phoneNumber,
        email: request.email,
      });
      return business as unknown as BusinessResponse;
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to update business";
      toast.error(message);
      throw error;
    } finally {
      setIsPending(false);
    }
  };

  return { mutateAsync, isPending };
}
