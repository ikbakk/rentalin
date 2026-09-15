"use client";

import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";

export interface PublicBusiness {
  name: string;
  slug: string;
  address: string;
  phone: string;
  email: string;
  logoUrl: string | null;
}

export function usePublicBusiness(slug: string) {
  const business = useQuery(api.businesses.getBySlug, slug ? { slug } : "skip");
  return {
    data: business
      ? {
          name: business.name,
          slug: business.slug,
          address: business.address ?? "",
          phone: business.phone ?? "",
          email: business.email ?? "",
          logoUrl: business.logoUrl ?? null,
        }
      : undefined,
    isLoading: business === undefined,
    isError: false,
  };
}
