"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { Spinner } from "@/components/ui/Spinner";
import type { UserRole } from "@/types/enums";

interface RoleAuthGuardProps {
  children: React.ReactNode;
  allowedRoles: UserRole[];
  /**
   * If the authenticated user's profile is incomplete (no Student/Driver
   * sub-document), they should be sent here instead of the protected page.
   */
  incompleteProfilePath?: string;
}

export function RoleAuthGuard({
  children,
  allowedRoles,
  incompleteProfilePath,
}: RoleAuthGuardProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, isAuthenticated, isLoading } = useAuth();

  useEffect(() => {
    if (isLoading) return;

    // Not logged in → login page
    if (!isAuthenticated || !user) {
      router.replace("/login");
      return;
    }

    // Role mismatch → appropriate dashboard (or login)
    if (!allowedRoles.includes(user.role)) {
      switch (user.role) {
        case "admin":
          router.replace("/admin");
          break;
        case "driver":
          router.replace("/driver");
          break;
        case "student":
          router.replace("/student");
          break;
        default:
          router.replace("/login");
      }
      return;
    }

    // Profile incomplete check: if user is on a "dashboard" path
    // (not a registration path), check if they have a sub-document
    if (incompleteProfilePath && !pathname.startsWith(incompleteProfilePath)) {
      // Only check once, then let the page handle further checks via SWR
      fetch("/api/auth/me", {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("ds_auth") ? JSON.parse(localStorage.getItem("ds_auth")!).accessToken : ""}`,
        },
      })
        .then((res) => {
          if (res.status === 401) {
            localStorage.removeItem("ds_auth");
            router.replace("/login");
            return;
          }
          return res.json();
        })
        .then((data) => {
          if (!data) return;
          const profile = user.role === "student" ? data.student : data.driver;
          if (!profile) {
            router.replace(incompleteProfilePath);
          }
        })
        .catch(() => {
          // Silently fail — the page can handle its own data checks
        });
    }
  }, [
    isLoading,
    isAuthenticated,
    user,
    allowedRoles,
    router,
    pathname,
    incompleteProfilePath,
  ]);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0a0a0a]">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!isAuthenticated || !user || !allowedRoles.includes(user.role)) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0a0a0a]">
        <Spinner size="lg" />
      </div>
    );
  }

  return <>{children}</>;
}
