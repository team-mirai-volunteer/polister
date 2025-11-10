"use client";

/**
 * 掲示板位置編集マップコンポーネント
 *
 * 共通のMapboxMapコンポーネントを使用してドラッグ可能なマーカーを表示
 */

import MapboxMap from "@/components/map/MapboxMap";
import { createPhotoMarkerElement } from "@/features/board-image/ui/utils/createPhotoMarkerElement";
import mapboxgl from "mapbox-gl";
import { useCallback, useEffect, useMemo, useRef } from "react";

export interface BoardLocationMapEditorProps {
  latitude: number;
  longitude: number;
  onLocationChange?: (latitude: number, longitude: number) => void;
  readonly?: boolean;
  height?: number | string;
  relatedImages?: Array<{
    id: string;
    latitude: number;
    longitude: number;
    label?: string;
    previewUrl?: string | null;
    href?: string;
    order?: number;
  }>;
}

export function BoardLocationMapEditor({
  latitude,
  longitude,
  onLocationChange,
  readonly = false,
  height = 400,
  relatedImages,
}: BoardLocationMapEditorProps) {
  const markerRef = useRef<mapboxgl.Marker | null>(null);
  const isDraggingRef = useRef(false);
  const onLocationChangeRef = useRef(onLocationChange);
  const mapInstanceRef = useRef<mapboxgl.Map | null>(null);
  const relatedImagesRef =
    useRef<BoardLocationMapEditorProps["relatedImages"]>(relatedImages);
  const imageMarkersRef = useRef<mapboxgl.Marker[]>([]);

  // onLocationChangeの最新値を保持
  useEffect(() => {
    onLocationChangeRef.current = onLocationChange;
  }, [onLocationChange]);

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

  const clearImageMarkers = useCallback(() => {
    imageMarkersRef.current.forEach((marker) => {
      marker.remove();
    });
    imageMarkersRef.current = [];
  }, []);

  const addImageMarkersFromRef = useCallback(
    (map: mapboxgl.Map) => {
      clearImageMarkers();

      const items = relatedImagesRef.current ?? [];
      items
        .filter(
          (
            image
          ): image is NonNullable<
            BoardLocationMapEditorProps["relatedImages"]
          >[number] & {
            latitude: number;
            longitude: number;
          } =>
            typeof image.latitude === "number" &&
            typeof image.longitude === "number"
        )
        .forEach((image) => {
          const markerElement = createPhotoMarkerElement({
            previewUrl: image.previewUrl ?? undefined,
            order: image.order,
            label: image.label,
          });

          const marker = new mapboxgl.Marker({ element: markerElement })
            .setLngLat([image.longitude, image.latitude])
            .addTo(map);

          const popup = new mapboxgl.Popup({ offset: 12 });
          const popupNode = document.createElement("div");
          popupNode.style.maxWidth = "200px";
          popupNode.style.display = "flex";
          popupNode.style.flexDirection = "column";
          popupNode.style.gap = "4px";

          if (image.previewUrl) {
            const imgEl = document.createElement("img");
            imgEl.src = image.previewUrl;
            imgEl.alt = image.label ?? "関連写真";
            imgEl.style.width = "100%";
            imgEl.style.height = "120px";
            imgEl.style.objectFit = "cover";
            imgEl.style.borderRadius = "4px";
            popupNode.appendChild(imgEl);
          }

          const labelEl = document.createElement("div");
          labelEl.textContent = image.label ?? "関連写真";
          labelEl.style.fontSize = "0.85rem";
          labelEl.style.fontWeight = "bold";
          popupNode.appendChild(labelEl);

          if (image.href) {
            const linkEl = document.createElement("a");
            linkEl.href = image.href;
            linkEl.textContent = "詳細を見る";
            linkEl.style.fontSize = "0.75rem";
            linkEl.style.color = "#1976d2";
            linkEl.style.textDecoration = "underline";
            linkEl.target = "_blank";
            linkEl.rel = "noreferrer";
            popupNode.appendChild(linkEl);
          }

          popup.setDOMContent(popupNode);
          marker.setPopup(popup);

          imageMarkersRef.current.push(marker);
        });
    },
    [clearImageMarkers]
  );

  useEffect(() => {
    relatedImagesRef.current = relatedImages;
    if (mapInstanceRef.current) {
      addImageMarkersFromRef(mapInstanceRef.current);
    }
  }, [addImageMarkersFromRef, relatedImages]);

  useEffect(() => {
    return () => {
      clearImageMarkers();
    };
  }, [clearImageMarkers]);

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

      const applyPrimaryMarkerStyle = (el: HTMLElement | null) => {
        if (!el) return;
        el.style.zIndex = "50";
        el.style.filter = "drop-shadow(0 4px 8px rgba(0,0,0,0.35))";
      };

      applyPrimaryMarkerStyle(marker.getElement());
      markerRef.current = marker;
      mapInstanceRef.current = map;

      addImageMarkersFromRef(map);

      if (!readonly) {
        // ドラッグ開始
        marker.on("dragstart", () => {
          isDraggingRef.current = true;
        });

        // ドラッグ終了 - refから最新のコールバックを参照
        marker.on("dragend", () => {
          isDraggingRef.current = false;
          const lngLat = marker.getLngLat();
          onLocationChangeRef.current?.(lngLat.lat, lngLat.lng);
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

          applyPrimaryMarkerStyle(newMarker.getElement());
          markerRef.current = newMarker;

          if (!readonly) {
            newMarker.on("dragstart", () => {
              isDraggingRef.current = true;
            });

            // ドラッグ終了 - refから最新のコールバックを参照
            newMarker.on("dragend", () => {
              isDraggingRef.current = false;
              const lngLat = newMarker.getLngLat();
              onLocationChangeRef.current?.(lngLat.lat, lngLat.lng);
            });
          }
        }

        if (map) {
          addImageMarkersFromRef(map);
        }
      };

      map.on("styledata", handleStyleData);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [readonly, addImageMarkersFromRef]
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
