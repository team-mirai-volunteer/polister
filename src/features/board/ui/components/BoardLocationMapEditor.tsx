"use client";

/**
 * 掲示板位置編集マップコンポーネント
 *
 * 共通のMapboxMapコンポーネントを使用してドラッグ可能なマーカーを表示
 */

import MapboxMap from "@/components/map/MapboxMap";
import mapboxgl from "mapbox-gl";
import { useCallback, useEffect, useMemo, useRef } from "react";

export interface BoardLocationMapEditorProps {
  latitude: number;
  longitude: number;
  onLocationChange?: (latitude: number, longitude: number) => void;
  readonly?: boolean;
  height?: number | string;
}

export function BoardLocationMapEditor({
  latitude,
  longitude,
  onLocationChange,
  readonly = false,
  height = 400,
}: BoardLocationMapEditorProps) {
  const markerRef = useRef<mapboxgl.Marker | null>(null);
  const isDraggingRef = useRef(false);

  // 初期座標を固定（地図の再初期化を防ぐ）
  const initialViewState = useMemo(
    () => ({
      longitude,
      latitude,
      zoom: 16,
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [] // 初回のみ計算
  );

  // 地図の準備完了時にマーカーを追加
  const handleMapReady = useCallback(
    (map: mapboxgl.Map) => {
      // マーカーを作成
      const marker = new mapboxgl.Marker({
        draggable: !readonly,
        color: "#1976d2",
      })
        .setLngLat([longitude, latitude])
        .addTo(map);

      markerRef.current = marker;

      if (!readonly) {
        // ドラッグ開始
        marker.on("dragstart", () => {
          isDraggingRef.current = true;
        });

        // ドラッグ終了
        marker.on("dragend", () => {
          isDraggingRef.current = false;
          const lngLat = marker.getLngLat();
          onLocationChange?.(lngLat.lat, lngLat.lng);
        });
      }

      // スタイル変更時にマーカーを再追加
      const handleStyleData = () => {
        if (markerRef.current) {
          const currentLngLat = markerRef.current.getLngLat();
          markerRef.current.remove();

          const newMarker = new mapboxgl.Marker({
            draggable: !readonly,
            color: "#1976d2",
          })
            .setLngLat(currentLngLat)
            .addTo(map);

          markerRef.current = newMarker;

          if (!readonly) {
            newMarker.on("dragstart", () => {
              isDraggingRef.current = true;
            });

            newMarker.on("dragend", () => {
              isDraggingRef.current = false;
              const lngLat = newMarker.getLngLat();
              onLocationChange?.(lngLat.lat, lngLat.lng);
            });
          }
        }
      };

      map.on("styledata", handleStyleData);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [readonly] // readonlyのみ依存
  );

  // 外部からの座標変更（フィールド入力）でマーカーを更新
  useEffect(() => {
    const marker = markerRef.current;

    // ドラッグ中は外部からの更新を無視
    if (!marker || isDraggingRef.current) {
      return;
    }

    const currentLngLat = marker.getLngLat();
    const hasChanged =
      Math.abs(currentLngLat.lat - latitude) > 0.000001 ||
      Math.abs(currentLngLat.lng - longitude) > 0.000001;

    if (hasChanged) {
      marker.setLngLat([longitude, latitude]);
    }
  }, [latitude, longitude]);

  return (
    <MapboxMap
      initialViewState={initialViewState}
      onMapReady={handleMapReady}
      showStyleToggle={true}
      showGeolocate={false}
      mapContainerSx={{
        height,
        borderRadius: 1,
      }}
    />
  );
}
