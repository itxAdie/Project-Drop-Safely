"use client";

import React, { useEffect, useState, useCallback } from "react";
import L from "leaflet";
import { MapContainer, TileLayer, useMap } from "react-leaflet";
import dynamic from "next/dynamic";
import { motion } from "framer-motion";
import { Eye, EyeOff } from "lucide-react";
import type { DemandHeatmapProps, HeatmapPoint } from "./types";
import { DEFAULT_CENTER, DEFAULT_ZOOM } from "./types";
import { cn } from "@/lib/utils/cn";
import { Spinner } from "@/components/ui/Spinner";

// ── HeatLayer (uses leaflet.heat plugin) ───────────────────────────────────

function HeatLayer({ data }: { data: HeatmapPoint[] }) {
  const map = useMap();

  useEffect(() => {
    if (!map || data.length === 0) return;

    let layer: L.Layer | null = null;
    let cancelled = false;

    const loadHeat = async () => {
      // leaflet.heat extends L dynamically
      await import("leaflet.heat");

      if (cancelled) return;

      const heatPoints: [number, number, number][] = data.map((p) => [
        p.lat,
        p.lng,
        p.intensity,
      ]);

      // @ts-expect-error — leaflet.heat extends L at runtime
      layer = L.heatLayer(heatPoints, {
        radius: 30,
        blur: 20,
        maxZoom: 17,
        gradient: {
          0.0: "#22c55e",
          0.4: "#eab308",
          0.7: "#f97316",
          1.0: "#ef4444",
        },
      }) as L.Layer;

      layer.addTo(map);
    };

    void loadHeat();

    return () => {
      cancelled = true;
      if (layer) {
        map.removeLayer(layer);
      }
    };
  }, [map, data]);

  return null;
}

// ── Inner map (dynamically loaded, SSR false) ──────────────────────────────

function DemandHeatmapInner({
  data,
  visible,
}: {
  data: HeatmapPoint[];
  visible: boolean;
}) {
  return (
    <MapContainer
      center={[DEFAULT_CENTER.lat, DEFAULT_CENTER.lng]}
      zoom={DEFAULT_ZOOM - 1}
      zoomControl={false}
      className="h-full w-full rounded-2xl"
      style={{ background: "#0a0a0a" }}
    >
      <TileLayer
        attribution='&copy; <a href="https://carto.com/">CARTO</a>'
        url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
      />
      {visible && <HeatLayer data={data} />}

      {/* Dark theme overrides */}
      <style jsx global>{`
        .leaflet-control-zoom a {
          background: rgba(10,10,10,0.85) !important;
          color: #f5f5f5 !important;
          border-color: rgba(255,255,255,0.08) !important;
        }
        .leaflet-control-zoom a:hover {
          background: rgba(34,197,94,0.2) !important;
          color: #22c55e !important;
        }
      `}</style>
    </MapContainer>
  );
}

const DemandHeatmapMap = dynamic(
  () => Promise.resolve(DemandHeatmapInner),
  {
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center w-full h-full rounded-2xl bg-[#0a0a0a]">
        <Spinner size="lg" />
      </div>
    ),
  },
);

// ── Public DemandHeatmap component ─────────────────────────────────────────

export function DemandHeatmap({ data, className }: DemandHeatmapProps) {
  const [visible, setVisible] = useState(true);

  const toggleOverlay = useCallback(() => setVisible((v) => !v), []);

  return (
    <div className={cn("relative flex flex-col gap-3", className)}>
      {/* Map container */}
      <div className="relative w-full h-[400px] rounded-2xl overflow-hidden border border-white/[0.06]">
        <DemandHeatmapMap data={data} visible={visible} />

        {/* Toggle overlay button */}
        <motion.button
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          type="button"
          onClick={toggleOverlay}
          className="absolute top-3 right-3 z-[1000] flex items-center gap-1.5 rounded-lg border border-white/[0.1] bg-[#0a0a0a]/85 backdrop-blur-md px-3 py-2 text-xs font-medium transition-all hover:border-green-500/30"
        >
          {visible ? (
            <>
              <EyeOff size={12} className="text-green-400" />
              <span className="text-gray-300">Hide Heatmap</span>
            </>
          ) : (
            <>
              <Eye size={12} className="text-gray-500" />
              <span className="text-gray-400">Show Heatmap</span>
            </>
          )}
        </motion.button>
      </div>

      {/* Gradient legend */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="flex items-center gap-3 rounded-xl border border-white/[0.06] bg-[#0a0a0a]/60 backdrop-blur-md px-4 py-2.5"
      >
        <span className="text-[10px] text-gray-500 font-medium">Low</span>
        <div
          className="flex-1 h-2 rounded-full"
          style={{
            background:
              "linear-gradient(to right, #22c55e, #eab308, #f97316, #ef4444)",
          }}
        />
        <span className="text-[10px] text-gray-500 font-medium">High</span>
        <span className="text-[10px] text-gray-600 ml-2">
          ({data.length} area{data.length !== 1 ? "s" : ""})
        </span>
      </motion.div>
    </div>
  );
}
