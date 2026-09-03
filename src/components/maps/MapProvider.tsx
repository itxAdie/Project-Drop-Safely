"use client";

import React from "react";
import dynamic from "next/dynamic";
import type { IMapProvider } from "./types";
import { Spinner } from "@/components/ui/Spinner";

// ── Determine provider from env ────────────────────────────────────────────

const providerName =
  (typeof process !== "undefined" && process.env.NEXT_PUBLIC_MAP_PROVIDER) ||
  "leaflet";

const hasGoogleKey =
  typeof process !== "undefined" &&
  !!process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

// ── Lazy-load providers (SSR must be false for Leaflet) ─────────────────────

const LeafletProvider: IMapProvider = {
  Map: dynamic(() => import("./LeafletMap").then((m) => ({ default: m.LeafletMap })), {
    ssr: false,
    loading: () => <MapLoadingSkeleton />,
  }),
  Marker: () => null, // Leaflet markers are rendered inside LeafletMap directly
  Polyline: () => null, // Same — polylines are rendered inside LeafletMap
};

const GoogleProvider: IMapProvider = {
  Map: dynamic(() => import("./GoogleMap").then((m) => ({ default: m.GoogleMap })), {
    ssr: false,
    loading: () => <MapLoadingSkeleton />,
  }),
  Marker: () => null,
  Polyline: () => null,
};

// ── Select active provider ─────────────────────────────────────────────────

function getActiveProvider(): IMapProvider {
  if (providerName === "google" && hasGoogleKey) {
    return GoogleProvider;
  }
  return LeafletProvider;
}

// ── Loading skeleton ───────────────────────────────────────────────────────

function MapLoadingSkeleton() {
  return (
    <div className="flex items-center justify-center w-full h-full min-h-[300px] rounded-2xl bg-[#0a0a0a] border border-white/[0.06]">
      <div className="flex flex-col items-center gap-3">
        <Spinner size="lg" />
        <span className="text-xs text-gray-600">Loading map…</span>
      </div>
    </div>
  );
}

// ── Public MapProvider wrapper ────────────────────────────────────────────

interface MapProviderProps {
  children: (provider: IMapProvider) => React.ReactNode;
}

export function MapProvider({ children }: MapProviderProps) {
  const provider = getActiveProvider();
  return <>{children(provider)}</>;
}

export { getActiveProvider, MapLoadingSkeleton };
export type { IMapProvider };
