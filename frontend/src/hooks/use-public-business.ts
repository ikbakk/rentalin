"use client";

import { useQuery } from "@tanstack/react-query";
import { publicApi } from "@/lib/api";

export interface PublicBusiness {
  name: string;
  slug: string;
  address: string;
  phone: string;
  email: string;
  logoUrl: string | null;
}

export function usePublicBusiness(slug: string) {
  return useQuery<PublicBusiness>({
    queryKey: ["public-business", slug],
    queryFn: () => publicApi.get("/api/public/" + slug),
  });
}
