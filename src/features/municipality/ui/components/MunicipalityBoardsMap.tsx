"use client";

import "mapbox-gl/dist/mapbox-gl.css";

import { Box, Tooltip, Typography } from "@mui/material";
import bbox from "@turf/bbox";
import type { MutableRefObject } from "react";
import { useCallback, useEffect, useMemo, useRef } from "react";
import MapboxMap, {
  Layer,
  MapRef as MapboxMapRef,
  Marker,
  Source,
} from "react-map-gl/mapbox";

import type { MunicipalityBoardDTO } from "../../application/dto/MunicipalityBoardDTO";

interface MunicipalityBoardsMapProps {
  boards: MunicipalityBoardDTO[];
  geojson?: GeoJSON.Feature | null;
  focusedBoardId?: string | null;
  onBoardFocused?: (boardId: string | null) => void;
}

const DEFAULT_CENTER = { longitude: 139.767125, latitude: 35.681236, zoom: 11 };

export const MunicipalityBoardsMap = ({
  boards,
  geojson,
  focusedBoardId,
  onBoardFocused,
}: MunicipalityBoardsMapProps) => {
  const mapboxToken = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN;
  const mapRef = useRef<MapboxMapRef | null>(null);

  const coordinates = useMemo(
    () =>
      boards
        .filter((board) => board.longitude !== null && board.latitude !== null)
        .map((board) => ({
          id: board.id,
          longitude: board.longitude as number,
          latitude: board.latitude as number,
          name: board.name,
          boardNumber: board.boardNumber,
        })),
    [boards]
  );

  const polygonBounds = useMemo(() => {
    if (!geojson || !geojson.geometry) {
      return null;
    }

    const boundingBox = bbox(geojson as GeoJSON.Feature);
    if (!boundingBox || boundingBox.length !== 4) {
      return null;
    }

    const [minLng, minLat, maxLng, maxLat] = boundingBox;
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
      return DEFAULT_CENTER;
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
      zoom: coordinates.length === 1 ? 14 : 12,
    };
  }, [coordinates, polygonBounds]);

  const adjustViewport = useCallback(() => {
    const map = mapRef.current;
    if (!map) {
      return;
    }

    if (polygonBounds) {
      if (
        polygonBounds.minLng === polygonBounds.maxLng &&
        polygonBounds.minLat === polygonBounds.maxLat
      ) {
        map.easeTo({
          center: [
            polygonBounds.center.longitude,
            polygonBounds.center.latitude,
          ],
          zoom: 12,
          duration: 600,
        });
      } else {
        map.fitBounds(
          [
            [polygonBounds.minLng, polygonBounds.minLat],
            [polygonBounds.maxLng, polygonBounds.maxLat],
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
      const only = coordinates[0];
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

    map.fitBounds(
      [
        [bounds.minLng, bounds.minLat],
        [bounds.maxLng, bounds.maxLat],
      ],
      {
        padding: 40,
        duration: 800,
      }
    );
  }, [coordinates, polygonBounds]);

  useEffect(() => {
    if (!focusedBoardId) {
      return;
    }

    const map = mapRef.current;
    if (!map) {
      return;
    }

    const coord = coordinates.find((item) => item.id === focusedBoardId);
    if (!coord) {
      return;
    }

    map.easeTo({
      center: [coord.longitude, coord.latitude],
      zoom: 14,
      duration: 500,
    });
  }, [coordinates, focusedBoardId]);

  if (!mapboxToken) {
    return (
      <Box sx={{ p: 2, color: "text.secondary" }}>
        Mapboxのアクセストークンが設定されていません。
      </Box>
    );
  }

  const hasGeoJSON = Boolean(geojson);

  const renderGeoJSON = hasGeoJSON && (
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
  );

  return (
    <Box
      sx={{
        width: "100%",
        height: "100%",
        minHeight: 360,
        position: "relative",
      }}
    >
      <MapboxMap
        ref={mapRef}
        initialViewState={initialViewState}
        mapStyle="mapbox://styles/mapbox/streets-v12"
        mapboxAccessToken={mapboxToken}
      >
        {!hasGeoJSON && (
          <Typography
            variant="caption"
            sx={{
              position: "absolute",
              top: 8,
              left: 8,
              bgcolor: "rgba(255,255,255,0.8)",
              px: 1,
              py: 0.25,
              borderRadius: 1,
            }}
          >
            行政区域ポリゴンは利用できません
          </Typography>
        )}
        {renderGeoJSON}
        <MapboxMapAdjuster adjust={adjustViewport} mapRef={mapRef} />
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
                    ? `No.${coord.boardNumber} ${coord.name ?? ""}`
                    : (coord.name ?? "")
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
                    backgroundColor: "primary.main",
                    opacity: isFocused ? 1 : 0.7,
                    border: (theme) =>
                      `2px solid ${theme.palette.common.white}`,
                    boxShadow: 2,
                    transition: "all 0.2s ease",
                    cursor: "pointer",
                    outline: "none",
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
    </Box>
  );
};

interface MapboxMapAdjusterProps {
  adjust: () => void;
  mapRef: MutableRefObject<MapboxMapRef | null>;
}

const MapboxMapAdjuster = ({ adjust, mapRef }: MapboxMapAdjusterProps) => {
  useEffect(() => {
    const map = mapRef.current;
    if (!map) {
      return;
    }

    const handleLoad = () => {
      adjust();
      map.off("load", handleLoad);
    };

    if (map.isStyleLoaded()) {
      adjust();
    } else {
      map.on("load", handleLoad);
    }

    return () => {
      map.off("load", handleLoad);
    };
  }, [adjust, mapRef]);

  return null;
};
