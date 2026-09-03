import type { GeoPoint } from "@/types";

// ── Map coordinates ────────────────────────────────────────────────────────

export interface LatLng {
  lat: number;
  lng: number;
}

// ── Marker status for route maps ───────────────────────────────────────────

export type MarkerStatus = "pending" | "picked_up" | "dropped_off" | "absent";

// ── Shared map component props ─────────────────────────────────────────────

export interface MapMarker {
  id: string;
  position: LatLng;
  label?: string;
  status?: MarkerStatus;
  popup?: string;
}

export interface PolylineData {
  positions: LatLng[];
  color?: string;
  weight?: number;
  opacity?: number;
}

export interface MapProps {
  center: LatLng;
  zoom: number;
  markers?: MapMarker[];
  onLocationSelect?: (latLng: LatLng) => void;
  polyline?: PolylineData;
  className?: string;
  style?: React.CSSProperties;
  children?: React.ReactNode;
}

export interface MarkerProps {
  position: LatLng;
  label?: string;
  status?: MarkerStatus;
  popup?: string;
  draggable?: boolean;
  onDragEnd?: (latLng: LatLng) => void;
}

export interface PolylineProps {
  positions: LatLng[];
  color?: string;
  weight?: number;
  opacity?: number;
}

// ── Provider interface (Strategy Pattern) ──────────────────────────────────

export interface IMapProvider {
  Map: React.ComponentType<MapProps>;
  Marker: React.ComponentType<MarkerProps>;
  Polyline: React.ComponentType<PolylineProps>;
}

// ── Location picker types ──────────────────────────────────────────────────

export interface LocationPickerResult {
  coordinates: [number, number]; // [lng, lat] — GeoJSON order
  address: string;
}

export interface LocationPickerProps {
  initialValue?: LatLng;
  initialAddress?: string;
  onSelect: (result: LocationPickerResult) => void;
  className?: string;
}

// ── Route map types ────────────────────────────────────────────────────────

export interface RouteStop {
  id: string;
  position: LatLng;
  label: string;
  sequence: number;
  status: MarkerStatus;
  studentName?: string;
}

export interface RouteMapProps {
  stops: RouteStop[];
  driverLocation?: LatLng;
  className?: string;
}

// ── Heatmap types ──────────────────────────────────────────────────────────

export interface HeatmapPoint {
  lat: number;
  lng: number;
  intensity: number;
}

export interface DemandHeatmapProps {
  data: HeatmapPoint[];
  className?: string;
}

// ── Helpers ────────────────────────────────────────────────────────────────

export function geoPointToLatLng(geo: GeoPoint): LatLng {
  return { lat: geo.coordinates[1], lng: geo.coordinates[0] };
}

export function latLngToGeoPoint(latLng: LatLng): GeoPoint {
  return {
    type: "Point",
    coordinates: [latLng.lng, latLng.lat],
  };
}

/** Default center: Lahore, Pakistan */
export const DEFAULT_CENTER: LatLng = { lat: 31.5204, lng: 74.3587 };
export const DEFAULT_ZOOM = 13;
