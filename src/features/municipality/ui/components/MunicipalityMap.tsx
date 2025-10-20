/**
 * 自治体地図コンポーネント（Client Component）
 *
 * Mapbox GL JSを使用して自治体のポリゴンを地図上に表示
 */

"use client";

import * as turf from "@turf/turf";
import { useRef } from "react";
import Map, { type MapRef, Layer, Source } from "react-map-gl/mapbox";

interface MunicipalityMapProps {
  geojson: GeoJSON.Feature;
}

export function MunicipalityMap({ geojson }: MunicipalityMapProps) {
  const mapRef = useRef<MapRef>(null);

  // geojsonからboundingBoxを計算して、initialViewStateを設定
  const getInitialViewState = () => {
    try {
      const bbox = turf.bbox(geojson);
      const center = turf.center(geojson);

      // bboxのサイズから適切なズームレベルを計算
      const [minLng, minLat, maxLng, maxLat] = bbox;
      const lngDiff = maxLng - minLng;
      const latDiff = maxLat - minLat;
      const maxDiff = Math.max(lngDiff, latDiff);

      // 大まかなズームレベルの推定
      let zoom = 10;
      if (maxDiff > 2) zoom = 6;
      else if (maxDiff > 1) zoom = 7;
      else if (maxDiff > 0.5) zoom = 8;
      else if (maxDiff > 0.2) zoom = 9;
      else if (maxDiff > 0.1) zoom = 10;
      else if (maxDiff > 0.05) zoom = 11;
      else zoom = 12;

      return {
        longitude: center.geometry.coordinates[0],
        latitude: center.geometry.coordinates[1],
        zoom,
      };
    } catch (error) {
      console.error("Failed to calculate initial view state:", error);
      // フォールバック: 日本の中心付近
      return {
        longitude: 139.6917,
        latitude: 35.6895,
        zoom: 9,
      };
    }
  };

  // onLoadイベントでfitBoundsを実行（より確実）
  const handleMapLoad = () => {
    const map = mapRef.current?.getMap();
    if (!map || !geojson) return;

    try {
      const bbox = turf.bbox(geojson);
      map.fitBounds(bbox as [number, number, number, number], {
        padding: 50,
        duration: 0, // 初回は即座に
      });
    } catch (error) {
      console.error("Failed to fit bounds:", error);
    }
  };

  const mapboxToken = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN;

  if (!mapboxToken) {
    return (
      <div style={{ padding: "20px", textAlign: "center", color: "#666" }}>
        Mapboxアクセストークンが設定されていません
      </div>
    );
  }

  return (
    <div style={{ width: "100%", height: "600px" }}>
      <Map
        ref={mapRef}
        mapboxAccessToken={mapboxToken}
        initialViewState={getInitialViewState()}
        onLoad={handleMapLoad}
        style={{ width: "100%", height: "100%" }}
        mapStyle="mapbox://styles/mapbox/streets-v12"
      >
        {/* ポリゴンデータソース */}
        <Source id="municipality" type="geojson" data={geojson}>
          {/* 塗りつぶしレイヤー */}
          <Layer
            id="municipality-fill"
            type="fill"
            paint={{
              "fill-color": "#088",
              "fill-opacity": 0.3,
            }}
          />

          {/* 境界線レイヤー */}
          <Layer
            id="municipality-line"
            type="line"
            paint={{
              "line-color": "#088",
              "line-width": 2,
            }}
          />
        </Source>
      </Map>
    </div>
  );
}
