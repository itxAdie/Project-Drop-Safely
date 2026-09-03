"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { Spinner } from "@/components/ui/Spinner";

/**
 * Blocks students from accessing student pages until their security deposit
 * has been admin-verified. Redirects to /student/deposit otherwise.
 */
export function DepositGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { isAuthenticated, isLoading } = useAuth();
  const [status, setStatus] = useState<"loading" | "verified" | "blocked">("loading");

  const isDepositPage = pathname === "/student/deposit";

  useEffect(() => {
    if (isLoading) return;
    if (!isAuthenticated) return;
    // The deposit page itself is always reachable without a paid deposit.
    if (isDepositPage) return;

    const token = localStorage.getItem("ds_auth")
      ? JSON.parse(localStorage.getItem("ds_auth")!).accessToken
      : "";

    fetch("/api/students/me", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => (res.status === 401 ? null : res.json()))
      .then((data) => {
        const depositStatus = data?.data?.depositStatus;
        // Only an admin-verified deposit unlocks the dashboard.
        setStatus(depositStatus === "verified" ? "verified" : "blocked");
      })
      .catch(() => setStatus("verified"));
  }, [isLoading, isAuthenticated, isDepositPage]);

  useEffect(() => {
    if (status === "blocked") router.replace("/student/deposit");
  }, [status, router]);

  // Keep protected content hidden until the deposit check resolves so nothing
  // ever flashes before redirect.
  if (isLoading || !isAuthenticated || (!isDepositPage && status === "loading")) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0a0a0a]">
        <Spinner size="lg" />
      </div>
    );
  }

  return <>{children}</>;
}
