"use client";

import { MapStyleToggle } from "@/components/map/MapStyleToggle";
import {
  DEFAULT_CENTER,
  DEFAULT_ZOOM,
  MAP_STYLE_URLS,
  applySimpleStyling,
  type MapStyleKey,
} from "@/components/map/mapStyleConfig";
import { setMapLanguageToJapanese } from "@/components/map/useJapaneseLabels";
import { useMapResize } from "@/shared/ui/hooks/useMapResize";
import { Alert, Box, useTheme, type SxProps, type Theme } from "@mui/material";
import bbox from "@turf/bbox";
import mapboxgl from "mapbox-gl";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import MapboxMap, {
  Layer,
  MapRef as MapboxMapRef,
  Source,
} from "react-map-gl/mapbox";

import type { BoardLocationDTO } from "../../application/dto/BoardLocationDTO";

const SOURCE_ID = "boards-cluster-source";
const CLUSTER_LAYER_ID = "boards-cluster-circles";
const CLUSTER_COUNT_LAYER_ID = "boards-cluster-count";
const UNCLUSTERED_LAYER_ID = "boards-unclustered";

export interface BoardsClusterMapProps {
  boards: BoardLocationDTO[];
  sx?: SxProps<Theme>;
  minHeight?: number;
}

interface FeatureProperties {
  id: string;
  name: string | null;
  boardNumber: number | null;
}

