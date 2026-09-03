"use client";

import { SWRConfig } from "swr";
import type { ReactNode } from "react";

const fetcher = async (url: string) => {
  const token =
    typeof window !== "undefined"
      ? (() => {
          try {
            const stored = JSON.parse(localStorage.getItem("ds_auth") || "{}");
            return stored.accessToken || stored.token || null;
          } catch {
            return null;
          }
        })()
      : null;

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const res = await fetch(url, { headers });

  // Auto-logout on 401
  if (res.status === 401) {
    if (typeof window !== "undefined") {
      localStorage.removeItem("ds_auth");
      // Redirect to login if not already there
      if (!window.location.pathname.startsWith("/login")) {
        window.location.href = "/login";
      }
    }
    throw new Error("Session expired. Please log in again.");
  }

  if (!res.ok) {
    const error = await res.json().catch(() => ({ error: "Request failed" }));
    throw new Error(error.error || "Request failed");
  }

  return res.json();
};

export function SWRProvider({ children }: { children: ReactNode }) {
  return (
    <SWRConfig
      value={{
        fetcher,
        revalidateOnFocus: false,
        dedupingInterval: 2000,
        errorRetryCount: 3,
        errorRetryInterval: 5000,
      }}
    >
      {children}
    </SWRConfig>
  );
}
