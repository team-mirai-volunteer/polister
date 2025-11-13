"use client";

import MapboxMap from "@/components/map/MapboxMap";
import type { BoardImportRowDTO } from "@/features/board-import/application/dto/BoardImportBatchDTO";
import Box from "@mui/material/Box";
import Chip from "@mui/material/Chip";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import bbox from "@turf/bbox";
import type { Feature } from "geojson";
import mapboxgl from "mapbox-gl";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

const INITIAL_VIEW = {
  longitude: 139.6917,
  latitude: 35.6895,
  zoom: 11,
};

const BOUNDARY_SOURCE_ID = "board-import-boundary";
const BOUNDARY_LAYER_ID = "board-import-boundary-outline";

export interface BoardImportReviewMapProps {
  selectedRow: BoardImportRowDTO | null;
  municipalityBoundary?: Feature | null;
  rows: BoardImportRowDTO[];
}

export function BoardImportReviewMap({
  selectedRow,
  municipalityBoundary,
  rows,
}: BoardImportReviewMapProps) {
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const importMarkerRef = useRef<mapboxgl.Marker | null>(null);
  const existingMarkerRef = useRef<mapboxgl.Marker | null>(null);
  const [mapReady, setMapReady] = useState(false);
  const bulkMarkersRef = useRef<Map<string, mapboxgl.Marker>>(new Map());
  const boundaryBounds = useMemo(() => {
    if (!municipalityBoundary) {
      return null;
    }

    try {
      const [minLng, minLat, maxLng, maxLat] = bbox(
        municipalityBoundary as Feature
      );
      if (
        [minLng, minLat, maxLng, maxLat].some(
          (value) => value === undefined || Number.isNaN(value)
        )
      ) {
        return null;
      }

      return {
        minLng,
        minLat,
        maxLng,
        maxLat,
      };
    } catch {
      return null;
    }
  }, [municipalityBoundary]);

  const updateMarkerLabel = useCallback(
    (marker: mapboxgl.Marker | null, label: string | null) => {
      if (!marker) {
        return;
      }

      const existing = marker.getElement();
      if (!existing) {
        return;
      }

      let labelEl = existing.querySelector<HTMLSpanElement>(
        "[data-role='marker-label']"
      );

      if (label && !labelEl) {
        labelEl = document.createElement("span");
        labelEl.dataset.role = "marker-label";
        labelEl.style.position = "absolute";
        labelEl.style.top = "-28px";
        labelEl.style.left = "50%";
        labelEl.style.transform = "translateX(-50%)";
        labelEl.style.backgroundColor = "rgba(0,0,0,0.7)";
        labelEl.style.color = "#fff";
        labelEl.style.fontSize = "10px";
        labelEl.style.fontWeight = "600";
        labelEl.style.padding = "2px 4px";
        labelEl.style.borderRadius = "2px";
        labelEl.style.pointerEvents = "none";
        existing.appendChild(labelEl);
      }

      if (labelEl) {
        if (label) {
          labelEl.textContent = label;
          labelEl.style.display = "inline-flex";
          labelEl.style.whiteSpace = "nowrap";
        } else {
          labelEl.style.display = "none";
        }
      }
    },
    []
  );

  const handleMapReady = useCallback((map: mapboxgl.Map) => {
    mapRef.current = map;
    setMapReady(true);
  }, []);

  useEffect(() => {
    const markers = bulkMarkersRef.current;
    return () => {
      importMarkerRef.current?.remove();
      importMarkerRef.current = null;
      existingMarkerRef.current?.remove();
      existingMarkerRef.current = null;
      markers.forEach((marker) => marker.remove());
      markers.clear();
      bulkMarkersRef.current = markers;
      mapRef.current = null;
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapReady) {
      return;
    }

    const ensureBoundary = () => {
      if (!map.isStyleLoaded()) {
        return;
      }

      if (!municipalityBoundary) {
        if (map.getLayer(BOUNDARY_LAYER_ID)) {
          map.removeLayer(BOUNDARY_LAYER_ID);
        }
        if (map.getSource(BOUNDARY_SOURCE_ID)) {
          map.removeSource(BOUNDARY_SOURCE_ID);
        }
        return;
      }

      if (map.getSource(BOUNDARY_SOURCE_ID)) {
        const source = map.getSource(BOUNDARY_SOURCE_ID) as
          | mapboxgl.GeoJSONSource
          | undefined;
        source?.setData(municipalityBoundary as Feature);
      } else {
        map.addSource(BOUNDARY_SOURCE_ID, {
          type: "geojson",
          data: municipalityBoundary as Feature,
        });
      }

      if (!map.getLayer(BOUNDARY_LAYER_ID)) {
        map.addLayer({
          id: BOUNDARY_LAYER_ID,
          type: "line",
          source: BOUNDARY_SOURCE_ID,
          paint: {
            "line-color": "#1976d2",
            "line-width": 2,
          },
        });
      }
    };

    ensureBoundary();
    map.on("style.load", ensureBoundary);

    return () => {
      map.off("style.load", ensureBoundary);
      if (map.getLayer(BOUNDARY_LAYER_ID)) {
        map.removeLayer(BOUNDARY_LAYER_ID);
      }
      if (map.getSource(BOUNDARY_SOURCE_ID)) {
        map.removeSource(BOUNDARY_SOURCE_ID);
      }
    };
  }, [municipalityBoundary, mapReady]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapReady) {
      return;
    }

    const markers = bulkMarkersRef.current;
    markers.forEach((marker) => marker.remove());
    markers.clear();

    const addMarker = (
      key: string,
      lng: number,
      lat: number,
      color: string,
      borderColor: string,
      label: string
    ) => {
      const el = document.createElement("div");
      el.style.width = "9px";
      el.style.height = "9px";
      el.style.borderRadius = "50%";
      el.style.backgroundColor = color;
      el.style.border = `1px solid ${borderColor}`;
      el.style.boxShadow = "0 1px 4px rgba(0,0,0,0.3)";

      const marker = new mapboxgl.Marker({ element: el })
        .setLngLat([lng, lat])
        .setPopup(new mapboxgl.Popup({ offset: 8 }).setHTML(label))
        .addTo(map);

      markers.set(key, marker);
    };

    rows.forEach((row) => {
      const skip = selectedRow?.id === row.id;

      if (
        !skip &&
        typeof row.longitude === "number" &&
        Number.isFinite(row.longitude) &&
        typeof row.latitude === "number" &&
        Number.isFinite(row.latitude)
      ) {
        addMarker(
          `${row.id}-import`,
          row.longitude,
          row.latitude,
          "#66bb6a",
          "#2e7d32",
          `<strong>${row.boardNumber ?? "取込"}</strong><br/>${row.address ?? ""}`
        );
      }

      if (
        !skip &&
        row.matchedBoard?.longitude !== null &&
        row.matchedBoard?.longitude !== undefined &&
        row.matchedBoard?.latitude !== null &&
        row.matchedBoard?.latitude !== undefined
      ) {
        addMarker(
          `${row.id}-existing`,
          row.matchedBoard.longitude,
          row.matchedBoard.latitude,
          "#ffcc80",
          "#ef6c00",
          `<strong>既存</strong><br/>${row.matchedBoard.address ?? ""}`
        );
      }
    });

    return () => {
      markers.forEach((marker) => marker.remove());
      markers.clear();
      bulkMarkersRef.current = markers;
    };
  }, [mapReady, rows, selectedRow?.id]);

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
              `<strong>取込</strong><br/>${selectedRow?.address ?? ""}`
            )
          )
          .addTo(map);
      } else {
        importMarkerRef.current
          .setLngLat(importCoords)
          .setPopup(
            new mapboxgl.Popup({ offset: 12 }).setHTML(
              `<strong>取込</strong><br/>${selectedRow?.address ?? ""}`
            )
          );
      }
      updateMarkerLabel(importMarkerRef.current, "取込");
    } else {
      updateMarkerLabel(importMarkerRef.current, null);
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
      updateMarkerLabel(existingMarkerRef.current, "既存");
    } else {
      updateMarkerLabel(existingMarkerRef.current, null);
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
    } else if (rows.length > 0) {
      const coords: [number, number][] = [];
      rows.forEach((row) => {
        if (
          typeof row.longitude === "number" &&
          Number.isFinite(row.longitude) &&
          typeof row.latitude === "number" &&
          Number.isFinite(row.latitude)
        ) {
          coords.push([row.longitude, row.latitude]);
        }

        if (
          row.matchedBoard?.longitude !== null &&
          row.matchedBoard?.longitude !== undefined &&
          row.matchedBoard?.latitude !== null &&
          row.matchedBoard?.latitude !== undefined
        ) {
          coords.push([row.matchedBoard.longitude, row.matchedBoard.latitude]);
        }
      });

      if (coords.length > 0) {
        const bounds = new mapboxgl.LngLatBounds(coords[0], coords[0]);
        coords.slice(1).forEach((coord) => bounds.extend(coord));
        map.fitBounds(bounds, { padding: 56, duration: 500, maxZoom: 14 });
        return;
      }
    } else if (boundaryBounds) {
      map.fitBounds(
        [
          [boundaryBounds.minLng, boundaryBounds.minLat],
          [boundaryBounds.maxLng, boundaryBounds.maxLat],
        ],
        { padding: 48, duration: 500, maxZoom: 13 }
      );
    }
  }, [boundaryBounds, mapReady, rows, selectedRow, updateMarkerLabel]);

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

      <Stack
        direction="row"
        spacing={1}
        sx={{
          p: 1.5,
          borderTop: "1px solid",
          borderColor: "divider",
          alignItems: "center",
          justifyContent: { xs: "center", sm: "flex-start" },
          gap: 1,
        }}
      >
        <Chip
          label="取込データ"
          size="small"
          sx={{ backgroundColor: "#1976d2", color: "#fff" }}
        />
        <Chip
          label="既存データ"
          size="small"
          sx={{ backgroundColor: "#d32f2f", color: "#fff" }}
        />
        {!selectedRow ? (
          <Typography variant="caption" color="text.secondary">
            行を選択するとピンが表示されます
          </Typography>
        ) : null}
      </Stack>
    </Box>
  );
}

export default BoardImportReviewMap;
