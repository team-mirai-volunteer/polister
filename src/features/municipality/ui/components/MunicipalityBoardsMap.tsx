"use client";

import MapboxMap from "@/components/map/MapboxMap";
import { DEFAULT_CENTER, DEFAULT_ZOOM } from "@/components/map/mapStyleConfig";
import { useMapResize } from "@/shared/ui/hooks/useMapResize";
import { Box, Typography } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import bbox from "@turf/bbox";
import mapboxgl from "mapbox-gl";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import type { MunicipalityBoardDTO } from "../../application/dto/MunicipalityBoardDTO";

const POLYGON_SOURCE_ID = "municipality-polygon";
const POLYGON_LAYER_ID = "municipality-outline";

interface MunicipalityBoardsMapProps {
  boards: MunicipalityBoardDTO[];
  geojson?: GeoJSON.Feature | null;
  focusedBoardId?: string | null;
  onBoardFocused?: (boardId: string | null) => void;
}

interface CoordinatePoint {
  id: string;
  longitude: number;
  latitude: number;
  name: string;
  boardNumber: number | null;
}

interface MarkerEntry {
  marker: mapboxgl.Marker;
  element: HTMLButtonElement;
  cleanup: () => void;
}

const [DEFAULT_LONGITUDE, DEFAULT_LATITUDE] = DEFAULT_CENTER as [
  number,
  number,
];

const DEFAULT_VIEW_STATE = {
  longitude: DEFAULT_LONGITUDE,
  latitude: DEFAULT_LATITUDE,
  zoom: DEFAULT_ZOOM,
};

