"use client";

import { Alert, Box, type SxProps, type Theme } from "@mui/material";
import mapboxgl from "mapbox-gl";
import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
} from "react";

import type { MapStyleKey } from "./mapStyleConfig";
import {
  DEFAULT_CENTER,
  DEFAULT_ZOOM,
  MAP_STYLE_URLS,
  applySimpleStyling,
} from "./mapStyleConfig";
import { MapStyleToggle } from "./MapStyleToggle";
import { setMapLanguageToJapanese } from "./useJapaneseLabels";

type MapboxMapboxOptions = Omit<
  mapboxgl.MapboxOptions,
  "container" | "style" | "center" | "zoom"
>;

export interface MapboxMapProps {
  initialStyle?: MapStyleKey;
  initialViewState?: {
    longitude: number;
    latitude: number;
    zoom?: number;
  };
  mapboxOptions?: Partial<MapboxMapboxOptions>;
  onMapReady?: (map: mapboxgl.Map) => void;
  showStyleToggle?: boolean;
  showGeolocate?: boolean;
  sx?: SxProps<Theme>;
  mapContainerSx?: SxProps<Theme>;
  className?: string;
  style?: CSSProperties;
}

const MapboxMap = (props: MapboxMapProps = {}) => {
  const {
    initialStyle = "standard",
    initialViewState,
    mapboxOptions,
    onMapReady,
    showStyleToggle = true,
    showGeolocate = true,
    sx,
    mapContainerSx,
    className,
    style,
  } = props;

  const accessToken = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN;
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const appliedStyleRef = useRef<MapStyleKey | null>(null);
  const styleStateRef = useRef<MapStyleKey>(initialStyle);
  const geolocateControlRef = useRef<mapboxgl.GeolocateControl | null>(null);
  const [mapStyle, setMapStyle] = useState<MapStyleKey>(initialStyle);
  const [error, setError] = useState<string | null>(null);
  const [mapInstance, setMapInstance] = useState<mapboxgl.Map | null>(null);
  const [mapReady, setMapReady] = useState(false);

  const initialCenter = useMemo<[number, number]>(() => {
    if (initialViewState) {
      return [initialViewState.longitude, initialViewState.latitude];
    }
    return DEFAULT_CENTER as [number, number];
  }, [initialViewState]);

  const initialZoom = initialViewState?.zoom ?? DEFAULT_ZOOM;

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
      style: MAP_STYLE_URLS[initialStyle],
      center: initialCenter,
      zoom: initialZoom,
      attributionControl: false,
      ...mapboxOptions,
    });

    mapRef.current = map;
    appliedStyleRef.current = initialStyle;

    const navigationControl = new mapboxgl.NavigationControl({
      visualizePitch: true,
    });
    map.addControl(navigationControl, "top-right");

    if (showGeolocate) {
      const geolocateControl = new mapboxgl.GeolocateControl({
        positionOptions: { enableHighAccuracy: true },
        trackUserLocation: true,
        showUserHeading: true,
      });

      geolocateControlRef.current = geolocateControl;
      map.addControl(geolocateControl, "top-right");
    }

    const handleStyleData = () => {
      setMapLanguageToJapanese(map);
      if (styleStateRef.current === "simple") {
        applySimpleStyling(map);
      }
    };

    map.on("styledata", handleStyleData);

    map.once("load", () => {
      setMapInstance(map);
      setMapReady(true);
    });

    return () => {
      map.off("styledata", handleStyleData);
      map.remove();
      geolocateControlRef.current = null;
      mapRef.current = null;
      appliedStyleRef.current = null;
      setMapInstance(null);
      setMapReady(false);
    };
  }, [
    accessToken,
    initialCenter,
    initialStyle,
    initialZoom,
    mapboxOptions,
    showGeolocate,
  ]);

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

  useEffect(() => {
    if (mapReady && mapInstance && onMapReady) {
      onMapReady(mapInstance);
    }
  }, [mapInstance, mapReady, onMapReady]);

  if (!accessToken) {
    return (
      <Alert severity="warning">
        Mapboxのアクセストークンが設定されていません。`.env.local`に`NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN`を追加してください。
      </Alert>
    );
  }

  const wrapperSx = [
    { position: "relative" },
    ...(Array.isArray(sx) ? sx : sx ? [sx] : []),
  ];

  const containerSx = [
    {
      width: "100%",
      height: { xs: 320, md: 520 },
      borderRadius: 2,
      overflow: "hidden",
    },
    ...(Array.isArray(mapContainerSx)
      ? mapContainerSx
      : mapContainerSx
        ? [mapContainerSx]
        : []),
  ];

  return (
    <Box className={className} style={style} sx={wrapperSx}>
      <Box ref={containerRef} sx={containerSx} />

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
      ) : showStyleToggle ? (
        <MapStyleToggle
          value={mapStyle}
          onChange={(nextStyle) => {
            setMapStyle(nextStyle);
          }}
        />
      ) : null}
    </Box>
  );
};

export default MapboxMap;
