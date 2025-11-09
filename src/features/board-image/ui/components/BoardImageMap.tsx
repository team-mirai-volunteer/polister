"use client";

import MapboxMap from "@/components/map/MapboxMap";
import { Alert, Box, Card, Typography } from "@mui/material";
import mapboxgl from "mapbox-gl";
import { useCallback, useEffect, useRef, useState } from "react";

export interface BoardCandidate {
  boardId: string;
  boardNumber: string | null;
  latitude: number;
  longitude: number;
  matchScore: number;
  matchRank: string;
}

interface BoardImageMapProps {
  latitude: number | null;
  longitude: number | null;
  candidates?: BoardCandidate[];
}

export function BoardImageMap({
  latitude,
  longitude,
  candidates = [],
}: BoardImageMapProps) {
  const imageMarkerRef = useRef<mapboxgl.Marker | null>(null);
  const candidateMarkersRef = useRef<mapboxgl.Marker[]>([]);
  const mapInstanceRef = useRef<mapboxgl.Map | null>(null);
  const isInitializedRef = useRef(false);
  const [isMapReady, setIsMapReady] = useState(false);
  const hasLocation = latitude !== null && longitude !== null;

  // デフォルト位置（日本の中心）
  const defaultLatitude = 36.5;
  const defaultLongitude = 138.0;

  const handleMapReady = useCallback((map: mapboxgl.Map | null | undefined) => {
    // 既に初期化済みの場合はスキップ
    if (isInitializedRef.current) return;
    if (!map) {
      console.warn("Map instance is null or undefined");
      return;
    }
    mapInstanceRef.current = map;
    isInitializedRef.current = true;
    setIsMapReady(true);
  }, []);

  // Update markers when candidates or location changes
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !isMapReady) return;

    // Clear existing markers
    if (imageMarkerRef.current) {
      imageMarkerRef.current.remove();
      imageMarkerRef.current = null;
    }
    candidateMarkersRef.current.forEach((m) => m.remove());
    candidateMarkersRef.current = [];

    // Add image location marker (red)
    if (hasLocation) {
      try {
        const imageMarker = new mapboxgl.Marker({ color: "#FF0000" })
          .setLngLat([longitude!, latitude!])
          .setPopup(
            new mapboxgl.Popup().setHTML(
              `<div>
                <strong>撮影位置</strong><br/>
                緯度: ${latitude!.toFixed(7)}<br/>
                経度: ${longitude!.toFixed(7)}
              </div>`
            )
          )
          .addTo(map);

        imageMarkerRef.current = imageMarker;
      } catch (error) {
        console.error("画像マーカー追加エラー:", error);
      }
    }

    // Add candidate board markers
    candidates.forEach((candidate, index) => {
      try {
        const rank = index + 1;
        const color =
          candidate.matchRank === "HIGH"
            ? "#4CAF50"
            : candidate.matchRank === "MEDIUM"
              ? "#FF9800"
              : "#9E9E9E";

        const el = document.createElement("div");
        el.className = "custom-marker";
        el.style.cssText = `
          background-color: ${color};
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
        el.textContent = rank.toString();

        const marker = new mapboxgl.Marker({ element: el })
          .setLngLat([candidate.longitude, candidate.latitude])
          .setPopup(
            new mapboxgl.Popup().setHTML(
              `<div>
                <strong>#${rank} 掲示板 ${candidate.boardNumber || "番号なし"}</strong><br/>
                スコア: ${candidate.matchScore}点 (${candidate.matchRank})<br/>
              </div>`
            )
          )
          .addTo(map);

        candidateMarkersRef.current.push(marker);
      } catch (error) {
        console.error("候補マーカー追加エラー:", error);
      }
    });
  }, [candidates, latitude, longitude, hasLocation, isMapReady]);

  useEffect(() => {
    return () => {
      if (imageMarkerRef.current) {
        imageMarkerRef.current.remove();
      }
      candidateMarkersRef.current.forEach((m) => m.remove());
    };
  }, []);

  return (
    <Card sx={{ position: "relative" }}>
      <MapboxMap
        initialViewState={{
          longitude: hasLocation ? longitude : defaultLongitude,
          latitude: hasLocation ? latitude : defaultLatitude,
          zoom: hasLocation ? 15 : 5,
        }}
        onMapReady={handleMapReady}
        showStyleToggle={true}
        showGeolocate={true}
        mapContainerSx={{ height: 400 }}
      />
      {/* 位置情報がない場合のオーバーレイ */}
      {!hasLocation && (
        <Box
          sx={{
            position: "absolute",
            top: 16,
            left: 16,
            right: 16,
            zIndex: 1,
          }}
        >
          <Alert severity="info">
            <Typography variant="body2">位置情報がありません</Typography>
            <Typography variant="caption" display="block">
              この画像にはExifの位置情報が含まれていません。
              <br />
              CSVにも位置データがありません。
            </Typography>
          </Alert>
        </Box>
      )}
    </Card>
  );
}
