"use client";

import { useEffect, useState } from "react";
import { getAuth } from "@/lib/auth";

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const [ok, setOk] = useState(false);

  useEffect(() => {
    const auth = getAuth();
    if (!auth) {
      window.location.href = "/login";
      return;
    }
    setOk(true);
  }, []);

  if (!ok) return null;
  return <>{children}</>;
}
