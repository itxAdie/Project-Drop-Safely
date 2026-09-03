"use client";

import React, { useState, useCallback, useEffect, useRef } from "react";
import dynamic from "next/dynamic";
import { motion, AnimatePresence } from "framer-motion";
import { MapPin, Search, Crosshair, Loader2 } from "lucide-react";
import type {
  LocationPickerProps,
  LocationPickerResult,
  LatLng,
} from "./types";
import { DEFAULT_CENTER, DEFAULT_ZOOM } from "./types";
import { cn } from "@/lib/utils/cn";
import { Spinner } from "@/components/ui/Spinner";

// Dynamically import Leaflet map (SSR false)
const LeafletMap = dynamic(
  () => import("./LeafletMap").then((m) => m.LeafletMap),
  { ssr: false, loading: () => <PickerLoading /> },
);

function PickerLoading() {
  return (
    <div className="flex items-center justify-center w-full h-full rounded-2xl bg-[#0a0a0a]">
      <Spinner size="lg" />
    </div>
  );
}

// ── Reverse geocode helper ─────────────────────────────────────────────────

async function reverseGeocode(latLng: LatLng): Promise<string> {
  try {
    const url = `https://nominatim.openstreetmap.org/reverse?lat=${latLng.lat}&lon=${latLng.lng}&format=json&zoom=18`;
    const res = await fetch(url, {
      headers: { "Accept-Language": "en" },
    });
    if (!res.ok) return `${latLng.lat.toFixed(6)}, ${latLng.lng.toFixed(6)}`;
    const data = await res.json();
    return (data.display_name as string) || `${latLng.lat.toFixed(6)}, ${latLng.lng.toFixed(6)}`;
  } catch {
    return `${latLng.lat.toFixed(6)}, ${latLng.lng.toFixed(6)}`;
  }
}

// ── Component ──────────────────────────────────────────────────────────────

