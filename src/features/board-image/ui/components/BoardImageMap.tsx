"use client";

import MapboxMap from "@/components/map/MapboxMap";
import { createPhotoMarkerElement } from "@/features/board-image/ui/utils/createPhotoMarkerElement";
import { createBoardMarkerElement } from "@/features/board/ui/utils/boardMarkerStyle";
import { Alert, Box, Card, Typography } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import mapboxgl from "mapbox-gl";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import type { BoardCandidateDTO } from "@/features/board-image/application/actions/getBoardCandidatesAction";

interface BoardImageMapProps {
  latitude: number | null;
  longitude: number | null;
  previewUrl?: string | null;
  linkedBoard?: {
    id: string;
    boardNumber: string | null;
    name: string | null;
    latitude: number | null;
    longitude: number | null;
    address: string;
  } | null;
  candidates?: BoardCandidateDTO[];
}

export function BoardImageMap({
  latitude,
  longitude,
  previewUrl,
  linkedBoard,
  candidates = [],
}: BoardImageMapProps) {
  const theme = useTheme();
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const markerRef = useRef<mapboxgl.Marker | null>(null);
  const boardMarkerRef = useRef<mapboxgl.Marker | null>(null);
  const candidateMarkersRef = useRef<mapboxgl.Marker[]>([]);
  const [mapReady, setMapReady] = useState(false);

  const hasLocation = latitude !== null && longitude !== null;
  const hasLinkedBoardLocation = Boolean(
    linkedBoard &&
      linkedBoard.latitude !== null &&
      linkedBoard.longitude !== null
  );
  const defaultLatitude = 36.5;
  const defaultLongitude = 138.0;

  const initialViewState = useMemo(
    () => ({
      longitude:
        hasLocation && longitude !== null ? longitude : defaultLongitude,
      latitude: hasLocation && latitude !== null ? latitude : defaultLatitude,
      zoom: hasLocation ? 15 : 5,
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  const handleMapReady = useCallback((map: mapboxgl.Map) => {
    mapRef.current = map;
    setMapReady(true);
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapReady) {
      return;
    }

    markerRef.current?.remove();
    markerRef.current = null;

    if (hasLocation) {
      const markerElement = createPhotoMarkerElement({
        previewUrl: previewUrl ?? undefined,
        label: "撮影位置",
        fallbackText: "PHOTO",
      });
      markerElement.style.zIndex = "40";

      const marker = new mapboxgl.Marker({ element: markerElement })
        .setLngLat([longitude!, latitude!])
        .setPopup(
          new mapboxgl.Popup({ offset: 12 }).setHTML(
            `<strong>撮影位置</strong><br/>緯度: ${latitude!.toFixed(
              6
            )}<br/>経度: ${longitude!.toFixed(6)}`
          )
        )
        .addTo(map);

      markerRef.current = marker;

      map.easeTo({
        center: [longitude!, latitude!],
        zoom: 16,
        duration: 500,
      });
    } else if (hasLinkedBoardLocation && linkedBoard) {
      const boardLng = linkedBoard.longitude!;
      const boardLat = linkedBoard.latitude!;
      map.easeTo({
        center: [boardLng, boardLat],
        zoom: 16,
        duration: 500,
      });
    }
  }, [
    hasLocation,
    hasLinkedBoardLocation,
    latitude,
    longitude,
    linkedBoard,
    mapReady,
    previewUrl,
  ]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapReady) {
      return;
    }

    boardMarkerRef.current?.remove();
    boardMarkerRef.current = null;

    if (!hasLinkedBoardLocation || !linkedBoard) {
      return;
    }

    const palette = {
      primary: theme.palette.primary.main,
      secondary: theme.palette.secondary.main,
      white: theme.palette.common.white,
    };

    const label = linkedBoard.boardNumber
      ? `掲示場 ${linkedBoard.boardNumber}`
      : (linkedBoard.name ?? "掲示場");

    const boardLng = linkedBoard.longitude!;
    const boardLat = linkedBoard.latitude!;

    const markerElement = createBoardMarkerElement(palette, {
      label,
      interactive: false,
      isFocused: true,
      size: 18,
      focusedSize: 22,
    });
    markerElement.style.zIndex = "45";

    const popup = new mapboxgl.Popup({ offset: 12 }).setHTML(
      `<strong>${label}</strong><br/>${linkedBoard.address ?? ""}`
    );

    boardMarkerRef.current = new mapboxgl.Marker({ element: markerElement })
      .setLngLat([boardLng, boardLat])
      .setPopup(popup)
      .addTo(map);
  }, [
    hasLinkedBoardLocation,
    linkedBoard,
    mapReady,
    theme.palette.common.white,
    theme.palette.primary.main,
    theme.palette.secondary.main,
  ]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapReady) {
      return;
    }

    candidateMarkersRef.current.forEach((marker) => marker.remove());
    candidateMarkersRef.current = [];

    if (candidates.length === 0) {
      return;
    }

    candidates.forEach((candidate, index) => {
      try {
        const rankColor =
          candidate.matchRank === "HIGH"
            ? "#4CAF50"
            : candidate.matchRank === "MEDIUM"
              ? "#FF9800"
              : "#9E9E9E";

        const el = document.createElement("div");
        el.style.cssText = `
          background-color: ${rankColor};
          width: 32px;
          height: 32px;
          border-radius: 50%;
          border: 3px solid white;
          box-shadow: 0 2px 4px rgba(0,0,0,0.3);
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-weight: bold;
          font-size: 14px;
          cursor: pointer;
        `;
        el.textContent = String(index + 1);

        const marker = new mapboxgl.Marker({ element: el })
          .setLngLat([candidate.longitude, candidate.latitude])
          .setPopup(
            new mapboxgl.Popup().setHTML(
              `<div>
                <strong>#${index + 1} 掲示場 ${candidate.boardNumber || "番号なし"}</strong><br/>
                スコア: ${candidate.matchScore} (${candidate.matchRank})<br/>
                ${candidate.address}
              </div>`
            )
          )
          .addTo(map);

        candidateMarkersRef.current.push(marker);
      } catch (error) {
        console.error("候補マーカーの描画に失敗しました:", error);
      }
    });
  }, [candidates, mapReady]);

  useEffect(() => {
    return () => {
      markerRef.current?.remove();
      markerRef.current = null;
      boardMarkerRef.current?.remove();
      boardMarkerRef.current = null;
      candidateMarkersRef.current.forEach((marker) => marker.remove());
      candidateMarkersRef.current = [];
      mapRef.current = null;
      setMapReady(false);
    };
  }, []);

  return (
    <Card sx={{ position: "relative" }}>
      <MapboxMap
        initialViewState={initialViewState}
        onMapReady={handleMapReady}
        showGeolocate={false}
        mapContainerSx={{ height: 400 }}
      />
      {!hasLocation && (
        <Box
          sx={{
            position: "absolute",
            top: 72,
            left: 16,
            right: 16,
            zIndex: 1,
          }}
        >
          <Alert severity="info">
            <Typography variant="body2">位置情報がありません</Typography>
            <Typography variant="caption" display="block">
              この画像には位置情報が登録されていません。
            </Typography>
          </Alert>
        </Box>
      )}
    </Card>
  );
}
