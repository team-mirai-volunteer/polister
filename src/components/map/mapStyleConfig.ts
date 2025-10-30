import mapboxgl from "mapbox-gl";

export type MapStyleKey = "standard" | "simple" | "satellite";

export const MAP_STYLE_URLS: Record<MapStyleKey, string> = {
  standard: "mapbox://styles/mapbox/streets-v12",
  simple: "mapbox://styles/mapbox/light-v11",
  satellite: "mapbox://styles/mapbox/satellite-streets-v12",
};

export const DEFAULT_CENTER: mapboxgl.LngLatLike = [137.0, 38.0];
export const DEFAULT_ZOOM = 4.5;

const SIMPLE_LAYER_CUSTOMIZATIONS: LayerCustomization[] = [
  {
    layerId: "road-primary",
    paint: [
      { property: "line-color", value: "#ff6b35" },
      { property: "line-width", value: 3 },
    ],
  },
  {
    layerId: "road-secondary-tertiary",
    paint: [
      { property: "line-color", value: "#ffa552" },
      { property: "line-width", value: 2 },
    ],
  },
  {
    layerId: "road-street",
    paint: [
      { property: "line-color", value: "#ffd07b" },
      { property: "line-width", value: 1.2 },
    ],
  },
  {
    layerId: "road-pedestrian",
    paint: [
      { property: "line-color", value: "#ffe6a7" },
      { property: "line-width", value: 1 },
    ],
  },
  {
    layerId: "building",
    paint: [
      { property: "fill-color", value: "#f5f0e6" },
      { property: "fill-outline-color", value: "#d6c3b2" },
    ],
  },
  {
    layerId: "poi-label",
    paint: [
      { property: "text-color", value: "#2c3e50" },
      { property: "text-halo-color", value: "#fff7e6" },
      { property: "text-halo-width", value: 1.2 },
    ],
    layout: [{ property: "text-size", value: 14 }],
  },
  {
    layerId: "road-label",
    paint: [
      { property: "text-color", value: "#3d3d3d" },
      { property: "text-halo-color", value: "#fff7e6" },
    ],
  },
  {
    layerId: "water",
    paint: [{ property: "fill-color", value: "#cbe7ff" }],
  },
];

type PaintPropertyName = Parameters<mapboxgl.Map["setPaintProperty"]>[1];
type LayoutPropertyName = Parameters<mapboxgl.Map["setLayoutProperty"]>[1];

type PaintSetting = {
  property: PaintPropertyName;
  value: string | number | boolean | number[];
};

type LayoutSetting = {
  property: LayoutPropertyName;
  value: string | number | boolean;
};

type LayerCustomization = {
  layerId: string;
  paint?: PaintSetting[];
  layout?: LayoutSetting[];
};

export const applySimpleStyling = (map: mapboxgl.Map) => {
  if (!map.isStyleLoaded()) {
    map.once("styledata", () => applySimpleStyling(map));
    return;
  }

  SIMPLE_LAYER_CUSTOMIZATIONS.forEach(({ layerId, paint, layout }) => {
    if (!map.getLayer(layerId)) {
      return;
    }

    if (paint) {
      paint.forEach(({ property, value }) => {
        map.setPaintProperty(layerId, property, value);
      });
    }

    if (layout) {
      layout.forEach(({ property, value }) => {
        map.setLayoutProperty(layerId, property, value);
      });
    }
  });
};
