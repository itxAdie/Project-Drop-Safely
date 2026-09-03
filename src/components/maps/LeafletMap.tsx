"use client";

import React, { useCallback } from "react";
import { MapContainer, TileLayer, useMapEvents } from "react-leaflet";
import L from "leaflet";
import type { MapProps } from "./types";
import { cn } from "@/lib/utils/cn";

// Fix Leaflet's default icon paths (broken in webpack/Next.js)
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const iconDefault = L.Icon.Default.prototype as any;
delete iconDefault["_getIconUrl"];
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
  iconUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
  shadowUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
});

// ── Green accent icon ──────────────────────────────────────────────────────

function createGreenIcon(label?: string): L.DivIcon {
  const inner = label
    ? `<span style="color:#fff;font-size:11px;font-weight:700;line-height:28px;text-align:center;display:block">${label}</span>`
    : `<span style="display:block;width:10px;height:10px;border-radius:50%;background:#22c55e;margin:9px auto"></span>`;

  return L.divIcon({
    className: "ds-marker",
    html: `
      <div style="position:relative;width:28px;height:36px">
        <div style="
          width:28px;height:28px;border-radius:50% 50% 50% 0;
          background:#22c55e;transform:rotate(-45deg);
          box-shadow:0 2px 8px rgba(34,197,94,0.5);
          position:absolute;top:0;left:0;
        ">
          <div style="transform:rotate(45deg)">${inner}</div>
        </div>
      </div>`,
    iconSize: [28, 36],
    iconAnchor: [14, 36],
    popupAnchor: [0, -36],
  });
}

// ── Status-colored icon ────────────────────────────────────────────────────

const STATUS_COLORS: Record<string, string> = {
  pending: "#6b7280",
  picked_up: "#22c55e",
  dropped_off: "#3b82f6",
  absent: "#ef4444",
};

function createStatusIcon(
  status?: string,
  label?: string,
): L.DivIcon {
  const color = STATUS_COLORS[status ?? "pending"] ?? "#6b7280";
  const inner = label
    ? `<span style="color:#fff;font-size:11px;font-weight:700;line-height:28px;text-align:center;display:block">${label}</span>`
    : `<span style="display:block;width:10px;height:10px;border-radius:50%;background:${color};margin:9px auto"></span>`;

  return L.divIcon({
    className: "ds-marker",
    html: `
      <div style="position:relative;width:28px;height:36px">
        <div style="
          width:28px;height:28px;border-radius:50% 50% 50% 0;
          background:${color};transform:rotate(-45deg);
          box-shadow:0 2px 8px ${color}66;
          position:absolute;top:0;left:0;
        ">
          <div style="transform:rotate(45deg)">${inner}</div>
        </div>
      </div>`,
    iconSize: [28, 36],
    iconAnchor: [14, 36],
    popupAnchor: [0, -36],
  });
}

// ── Driver pulsing icon ────────────────────────────────────────────────────

function createDriverIcon(): L.DivIcon {
  return L.divIcon({
    className: "ds-driver-marker",
    html: `
      <div style="position:relative;width:20px;height:20px">
        <div style="
          position:absolute;inset:0;border-radius:50%;
          background:rgba(34,197,94,0.25);
          animation:ds-pulse 2s ease-out infinite;
        "></div>
        <div style="
          position:absolute;inset:4px;border-radius:50%;
          background:#22c55e;border:2px solid #fff;
          box-shadow:0 0 8px rgba(34,197,94,0.6);
        "></div>
      </div>`,
    iconSize: [20, 20],
    iconAnchor: [10, 10],
  });
}

// ── Click handler ──────────────────────────────────────────────────────────

function MapClickHandler({
  onLocationSelect,
}: {
  onLocationSelect?: (latLng: { lat: number; lng: number }) => void;
}) {
  useMapEvents({
    click(e) {
      onLocationSelect?.({ lat: e.latlng.lat, lng: e.latlng.lng });
    },
  });
  return null;
}

// ── Main Leaflet Map ───────────────────────────────────────────────────────

export function LeafletMap({
  center,
  zoom,
  markers = [],
  onLocationSelect,
  polyline,
  className,
  style,
}: MapProps) {
  const boundsRef = React.useRef<L.Map | null>(null);

  const handleMapReady = useCallback(
    (map: L.Map) => {
      boundsRef.current = map;

      // Add markers
      markers.forEach((m) => {
        const icon = m.status
          ? createStatusIcon(m.status, m.label)
          : createGreenIcon(m.label);

        const marker = L.marker([m.position.lat, m.position.lng], { icon });
        if (m.popup) marker.bindPopup(m.popup);
        marker.addTo(map);
      });

      // Add polyline
      if (polyline && polyline.positions.length > 1) {
        L.polyline(
          polyline.positions.map((p) => [p.lat, p.lng]),
          {
            color: polyline.color ?? "#22c55e",
            weight: polyline.weight ?? 3,
            opacity: polyline.opacity ?? 0.8,
            dashArray: "8 6",
          },
        ).addTo(map);
      }

      // Auto-fit bounds if markers exist
      if (markers.length > 0) {
        const bounds = L.latLngBounds(
          markers.map((m) => [m.position.lat, m.position.lng]),
        );
        map.fitBounds(bounds, { padding: [40, 40], maxZoom: 16 });
      }
    },
    [markers, polyline],
  );

  return (
    <div className={cn("relative w-full h-full min-h-[300px]", className)} style={style}>
      <MapContainer
        center={[center.lat, center.lng]}
        zoom={zoom}
        zoomControl={false}
        className="h-full w-full rounded-2xl"
        style={{ background: "#0a0a0a" }}
        ref={(instance) => {
          if (instance) handleMapReady(instance);
        }}
      >
        <TileLayer
          attribution='&copy; <a href="https://carto.com/">CARTO</a>'
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
        />
        <MapClickHandler onLocationSelect={onLocationSelect} />
      </MapContainer>

      {/* Pulse animation keyframes */}
      <style jsx global>{`
        @keyframes ds-pulse {
          0% { transform: scale(1); opacity: 1; }
          100% { transform: scale(3); opacity: 0; }
        }
        .ds-marker, .ds-driver-marker { background: transparent !important; border: none !important; }
        .leaflet-control-zoom a {
          background: rgba(10,10,10,0.85) !important;
          color: #f5f5f5 !important;
          border-color: rgba(255,255,255,0.08) !important;
        }
        .leaflet-control-zoom a:hover {
          background: rgba(34,197,94,0.2) !important;
          color: #22c55e !important;
        }
        .leaflet-popup-content-wrapper {
          background: rgba(10,10,10,0.9) !important;
          color: #f5f5f5 !important;
          border-radius: 12px !important;
          border: 1px solid rgba(255,255,255,0.08) !important;
          backdrop-filter: blur(12px) !important;
        }
        .leaflet-popup-tip { background: rgba(10,10,10,0.9) !important; }
      `}</style>
    </div>
  );
}

export { createGreenIcon, createStatusIcon, createDriverIcon };
