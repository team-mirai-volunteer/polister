"use client";

import MapboxMap from "@/components/map/MapboxMap";
import type { BoardImportRowDTO } from "@/features/board-import/application/dto/BoardImportBatchDTO";
import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import mapboxgl from "mapbox-gl";
import { useCallback, useEffect, useRef, useState } from "react";

const INITIAL_VIEW = {
  longitude: 139.6917,
  latitude: 35.6895,
  zoom: 11,
};

export interface BoardImportReviewMapProps {
  selectedRow: BoardImportRowDTO | null;
}

export function BoardImportReviewMap({
  selectedRow,
}: BoardImportReviewMapProps) {
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const importMarkerRef = useRef<mapboxgl.Marker | null>(null);
  const existingMarkerRef = useRef<mapboxgl.Marker | null>(null);
  const [mapReady, setMapReady] = useState(false);

  const handleMapReady = useCallback((map: mapboxgl.Map) => {
    mapRef.current = map;
    setMapReady(true);
  }, []);

  useEffect(() => {
    return () => {
      importMarkerRef.current?.remove();
      importMarkerRef.current = null;
      existingMarkerRef.current?.remove();
      existingMarkerRef.current = null;
      mapRef.current = null;
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapReady) {
      return;
    }

    const importCoords: [number, number] | null =
      selectedRow &&
      Number.isFinite(selectedRow.longitude) &&
      Number.isFinite(selectedRow.latitude)
        ? [selectedRow.longitude, selectedRow.latitude]
        : null;

    const existingCoords: [number, number] | null =
      selectedRow?.matchedBoard &&
      selectedRow.matchedBoard.longitude !== null &&
      selectedRow.matchedBoard.longitude !== undefined &&
      selectedRow.matchedBoard.latitude !== null &&
      selectedRow.matchedBoard.latitude !== undefined
        ? [
            selectedRow.matchedBoard.longitude,
            selectedRow.matchedBoard.latitude,
          ]
        : null;

    if (importCoords) {
      if (!importMarkerRef.current) {
        importMarkerRef.current = new mapboxgl.Marker({ color: "#1976d2" })
          .setLngLat(importCoords)
          .setPopup(
            new mapboxgl.Popup({ offset: 12 }).setHTML(
              `<strong>CSV</strong><br/>${selectedRow?.address ?? ""}`
            )
          )
          .addTo(map);
      } else {
        importMarkerRef.current
          .setLngLat(importCoords)
          .setPopup(
            new mapboxgl.Popup({ offset: 12 }).setHTML(
              `<strong>CSV</strong><br/>${selectedRow?.address ?? ""}`
            )
          );
      }
    } else {
      importMarkerRef.current?.remove();
      importMarkerRef.current = null;
    }

    if (existingCoords) {
      const popupHtml = selectedRow?.matchedBoard
        ? `<strong>既存掲示場</strong><br/>${selectedRow.matchedBoard.address ?? ""}`
        : "<strong>既存掲示場</strong>";

      if (!existingMarkerRef.current) {
        existingMarkerRef.current = new mapboxgl.Marker({ color: "#d32f2f" })
          .setLngLat(existingCoords)
          .setPopup(new mapboxgl.Popup({ offset: 12 }).setHTML(popupHtml))
          .addTo(map);
      } else {
        existingMarkerRef.current
          .setLngLat(existingCoords)
          .setPopup(new mapboxgl.Popup({ offset: 12 }).setHTML(popupHtml));
      }
    } else {
      existingMarkerRef.current?.remove();
      existingMarkerRef.current = null;
    }

    const bounds = new mapboxgl.LngLatBounds();
    if (importCoords) {
      bounds.extend(importCoords as [number, number]);
    }
    if (existingCoords) {
      bounds.extend(existingCoords as [number, number]);
    }

    if (importCoords && existingCoords) {
      map.fitBounds(bounds, { padding: 64, duration: 400, maxZoom: 17 });
    } else if (importCoords) {
      map.easeTo({ center: importCoords as [number, number], zoom: 16 });
    } else if (existingCoords) {
      map.easeTo({ center: existingCoords as [number, number], zoom: 16 });
    }
  }, [mapReady, selectedRow]);

  return (
    <Box
      sx={{
        border: "1px solid",
        borderColor: "divider",
        borderRadius: 2,
        overflow: "hidden",
        flexGrow: 1,
        minHeight: { xs: 280, lg: 360 },
        display: "flex",
        flexDirection: "column",
      }}
    >
      <MapboxMap
        onMapReady={handleMapReady}
        initialViewState={INITIAL_VIEW}
        sx={{ flexGrow: 1, minHeight: 0 }}
        mapContainerSx={{ height: "100%" }}
      />

      {!selectedRow ? (
        <Stack sx={{ p: 2 }}>
          <Typography variant="body2" color="text.secondary">
            行を選択すると、CSVと既存掲示場の位置を地図で表示します。
          </Typography>
        </Stack>
      ) : null}
    </Box>
  );
}

export default BoardImportReviewMap;