export function MunicipalityBoardsMap({
  boards,
  geojson,
  focusedBoardId,
  onBoardFocused,
}: MunicipalityBoardsMapProps) {
  const theme = useTheme();
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [mapReady, setMapReady] = useState(false);
  const markersRef = useRef<Map<string, MarkerEntry>>(new Map());

  const coordinates = useMemo<CoordinatePoint[]>(() => {
    return boards
      .filter(
        (
          board
        ): board is MunicipalityBoardDTO & {
          longitude: number;
          latitude: number;
        } =>
          typeof board.longitude === "number" &&
          Number.isFinite(board.longitude) &&
          typeof board.latitude === "number" &&
          Number.isFinite(board.latitude)
      )
      .map((board) => ({
        id: board.id,
        longitude: board.longitude as number,
        latitude: board.latitude as number,
        name: board.name ?? "",
        boardNumber: board.boardNumber,
      }));
  }, [boards]);

  const polygonBounds = useMemo(() => {
    if (!geojson || !geojson.geometry) {
      return null;
    }

    const [minLng, minLat, maxLng, maxLat] = bbox(geojson as GeoJSON.Feature);

    if (
      minLng === undefined ||
      minLat === undefined ||
      maxLng === undefined ||
      maxLat === undefined
    ) {
      return null;
    }

    return {
      minLng,
      minLat,
      maxLng,
      maxLat,
      center: {
        longitude: (minLng + maxLng) / 2,
        latitude: (minLat + maxLat) / 2,
      },
    };
  }, [geojson]);

  const initialViewState = useMemo(() => {
    if (polygonBounds) {
      return {
        longitude: polygonBounds.center.longitude,
        latitude: polygonBounds.center.latitude,
        zoom: 10,
      };
    }

    if (coordinates.length === 0) {
      return DEFAULT_VIEW_STATE;
    }

    if (coordinates.length === 1) {
      const [only] = coordinates;
      return {
        longitude: only.longitude,
        latitude: only.latitude,
        zoom: 14,
      };
    }

    const avg = coordinates.reduce(
      (acc, coord) => {
        acc.longitude += coord.longitude;
        acc.latitude += coord.latitude;
        return acc;
      },
      { longitude: 0, latitude: 0 }
    );

    return {
      longitude: avg.longitude / coordinates.length,
      latitude: avg.latitude / coordinates.length,
      zoom: 12,
    };
  }, [coordinates, polygonBounds]);

  const adjustViewport = useCallback(
    (map: mapboxgl.Map) => {
      if (polygonBounds) {
        const { minLng, minLat, maxLng, maxLat } = polygonBounds;
        if (minLng === maxLng && minLat === maxLat) {
          map.easeTo({ center: [minLng, minLat], zoom: 12, duration: 600 });
        } else {
          map.fitBounds(
            [
              [minLng, minLat],
              [maxLng, maxLat],
            ],
            { padding: 40, duration: 800 }
          );
        }
        return;
      }

      if (coordinates.length === 0) {
        return;
      }

      if (coordinates.length === 1) {
        const [only] = coordinates;
        map.easeTo({
          center: [only.longitude, only.latitude],
          zoom: 14,
          duration: 600,
        });
        return;
      }

      const bounds = coordinates.reduce(
        (acc, coord) => {
          acc.minLng = Math.min(acc.minLng, coord.longitude);
          acc.minLat = Math.min(acc.minLat, coord.latitude);
          acc.maxLng = Math.max(acc.maxLng, coord.longitude);
          acc.maxLat = Math.max(acc.maxLat, coord.latitude);
          return acc;
        },
        {
          minLng: Number.POSITIVE_INFINITY,
          minLat: Number.POSITIVE_INFINITY,
          maxLng: Number.NEGATIVE_INFINITY,
          maxLat: Number.NEGATIVE_INFINITY,
        }
      );

      if (bounds.minLng === bounds.maxLng && bounds.minLat === bounds.maxLat) {
        map.easeTo({
          center: [bounds.minLng, bounds.minLat],
          zoom: 14,
          duration: 600,
        });
        return;
      }

      map.fitBounds(
        [
          [bounds.minLng, bounds.minLat],
          [bounds.maxLng, bounds.maxLat],
        ],
        { padding: 48, duration: 800 }
      );
    },
    [coordinates, polygonBounds]
  );

  const handleMapReady = useCallback((map: mapboxgl.Map) => {
    mapRef.current = map;
    setMapReady(true);
  }, []);

  useEffect(() => {
    return () => {
      const markers = markersRef.current;
      markers.forEach((entry) => {
        entry.cleanup();
      });
      markersRef.current = new Map<string, MarkerEntry>();
      mapRef.current = null;
      setMapReady(false);
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapReady) {
      return;
    }

    const ensurePolygon = () => {
      if (!map.isStyleLoaded()) {
        return;
      }

      if (!geojson) {
        if (map.getLayer(POLYGON_LAYER_ID)) {
          map.removeLayer(POLYGON_LAYER_ID);
        }
        if (map.getSource(POLYGON_SOURCE_ID)) {
          map.removeSource(POLYGON_SOURCE_ID);
        }
        return;
      }

      const sourceData = geojson as GeoJSON.Feature;

      if (map.getSource(POLYGON_SOURCE_ID)) {
        const source = map.getSource(
          POLYGON_SOURCE_ID
        ) as mapboxgl.GeoJSONSource | null;
        source?.setData(sourceData);
      } else {
        map.addSource(POLYGON_SOURCE_ID, {
          type: "geojson",
          data: sourceData,
        });
      }

      if (!map.getLayer(POLYGON_LAYER_ID)) {
        map.addLayer({
          id: POLYGON_LAYER_ID,
          type: "line",
          source: POLYGON_SOURCE_ID,
          paint: {
            "line-color": theme.palette.primary.main,
            "line-width": 2,
          },
        });
      }
    };

    ensurePolygon();
    map.on("style.load", ensurePolygon);

    return () => {
      map.off("style.load", ensurePolygon);
      if (map.getLayer(POLYGON_LAYER_ID)) {
        map.removeLayer(POLYGON_LAYER_ID);
      }
      if (map.getSource(POLYGON_SOURCE_ID)) {
        map.removeSource(POLYGON_SOURCE_ID);
      }
    };
  }, [geojson, mapReady, theme.palette.primary.main]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapReady) {
      return;
    }

    const nextIds = new Set(coordinates.map((coord) => coord.id));
    const palette = {
      primary: theme.palette.primary.main,
      secondary: theme.palette.secondary.main,
      white: theme.palette.common.white,
    };

    // Remove markers that no longer exist
    markersRef.current.forEach((entry, id) => {
      if (!nextIds.has(id)) {
        entry.cleanup();
        markersRef.current.delete(id);
      }
    });

    coordinates.forEach((coord) => {
      const label =
        coord.boardNumber !== null
          ? `掲示板 No.${coord.boardNumber}${
              coord.name ? ` ${coord.name}` : ""
            }`
          : `掲示板${coord.name ? ` ${coord.name}` : ""}`;

      const existing = markersRef.current.get(coord.id);
      if (existing) {
        existing.marker.setLngLat([coord.longitude, coord.latitude]);
        existing.element.setAttribute("aria-label", label);
        existing.element.setAttribute("title", label);
        applyMarkerStyle(existing.element, false, palette);
        return;
      }

      const element = document.createElement("button");
      element.type = "button";
      element.style.border = "none";
      element.style.padding = "0";
      element.style.background = "transparent";
      element.style.cursor = "pointer";
      element.style.outline = "none";
      element.style.transition =
        "background-color 0.2s ease, box-shadow 0.2s ease, opacity 0.2s ease";
      element.setAttribute("aria-label", label);
      element.setAttribute("title", label);
      element.tabIndex = 0;

      applyMarkerStyle(element, false, palette);

      const handleClick = () => {
        onBoardFocused?.(coord.id);
      };

      const handleKeyDown = (event: KeyboardEvent) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          onBoardFocused?.(coord.id);
        }
      };

      element.addEventListener("click", handleClick);
      element.addEventListener("keydown", handleKeyDown);

      const marker = new mapboxgl.Marker({ element })
        .setLngLat([coord.longitude, coord.latitude])
        .addTo(map);

      markersRef.current.set(coord.id, {
        marker,
        element,
        cleanup: () => {
          element.removeEventListener("click", handleClick);
          element.removeEventListener("keydown", handleKeyDown);
          marker.remove();
        },
      });
    });
  }, [
    coordinates,
    mapReady,
    onBoardFocused,
    theme.palette.common.white,
    theme.palette.primary.main,
    theme.palette.secondary.main,
  ]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapReady) {
      return;
    }

    markersRef.current.forEach((entry, id) => {
      const isFocused = focusedBoardId === id;
      entry.element.setAttribute("aria-pressed", isFocused ? "true" : "false");
      applyMarkerStyle(entry.element, isFocused, {
        primary: theme.palette.primary.main,
        secondary: theme.palette.secondary.main,
        white: theme.palette.common.white,
      });
    });

    if (!focusedBoardId) {
      return;
    }

    const target = coordinates.find((coord) => coord.id === focusedBoardId);
    if (!target) {
      return;
    }

    map.easeTo({
      center: [target.longitude, target.latitude],
      zoom: Math.max(map.getZoom(), 14),
      duration: 500,
    });
  }, [
    focusedBoardId,
    mapReady,
    coordinates,
    theme.palette.common.white,
    theme.palette.primary.main,
    theme.palette.secondary.main,
  ]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapReady) {
      return;
    }

    if (map.isStyleLoaded()) {
      adjustViewport(map);
      return;
    }

    const handleLoad = () => {
      adjustViewport(map);
      map.off("load", handleLoad);
    };

    map.on("load", handleLoad);

    return () => {
      map.off("load", handleLoad);
    };
  }, [adjustViewport, mapReady]);

  useMapResize(mapReady ? mapRef.current : null, containerRef);

  return (
    <Box
      ref={containerRef}
      sx={{
        position: "relative",
        width: "100%",
        flex: 1,
        display: "flex",
        flexDirection: "column",
        minHeight: 360,
      }}
    >
      <MapboxMap
        onMapReady={handleMapReady}
        initialViewState={initialViewState}
        sx={{ flex: 1, minHeight: 0 }}
        mapContainerSx={{ height: "100%" }}
      />

      {!geojson ? (
        <Typography
          variant="caption"
          sx={{
            position: "absolute",
            top: 80,
            left: 16,
            bgcolor: "rgba(255,255,255,0.92)",
            px: 1,
            py: 0.4,
            borderRadius: 1,
            color: "text.secondary",
          }}
        >
          行政区域ポリゴンは利用できません
        </Typography>
      ) : null}
    </Box>
  );
}

function applyMarkerStyle(
  element: HTMLButtonElement,
  isFocused: boolean,
  palette: { primary: string; secondary: string; white: string }
) {
  element.style.width = isFocused ? "18px" : "14px";
  element.style.height = isFocused ? "18px" : "14px";
  element.style.borderRadius = "50%";
  element.style.backgroundColor = isFocused
    ? palette.secondary
    : palette.primary;
  element.style.opacity = isFocused ? "1" : "0.75";
  element.style.border = `2px solid ${palette.white}`;
  element.style.boxShadow = isFocused
    ? "0 0 0 3px rgba(228,0,20,0.25)"
    : "0 0 6px rgba(29,41,61,0.25)";
  element.style.transition =
    "background-color 0.2s ease, box-shadow 0.2s ease, opacity 0.2s ease";
  element.style.transform = isFocused ? "scale(1.1)" : "scale(1)";
}

export default MunicipalityBoardsMap;
