"use client";

import {
  Alert,
  Box,
  Stack,
  ToggleButton,
  ToggleButtonGroup,
  Tooltip,
  Typography,
} from "@mui/material";
import bbox from "@turf/bbox";
import mapboxgl from "mapbox-gl";
import {
  SyntheticEvent,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import MapboxMap, {
  Layer,
  MapRef as MapboxMapRef,
  Marker,
  Source,
} from "react-map-gl/mapbox";

import type { MapStyleKey } from "@/components/map/mapStyleConfig";
import {
  DEFAULT_CENTER,
  DEFAULT_ZOOM,
  MAP_STYLE_URLS,
  applyPosterStyling,
} from "@/components/map/mapStyleConfig";
import { setMapLanguageToJapanese } from "@/components/map/useJapaneseLabels";

import type { MunicipalityBoardDTO } from "../../application/dto/MunicipalityBoardDTO";

interface MunicipalityBoardsMapProps {
  boards: MunicipalityBoardDTO[];
  geojson?: GeoJSON.Feature | null;
  focusedBoardId?: string | null;
  onBoardFocused?: (boardId: string | null) => void;
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

export const MunicipalityBoardsMap = ({
  boards,
  geojson,
  focusedBoardId,
  onBoardFocused,
}: MunicipalityBoardsMapProps) => {
  const mapboxToken = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN;
  const mapRef = useRef<MapboxMapRef | null>(null);
  const styleStateRef = useRef<MapStyleKey>("poster");
  const appliedStyleRef = useRef<MapStyleKey>("poster");
  const [mapStyle, setMapStyle] = useState<MapStyleKey>("poster");
  const [mapInstance, setMapInstance] = useState<mapboxgl.Map | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const coordinates = useMemo(
    () =>
      boards
        .filter((board) => board.longitude !== null && board.latitude !== null)
        .map((board) => ({
          id: board.id,
          longitude: board.longitude as number,
          latitude: board.latitude as number,
          name: board.name ?? "",
          boardNumber: board.boardNumber,
        })),
    [boards]
  );

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

  useEffect(() => {
    if (mapInstance || !mapRef.current) {
      return;
    }
    const map = mapRef.current.getMap();
    if (map) {
      setMapInstance(map);
    }
  }, [mapInstance]);

  const handleMapLoad = useCallback(() => {
    const map = mapRef.current?.getMap();
    if (map) {
      setMapInstance(map);
    }
  }, []);

  useEffect(() => {
    if (!mapInstance) {
      return;
    }

    if (mapInstance.isStyleLoaded()) {
      adjustViewport(mapInstance);
      return;
    }

    const handleLoad = () => {
      adjustViewport(mapInstance);
      mapInstance.off("load", handleLoad);
    };

    mapInstance.on("load", handleLoad);

    return () => {
      mapInstance.off("load", handleLoad);
    };
  }, [mapInstance, adjustViewport]);

  useEffect(() => {
    if (!mapInstance) {
      return;
    }

    const applyStyle = () => {
      setMapLanguageToJapanese(mapInstance);
      if (styleStateRef.current === "poster") {
        applyPosterStyling(mapInstance);
      }
    };

    applyStyle();
    mapInstance.on("styledata", applyStyle);

    const navControl = new mapboxgl.NavigationControl({
      visualizePitch: true,
      showCompass: true,
      showZoom: true,
    });
    mapInstance.addControl(navControl, "top-right");

    return () => {
      mapInstance.off("styledata", applyStyle);
      mapInstance.removeControl(navControl);
    };
  }, [mapInstance]);

  useEffect(() => {
    styleStateRef.current = mapStyle;
  }, [mapStyle]);

  useEffect(() => {
    if (!mapInstance) {
      return;
    }
    if (appliedStyleRef.current === mapStyle) {
      return;
    }
    appliedStyleRef.current = mapStyle;
    mapInstance.setStyle(MAP_STYLE_URLS[mapStyle]);
  }, [mapInstance, mapStyle]);

  useEffect(() => {
    if (!focusedBoardId || !mapInstance) {
      return;
    }

    const target = coordinates.find((coord) => coord.id === focusedBoardId);
    if (!target) {
      return;
    }

    mapInstance.easeTo({
      center: [target.longitude, target.latitude],
      zoom: Math.max(mapInstance.getZoom(), 14),
      duration: 500,
    });
  }, [mapInstance, coordinates, focusedBoardId]);

  useEffect(() => {
    if (!mapInstance) {
      return;
    }

    const resize = () => {
      mapInstance.resize();
    };

    resize();

    const target = containerRef.current;
    const supportsObserver =
      typeof window !== "undefined" && typeof ResizeObserver !== "undefined";

    if (supportsObserver && target) {
      const observer = new ResizeObserver(() => {
        resize();
      });
      observer.observe(target);

      return () => {
        observer.disconnect();
      };
    }

    if (typeof window !== "undefined") {
      window.addEventListener("resize", resize);
      return () => {
        window.removeEventListener("resize", resize);
      };
    }
  }, [mapInstance]);

  if (!mapboxToken) {
    return (
      <Alert severity="warning">
        Mapboxのアクセストークンが設定されていません。`.env.local`に`NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN`を追加してください。
      </Alert>
    );
  }

  const hasGeoJSON = Boolean(geojson);

  const handleStyleChange = (
    _event: SyntheticEvent,
    nextValue: MapStyleKey | null
  ) => {
    if (!nextValue) {
      return;
    }
    setMapStyle(nextValue);
  };

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
        "& .mapboxgl-map": {
          flex: 1,
        },
      }}
    >
      <MapboxMap
        ref={mapRef}
        mapboxAccessToken={mapboxToken}
        initialViewState={initialViewState}
        mapStyle={MAP_STYLE_URLS[mapStyle]}
        onLoad={handleMapLoad}
        style={{ flex: 1 }}
      >
        {hasGeoJSON ? null : (
          <Typography
            variant="caption"
            sx={{
              position: "absolute",
              top: 12,
              left: 12,
              bgcolor: "rgba(255,255,255,0.92)",
              px: 1,
              py: 0.4,
              borderRadius: 1,
              color: "text.secondary",
            }}
          >
            行政区域ポリゴンは利用できません
          </Typography>
        )}

        {geojson && (
          <Source
            id="municipality-polygon"
            type="geojson"
            data={geojson as GeoJSON.Feature}
          >
            <Layer
              id="municipality-outline"
              type="line"
              paint={{
                "line-color": "#1976d2",
                "line-width": 2,
              }}
            />
          </Source>
        )}

        {coordinates.map((coord) => {
          const isFocused = coord.id === focusedBoardId;
          const markerLabel =
            coord.boardNumber !== null
              ? `掲示板 No.${coord.boardNumber}${
                  coord.name ? ` ${coord.name}` : ""
                }`
              : `掲示板${coord.name ? ` ${coord.name}` : ""}`;

          return (
            <Marker
              key={coord.id}
              longitude={coord.longitude}
              latitude={coord.latitude}
              anchor="bottom"
            >
              <Tooltip
                title={
                  coord.boardNumber !== null
                    ? `No.${coord.boardNumber} ${coord.name}`
                    : coord.name
                }
                PopperProps={{ disablePortal: true }}
              >
                <Box
                  role="button"
                  tabIndex={0}
                  aria-label={markerLabel}
                  aria-pressed={isFocused}
                  onClick={() => onBoardFocused?.(coord.id)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault();
                      onBoardFocused?.(coord.id);
                    }
                  }}
                  sx={{
                    width: isFocused ? 18 : 14,
                    height: isFocused ? 18 : 14,
                    borderRadius: "50%",
                    backgroundColor: isFocused
                      ? "secondary.main"
                      : "primary.main",
                    opacity: isFocused ? 1 : 0.75,
                    border: (theme) =>
                      `2px solid ${theme.palette.common.white}`,
                    boxShadow: isFocused
                      ? "0 0 0 3px rgba(228,0,20,0.25)"
                      : "0 0 6px rgba(29,41,61,0.25)",
                    transition: "all 0.2s ease",
                    cursor: "pointer",
                    outline: "none",
                    transform: isFocused ? "scale(1.1)" : "scale(1)",
                    "&:focus-visible": {
                      outline: (theme) =>
                        `3px solid ${theme.palette.secondary.main}`,
                      outlineOffset: 2,
                    },
                  }}
                />
              </Tooltip>
            </Marker>
          );
        })}
      </MapboxMap>

      <Stack
        direction="row"
        spacing={1}
        sx={{ position: "absolute", top: 16, left: 16 }}
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
            "& .MuiToggleButton-root": {
              px: 1.6,
              py: 0.6,
              border: "none",
              borderRadius: 0,
              fontWeight: 600,
            },
            "& .MuiToggleButton-root:first-of-type": {
              borderTopLeftRadius: 8,
              borderBottomLeftRadius: 8,
            },
            "& .MuiToggleButton-root:last-of-type": {
              borderTopRightRadius: 8,
              borderBottomRightRadius: 8,
            },
          }}
        >
          <ToggleButton value="poster">地図</ToggleButton>
          <ToggleButton value="satellite">衛星</ToggleButton>
        </ToggleButtonGroup>
      </Stack>
    </Box>
  );
};

export default MunicipalityBoardsMap;
