"use client";

import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { getAuth } from "@/lib/auth";
import type { TimelineEntryResponse } from "@/lib/types";

export function useTimeline() {
  const externalId = getAuth()?.businessId;
  const data = useQuery(api.dashboard.timeline, externalId ? { externalId } : "skip");
  return {
    data: data?.map((item): TimelineEntryResponse => ({ id: item._id, referenceType: item.referenceType, referenceId: item.referenceId, eventType: item.eventType, description: item.description, occurredAt: item.occurredAt, actor: item.actor })),
    isLoading: data === undefined,
    isError: false,
  };
}
