"use client";

import {
  Alert,
  Box,
  Button,
  Stack,
  ToggleButton,
  ToggleButtonGroup,
} from "@mui/material";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";

import { SyntheticEvent, useEffect, useRef, useState } from "react";

const MAP_STYLE_URLS: Record<MapStyleKey, string> = {
  poster: "mapbox://styles/mapbox/light-v11",
  satellite: "mapbox://styles/mapbox/satellite-streets-v12",
};

const DEFAULT_CENTER: mapboxgl.LngLatLike = [139.767125, 35.681236];
const DEFAULT_ZOOM = 11;

const POSTER_LAYER_CUSTOMIZATIONS: LayerCustomization[] = [
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

const MapboxMap = () => {
  const accessToken = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN;
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const appliedStyleRef = useRef<MapStyleKey | null>(null);
  const styleStateRef = useRef<MapStyleKey>("poster");
  const geolocateControlRef = useRef<mapboxgl.GeolocateControl | null>(null);
  const [mapStyle, setMapStyle] = useState<MapStyleKey>("poster");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!accessToken) {
      return;
    }
    mapboxgl.accessToken = accessToken;
  }, [accessToken]);

  useEffect(() => {
    if (!accessToken) {
      return;
    }

    if (!containerRef.current || mapRef.current) {
      return;
    }

    if (!mapboxgl.supported()) {
      setError("お使いのブラウザではMapbox GLがサポートされていません。");
      return;
    }

    const map = new mapboxgl.Map({
      container: containerRef.current,
      style: MAP_STYLE_URLS.poster,
      center: DEFAULT_CENTER,
      zoom: DEFAULT_ZOOM,
      attributionControl: false,
    });

    mapRef.current = map;
    appliedStyleRef.current = "poster";

    const navigationControl = new mapboxgl.NavigationControl({
      visualizePitch: true,
    });
    map.addControl(navigationControl, "top-right");

    const geolocateControl = new mapboxgl.GeolocateControl({
      positionOptions: { enableHighAccuracy: true },
      trackUserLocation: true,
      showUserHeading: true,
    });

    geolocateControlRef.current = geolocateControl;
    map.addControl(geolocateControl, "top-right");

    const handleStyleData = () => {
      if (styleStateRef.current === "poster") {
        applyPosterStyling(map);
      }
    };

    map.on("styledata", handleStyleData);

    return () => {
      map.off("styledata", handleStyleData);
      map.remove();
      geolocateControlRef.current = null;
      mapRef.current = null;
      appliedStyleRef.current = null;
    };
  }, [accessToken]);

  useEffect(() => {
    styleStateRef.current = mapStyle;
    const map = mapRef.current;
    if (!map) {
      return;
    }

    if (appliedStyleRef.current === mapStyle) {
      return;
    }

    appliedStyleRef.current = mapStyle;
    map.setStyle(MAP_STYLE_URLS[mapStyle]);
  }, [mapStyle]);

  const handleStyleChange = (
    _event: SyntheticEvent,
    nextStyle: MapStyleKey | null
  ) => {
    if (!nextStyle) {
      return;
    }
    setMapStyle(nextStyle);
  };

  const handleLocateMe = () => {
    geolocateControlRef.current?.trigger();
  };

  if (!accessToken) {
    return (
      <Alert severity="warning">
        Mapboxのアクセストークンが設定されていません。`.env.local`に`NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN`を追加してください。
      </Alert>
    );
  }

  return (
    <Box sx={{ position: "relative" }}>
      <Box
        ref={containerRef}
        sx={{
          width: "100%",
          height: { xs: 320, md: 520 },
          borderRadius: 2,
          overflow: "hidden",
        }}
      />

      {error ? (
        <Alert
          severity="error"
          sx={{
            position: "absolute",
            top: 16,
            left: 16,
            right: 16,
          }}
        >
          {error}
        </Alert>
      ) : (
        <Stack
          spacing={1}
          sx={{
            position: "absolute",
            top: 16,
            left: 16,
          }}
        >
          <ToggleButtonGroup
            size="small"
            color="primary"
            value={mapStyle}
            exclusive
            onChange={handleStyleChange}
            sx={{
              bgcolor: "rgba(255,255,255,0.92)",
              borderRadius: 1,
              boxShadow: 3,
            }}
          >
            <ToggleButton value="poster">地図</ToggleButton>
            <ToggleButton value="satellite">衛星</ToggleButton>
          </ToggleButtonGroup>
          <Button
            variant="contained"
            size="small"
            onClick={handleLocateMe}
            sx={{
              bgcolor: "rgba(25,118,210,0.92)",
              color: "common.white",
              boxShadow: 3,
              "&:hover": {
                bgcolor: "rgba(25,118,210,0.85)",
              },
            }}
          >
            現在地を表示
          </Button>
        </Stack>
      )}
    </Box>
  );
};

type MapStyleKey = "poster" | "satellite";

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

const applyPosterStyling = (map: mapboxgl.Map) => {
  if (!map.isStyleLoaded()) {
    map.once("styledata", () => applyPosterStyling(map));
    return;
  }

  POSTER_LAYER_CUSTOMIZATIONS.forEach(({ layerId, paint, layout }) => {
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

export default MapboxMap;