export function BoardsClusterMap({
  boards,
  sx,
  minHeight = 360,
}: BoardsClusterMapProps) {
  const theme = useTheme();
  const mapboxToken = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN;
  const mapRef = useRef<MapboxMapRef | null>(null);
  const [mapStyle, setMapStyle] = useState<MapStyleKey>("standard");
  const [mapInstance, setMapInstance] = useState<mapboxgl.Map | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const featureCollection = useMemo<GeoJSON.FeatureCollection<
    GeoJSON.Point,
    FeatureProperties
  > | null>(() => {
    const features = boards
      .filter(
        (
          board
        ): board is BoardLocationDTO & {
          longitude: number;
          latitude: number;
        } =>
          typeof board.longitude === "number" &&
          Number.isFinite(board.longitude) &&
          typeof board.latitude === "number" &&
          Number.isFinite(board.latitude)
      )
      .map((board) => ({
        type: "Feature" as const,
        geometry: {
          type: "Point" as const,
          coordinates: [board.longitude, board.latitude],
        },
        properties: {
          id: board.id,
          name: board.name,
          boardNumber: board.boardNumber,
        },
      }));

    if (features.length === 0) {
      return null;
    }

    return {
      type: "FeatureCollection",
      features,
    };
  }, [boards]);

  const bounds = useMemo(() => {
    if (!featureCollection) {
      return null;
    }

    const [minLng, minLat, maxLng, maxLat] = bbox(featureCollection);

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
  }, [featureCollection]);

  const initialViewState = useMemo(() => {
    if (bounds) {
      return {
        longitude: bounds.center.longitude,
        latitude: bounds.center.latitude,
        zoom: 5,
      };
    }

    return {
      longitude: (DEFAULT_CENTER as [number, number])[0],
      latitude: (DEFAULT_CENTER as [number, number])[1],
      zoom: DEFAULT_ZOOM,
    };
  }, [bounds]);

  const adjustViewport = useCallback(
    (map: mapboxgl.Map) => {
      if (!bounds) {
        return;
      }

      const { minLng, minLat, maxLng, maxLat } = bounds;

      if (minLng === maxLng && minLat === maxLat) {
        map.easeTo({
          center: [minLng, minLat],
          zoom: 13,
          duration: 600,
        });
        return;
      }

      map.fitBounds(
        [
          [minLng, minLat],
          [maxLng, maxLat],
        ],
        { padding: 48, duration: 800 }
      );
    },
    [bounds]
  );

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
      if (mapStyle === "simple") {
        applySimpleStyling(mapInstance);
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
  }, [mapInstance, mapStyle]);

  const handleMapClick = useCallback((event: mapboxgl.MapLayerMouseEvent) => {
    const map = mapRef.current?.getMap();
    if (!map || !event.features?.length) {
      return;
    }

    const feature = event.features[0];

    const layerId = feature.layer?.id;

    if (layerId === CLUSTER_LAYER_ID || layerId === CLUSTER_COUNT_LAYER_ID) {
      const clusterId = feature.properties?.cluster_id;
      const clusterSource = map.getSource(SOURCE_ID) as
        | (mapboxgl.GeoJSONSource & {
            getClusterExpansionZoom: (
              clusterId: number,
              callback: (error: Error | null, zoom: number) => void
            ) => void;
          })
        | null;

      if (!clusterSource || typeof clusterId !== "number") {
        return;
      }

      clusterSource.getClusterExpansionZoom(clusterId, (error, zoomLevel) => {
        if (error) {
          console.error("Failed to get cluster expansion zoom", error);
          return;
        }

        if (typeof zoomLevel !== "number") {
          return;
        }

        const geometry = feature.geometry;
        if (geometry.type !== "Point") {
          return;
        }

        const [longitude, latitude] = geometry.coordinates as [number, number];
        map.easeTo({
          center: [longitude, latitude],
          zoom: zoomLevel,
          duration: 600,
        });
      });

      return;
    }

    if (layerId === UNCLUSTERED_LAYER_ID) {
      const geometry = feature.geometry;
      if (geometry.type !== "Point") {
        return;
      }
      const [longitude, latitude] = geometry.coordinates as [number, number];
      map.easeTo({
        center: [longitude, latitude],
        zoom: Math.max(map.getZoom(), 14),
        duration: 500,
      });
    }
  }, []);

  useMapResize(mapInstance, containerRef);

  if (!mapboxToken) {
    return (
      <Alert severity="warning">
        Mapboxのアクセストークンが設定されていません。`.env.local`に`NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN`を追加してください。
      </Alert>
    );
  }

  return (
    <Box
      ref={containerRef}
      sx={{
        position: "relative",
        width: "100%",
        height: "100%",
        minHeight,
        ...sx,
      }}
    >
      <MapboxMap
        ref={mapRef}
        mapboxAccessToken={mapboxToken}
        mapStyle={MAP_STYLE_URLS[mapStyle]}
        initialViewState={initialViewState}
        interactiveLayerIds={[
          CLUSTER_LAYER_ID,
          CLUSTER_COUNT_LAYER_ID,
          UNCLUSTERED_LAYER_ID,
        ]}
        onLoad={handleMapLoad}
        onClick={handleMapClick}
      >
        <Source
          id={SOURCE_ID}
          type="geojson"
          data={
            featureCollection ?? { type: "FeatureCollection", features: [] }
          }
          cluster
          clusterMaxZoom={14}
          clusterRadius={60}
        >
          <Layer
            id={CLUSTER_LAYER_ID}
            type="circle"
            filter={["has", "point_count"]}
            paint={{
              "circle-color": [
                "step",
                ["get", "point_count"],
                theme.palette.primary.light,
                50,
                theme.palette.primary.main,
                100,
                theme.palette.primary.dark,
              ],
              "circle-radius": [
                "step",
                ["get", "point_count"],
                16,
                50,
                22,
                100,
                30,
              ],
              "circle-opacity": 0.92,
              "circle-stroke-width": 2,
              "circle-stroke-color": "#ffffff",
            }}
          />
          <Layer
            id={CLUSTER_COUNT_LAYER_ID}
            type="symbol"
            filter={["has", "point_count"]}
            layout={{
              "text-field": ["get", "point_count_abbreviated"],
              "text-allow-overlap": true,
              "text-font": ["Open Sans Bold", "Arial Unicode MS Bold"],
              "text-size": 12,
            }}
            paint={{
              "text-color": theme.palette.primary.contrastText,
            }}
          />
          <Layer
            id={UNCLUSTERED_LAYER_ID}
            type="circle"
            filter={["!", ["has", "point_count"]]}
            paint={{
              "circle-color": theme.palette.primary.main,
              "circle-radius": 7,
              "circle-stroke-width": 2,
              "circle-stroke-color": "#ffffff",
              "circle-opacity": 0.95,
            }}
          />
        </Source>
      </MapboxMap>

      <MapStyleToggle
        value={mapStyle}
        onChange={(value) => setMapStyle(value)}
      />
    </Box>
  );
}

export default BoardsClusterMap;
