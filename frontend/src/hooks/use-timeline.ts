"use client";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { useActiveBusiness } from "./use-active-business";
import type { TimelineEntryResponse } from "@/lib/types";
export function useTimeline() { const { businessId } = useActiveBusiness(); const data = useQuery(api.dashboard.timeline, businessId ? { businessId } : "skip"); return { data: data?.map((item): TimelineEntryResponse => ({ id: item._id, referenceType: item.referenceType, referenceId: item.referenceId, eventType: item.eventType, description: item.description, occurredAt: item.occurredAt, actor: item.actor })), isLoading: data === undefined, isError: false }; }
