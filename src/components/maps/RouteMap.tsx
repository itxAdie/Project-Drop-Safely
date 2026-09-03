"use client";

import React, { useMemo } from "react";
import dynamic from "next/dynamic";
import { motion } from "framer-motion";
import type { RouteMapProps, MapMarker, PolylineData } from "./types";
import { DEFAULT_CENTER, DEFAULT_ZOOM } from "./types";
import { cn } from "@/lib/utils/cn";
import { Spinner } from "@/components/ui/Spinner";

const LeafletMap = dynamic(
  () => import("./LeafletMap").then((m) => m.LeafletMap),
  {
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center w-full h-full rounded-2xl bg-[#0a0a0a]">
        <Spinner size="lg" />
      </div>
    ),
  },
);

// ── Status color map ───────────────────────────────────────────────────────

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  pending: { label: "Pending", color: "#6b7280" },
  picked_up: { label: "Picked Up", color: "#22c55e" },
  dropped_off: { label: "Dropped Off", color: "#3b82f6" },
  absent: { label: "Absent", color: "#ef4444" },
};

// ── Component ──────────────────────────────────────────────────────────────

export function RouteMap({ stops, driverLocation, className }: RouteMapProps) {
  const markers: MapMarker[] = useMemo(() => {
    const m: MapMarker[] = stops.map((stop) => ({
      id: stop.id,
      position: stop.position,
      label: String(stop.sequence),
      status: stop.status,
      popup: stop.studentName
        ? `#${stop.sequence} ${stop.studentName}`
        : `Stop #${stop.sequence}`,
    }));

    // Add driver marker as a special marker (rendered with different icon via the map)
    if (driverLocation) {
      m.push({
        id: "driver-location",
        position: driverLocation,
        label: "🚐",
        popup: "Driver",
      });
    }

    return m;
  }, [stops, driverLocation]);

  const polyline: PolylineData | undefined = useMemo(() => {
    if (stops.length < 2) return undefined;
    return {
      positions: stops.map((s) => s.position),
      color: "#22c55e",
      weight: 3,
      opacity: 0.7,
    };
  }, [stops]);

  // Collect unique statuses for legend
  const activeStatuses = useMemo(() => {
    const seen = new Set<string>();
    stops.forEach((s) => seen.add(s.status));
    return Array.from(seen);
  }, [stops]);

  const center = stops.length > 0 ? stops[0].position : DEFAULT_CENTER;

  return (
    <div className={cn("relative flex flex-col gap-3", className)}>
      {/* Map */}
      <div className="w-full h-[320px] rounded-2xl overflow-hidden border border-white/[0.06]">
        <LeafletMap
          center={center}
          zoom={DEFAULT_ZOOM}
          markers={markers}
          polyline={polyline}
        />
      </div>

      {/* Legend */}
      {activeStatuses.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="flex flex-wrap items-center gap-3 rounded-xl border border-white/[0.06] bg-[#0a0a0a]/60 backdrop-blur-md px-4 py-2.5"
        >
          {activeStatuses.map((status) => {
            const info = STATUS_LABELS[status];
            if (!info) return null;
            return (
              <div key={status} className="flex items-center gap-1.5">
                <span
                  className="block w-2.5 h-2.5 rounded-full"
                  style={{ backgroundColor: info.color }}
                />
                <span className="text-[10px] text-gray-400 font-medium">
                  {info.label}
                </span>
              </div>
            );
          })}
          {driverLocation && (
            <div className="flex items-center gap-1.5">
              <span className="text-[10px]">🚐</span>
              <span className="text-[10px] text-gray-400 font-medium">
                Driver
              </span>
            </div>
          )}
        </motion.div>
      )}
    </div>
  );
}
