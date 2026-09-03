declare module "leaflet.heat" {
  export interface HeatMapOptions {
    minOpacity?: number;
    maxZoom?: number;
    max?: number;
    radius?: number;
    blur?: number;
    gradient?: Record<number, string>;
  }

  export type HeatDataPoint = [number, number, number];

  export interface HeatLayer {
    setLatLngs(latlngs: HeatDataPoint[]): this;
    addLatLng(latlng: HeatDataPoint): this;
    setOptions(options: HeatMapOptions): this;
    redraw(): this;
    addTo(map: unknown): this;
    remove(): this;
  }

  export function heatLayer(
    latlngs: HeatDataPoint[],
    options?: HeatMapOptions,
  ): HeatLayer;
}
