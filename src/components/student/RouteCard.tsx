"use client";

import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { MapPin, Clock, GraduationCap, ArrowRight } from "lucide-react";

interface RouteData {
  name?: string;
  institute?: string;
  pickupTime?: string;
  dropTime?: string;
  status?: string;
}

interface Props {
  route: RouteData | null;
  className?: string;
}

export function RouteCard({ route, className }: Props) {
  if (!route) {
    return (
      <Card padding="md" className={className}>
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-yellow-500/10">
            <MapPin size={18} className="text-yellow-400" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-300">No Route Assigned</p>
            <p className="text-xs text-gray-600">You&apos;re in the waiting pool</p>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card padding="md" hover className={className}>
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            <h3 className="text-sm font-semibold text-gray-200 truncate">
              {route.name || "Your Route"}
            </h3>
            {route.status && (
              <Badge
                variant={route.status === "active" ? "success" : "warning"}
                size="sm"
                dot
              >
                {route.status}
              </Badge>
            )}
          </div>

          <div className="space-y-1.5">
            {route.institute && (
              <div className="flex items-center gap-2 text-xs text-gray-400">
                <GraduationCap size={13} className="text-gray-600 shrink-0" />
                <span className="truncate">{route.institute}</span>
              </div>
            )}
            {route.pickupTime && (
              <div className="flex items-center gap-2 text-xs text-gray-400">
                <Clock size={13} className="text-gray-600 shrink-0" />
                <span>Pickup: {route.pickupTime}</span>
              </div>
            )}
          </div>
        </div>

        <Link
          href="/student/route"
          className="flex items-center gap-1 rounded-lg bg-white/[0.04] px-2.5 py-1.5 text-xs text-gray-400 hover:text-green-400 hover:bg-green-500/10 transition-colors shrink-0"
        >
          Details
          <ArrowRight size={12} />
        </Link>
      </div>
    </Card>
  );
}