export function LocationPicker({
  initialValue,
  initialAddress,
  onSelect,
  className,
}: LocationPickerProps) {
  const [selected, setSelected] = useState<LatLng | null>(
    initialValue ?? null,
  );
  const [address, setAddress] = useState<string>(initialAddress ?? "");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<
    { lat: number; lng: number; display_name: string }[]
  >([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isGeocoding, setIsGeocoding] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  const searchTimeout = useRef<ReturnType<typeof setTimeout>>(null);

  // Center map on selected or default
  const [center, setCenter] = useState<LatLng>(
    initialValue ?? DEFAULT_CENTER,
  );

  // Handle map click → place pin
  const handleMapClick = useCallback(
    async (latLng: LatLng) => {
      setSelected(latLng);
      setIsGeocoding(true);
      const addr = await reverseGeocode(latLng);
      setAddress(addr);
      setIsGeocoding(false);
      onSelect({
        coordinates: [latLng.lng, latLng.lat],
        address: addr,
      });
    },
    [onSelect],
  );

  // Search address (debounced)
  const handleSearch = useCallback((query: string) => {
    setSearchQuery(query);
    if (searchTimeout.current) clearTimeout(searchTimeout.current);

    if (query.length < 3) {
      setSearchResults([]);
      return;
    }

    searchTimeout.current = setTimeout(async () => {
      setIsSearching(true);
      try {
        const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=5&countrycodes=pk`;
        const res = await fetch(url, {
          headers: { "Accept-Language": "en" },
        });
        if (res.ok) {
          const data = await res.json();
          setSearchResults(
            data.map((r: { lat: string; lon: string; display_name: string }) => ({
              lat: parseFloat(r.lat),
              lng: parseFloat(r.lon),
              display_name: r.display_name,
            })),
          );
        }
      } catch {
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    }, 400);
  }, []);

  // Select search result
  const handleSelectResult = useCallback(
    (result: { lat: number; lng: number; display_name: string }) => {
      const latLng = { lat: result.lat, lng: result.lng };
      setSelected(latLng);
      setAddress(result.display_name);
      setCenter(latLng);
      setSearchQuery("");
      setSearchResults([]);
      onSelect({
        coordinates: [latLng.lng, latLng.lat],
        address: result.display_name,
      });
    },
    [onSelect],
  );

  // Use current location
  const handleUseMyLocation = useCallback(() => {
    if (!navigator.geolocation) return;
    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const latLng = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setSelected(latLng);
        setCenter(latLng);
        setIsLocating(false);
        setIsGeocoding(true);
        const addr = await reverseGeocode(latLng);
        setAddress(addr);
        setIsGeocoding(false);
        onSelect({
          coordinates: [latLng.lng, latLng.lat],
          address: addr,
        });
      },
      () => setIsLocating(false),
      { enableHighAccuracy: true, timeout: 10000 },
    );
  }, [onSelect]);

  // Clean up timeout on unmount
  useEffect(() => {
    return () => {
      if (searchTimeout.current) clearTimeout(searchTimeout.current);
    };
  }, []);

  const markers = selected
    ? [
        {
          id: "picker-pin",
          position: selected,
          label: "📍",
          popup: address || undefined,
        },
      ]
    : [];

  return (
    <div className={cn("relative w-full flex flex-col gap-3", className)}>
      {/* Search bar */}
      <div className="relative">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search
              size={14}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500"
            />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              placeholder="Search address…"
              className="w-full rounded-xl border border-white/[0.08] bg-[#0a0a0a]/80 backdrop-blur-md pl-9 pr-4 py-2.5 text-sm text-gray-200 placeholder:text-gray-600 focus:border-green-500/40 focus:outline-none focus:ring-1 focus:ring-green-500/20 transition-all"
            />
            {isSearching && (
              <Loader2
                size={14}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 animate-spin"
              />
            )}
          </div>
          <button
            type="button"
            onClick={handleUseMyLocation}
            disabled={isLocating}
            className="flex items-center gap-1.5 rounded-xl border border-white/[0.08] bg-[#0a0a0a]/80 backdrop-blur-md px-3 py-2.5 text-xs text-gray-400 hover:border-green-500/30 hover:text-green-400 disabled:opacity-50 transition-all"
            title="Use my current location"
          >
            {isLocating ? (
              <Loader2 size={14} className="animate-spin" />
            ) : (
              <Crosshair size={14} />
            )}
          </button>
        </div>

        {/* Search results dropdown */}
        <AnimatePresence>
          {searchResults.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              className="absolute z-50 top-full mt-1 left-0 right-0 rounded-xl border border-white/[0.08] bg-[#0a0a0a]/95 backdrop-blur-xl shadow-xl overflow-hidden"
            >
              {searchResults.map((r, i) => (
                <button
                  key={`${r.lat}-${r.lng}-${i}`}
                  type="button"
                  onClick={() => handleSelectResult(r)}
                  className="w-full text-left px-4 py-2.5 text-xs text-gray-300 hover:bg-green-500/10 hover:text-green-400 transition-colors border-b border-white/[0.04] last:border-b-0"
                >
                  {r.display_name}
                </button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Map container */}
      <div className="relative w-full h-[280px] rounded-2xl overflow-hidden border border-white/[0.06]">
        <LeafletMap
          center={center}
          zoom={selected ? 16 : DEFAULT_ZOOM}
          markers={markers}
          onLocationSelect={handleMapClick}
        />

        {/* Tap instruction overlay (only when no pin placed) */}
        <AnimatePresence>
          {!selected && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 flex items-center justify-center pointer-events-none"
            >
              <div className="glass-card px-4 py-2 flex items-center gap-2 text-xs text-gray-400">
                <MapPin size={14} className="text-green-400" />
                Tap on the map to place your pickup pin
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Selected coordinates display */}
      <AnimatePresence>
        {selected && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            className="rounded-xl border border-white/[0.06] bg-[#0a0a0a]/60 backdrop-blur-md px-4 py-3 space-y-1"
          >
            <div className="flex items-center gap-2 text-xs">
              <MapPin size={12} className="text-green-400 shrink-0" />
              <span className="text-gray-300 font-medium truncate">
                {isGeocoding ? "Looking up address…" : address}
              </span>
            </div>
            <div className="flex gap-4 text-[10px] text-gray-600 font-mono">
              <span>Lat: {selected.lat.toFixed(6)}</span>
              <span>Lng: {selected.lng.toFixed(6)}</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
