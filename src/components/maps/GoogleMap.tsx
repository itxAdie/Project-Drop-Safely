"use client";

import React, { useCallback, useMemo } from "react";
import {
  GoogleMap as GoogleMapApi,
  useJsApiLoader,
  MarkerF,
  PolylineF,
} from "@react-google-maps/api";
import type { MapProps } from "./types";
import { cn } from "@/lib/utils/cn";
import { Spinner } from "@/components/ui/Spinner";

// ── Dark theme styles (night mode) ─────────────────────────────────────────

const DARK_MAP_STYLES: google.maps.MapTypeStyle[] = [
  { elementType: "geometry", stylers: [{ color: "#1a1a2e" }] },
  { elementType: "labels.text.stroke", stylers: [{ color: "#1a1a2e" }] },
  { elementType: "labels.text.fill", stylers: [{ color: "#8b8b8b" }] },
  { featureType: "administrative", elementType: "geometry.stroke", stylers: [{ color: "#333355" }] },
  { featureType: "poi", stylers: [{ visibility: "off" }] },
  { featureType: "road", elementType: "geometry", stylers: [{ color: "#2a2a3e" }] },
  { featureType: "road", elementType: "geometry.stroke", stylers: [{ color: "#1a1a2e" }] },
  { featureType: "road", elementType: "labels.text.fill", stylers: [{ color: "#6b6b6b" }] },
  { featureType: "road.highway", elementType: "geometry", stylers: [{ color: "#3a3a4e" }] },
  { featureType: "transit", stylers: [{ visibility: "off" }] },
  { featureType: "water", elementType: "geometry", stylers: [{ color: "#0d1117" }] },
  { featureType: "water", elementType: "labels.text.fill", stylers: [{ color: "#4a4a5a" }] },
];

const LOADING_OPTIONS = {
  googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? "",
};

// ── Green marker SVG ───────────────────────────────────────────────────────

const GREEN_PIN_SVG =
  "data:image/svg+xml;charset=UTF-8," +
  encodeURIComponent(`
    <svg xmlns="http://www.w3.org/2000/svg" width="28" height="36" viewBox="0 0 28 36">
      <path d="M14 0C6.27 0 0 6.27 0 14c0 10.5 14 22 14 22s14-11.5 14-22C28 6.27 21.73 0 14 0z" fill="#22c55e"/>
      <circle cx="14" cy="14" r="5" fill="#fff"/>
    </svg>
  `);

// ── Component ──────────────────────────────────────────────────────────────

export function GoogleMap({
  center,
  zoom,
  markers = [],
  onLocationSelect,
  polyline,
  className,
  style,
}: MapProps) {
  const { isLoaded } = useJsApiLoader(LOADING_OPTIONS);

  const mapOptions = useMemo<google.maps.MapOptions>(
    () => ({
      styles: DARK_MAP_STYLES,
      disableDefaultUI: false,
      zoomControl: true,
      streetViewControl: false,
      mapTypeControl: false,
      fullscreenControl: false,
      backgroundColor: "#0a0a0a",
      gestureHandling: "greedy",
    }),
    [],
  );

  const handleClick = useCallback(
    (e: google.maps.MapMouseEvent) => {
      if (e.latLng) {
        onLocationSelect?.({ lat: e.latLng.lat(), lng: e.latLng.lng() });
      }
    },
    [onLocationSelect],
  );

  if (!isLoaded) {
    return (
      <div
        className={cn(
          "flex items-center justify-center min-h-[300px] rounded-2xl bg-[#0a0a0a] border border-white/[0.06]",
          className,
        )}
        style={style}
      >
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className={cn("relative w-full h-full min-h-[300px]", className)} style={style}>
      <GoogleMapApi
        mapContainerClassName="h-full w-full rounded-2xl"
        center={{ lat: center.lat, lng: center.lng }}
        zoom={zoom}
        options={mapOptions}
        onClick={handleClick}
      >
        {markers.map((m) => (
          <MarkerF
            key={m.id}
            position={{ lat: m.position.lat, lng: m.position.lng }}
            icon={{ url: GREEN_PIN_SVG, scaledSize: new google.maps.Size(28, 36) }}
            title={m.popup ?? m.label}
          />
        ))}

        {polyline && polyline.positions.length > 1 && (
          <PolylineF
            path={polyline.positions.map((p) => ({ lat: p.lat, lng: p.lng }))}
            options={{
              strokeColor: polyline.color ?? "#22c55e",
              strokeWeight: polyline.weight ?? 3,
              strokeOpacity: polyline.opacity ?? 0.8,
            }}
          />
        )}
      </GoogleMapApi>
    </div>
  );
}
