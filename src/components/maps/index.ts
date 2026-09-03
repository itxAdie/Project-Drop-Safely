// ── Map Components ──────────────────────────────────────────────────────────
// Public API for the maps module

export { MapProvider, getActiveProvider, MapLoadingSkeleton } from "./MapProvider";
export { LeafletMap } from "./LeafletMap";
export { GoogleMap } from "./GoogleMap";
export { LocationPicker } from "./LocationPicker";
export { RouteMap } from "./RouteMap";
export { DemandHeatmap } from "./DemandHeatmap";

// ── Types ──────────────────────────────────────────────────────────────────
export type {
  LatLng,
  MapProps,
  MarkerProps,
  PolylineProps,
  MapMarker,
  PolylineData,
  IMapProvider,
  MarkerStatus,
  LocationPickerResult,
  LocationPickerProps,
  RouteStop,
  RouteMapProps,
  HeatmapPoint,
  DemandHeatmapProps,
} from "./types";

export {
  DEFAULT_CENTER,
  DEFAULT_ZOOM,
  geoPointToLatLng,
  latLngToGeoPoint,
} from "./types";
