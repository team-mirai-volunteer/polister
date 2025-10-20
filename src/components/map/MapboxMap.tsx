"use client";

import {
  Alert,
  Box,
  Stack,
  ToggleButton,
  ToggleButtonGroup,
} from "@mui/material";
import mapboxgl from "mapbox-gl";

import { SyntheticEvent, useEffect, useRef, useState } from "react";

import type { MapStyleKey } from "./mapStyleConfig";
import {
  DEFAULT_CENTER,
  DEFAULT_ZOOM,
  MAP_STYLE_URLS,
  applyPosterStyling,
} from "./mapStyleConfig";
import { setMapLanguageToJapanese } from "./useJapaneseLabels";

const MapboxMap = () => {
  const accessToken = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN;
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const appliedStyleRef = useRef<MapStyleKey | null>(null);
  const styleStateRef = useRef<MapStyleKey>("poster");
  const geolocateControlRef = useRef<mapboxgl.GeolocateControl | null>(null);
  const [mapStyle, setMapStyle] = useState<MapStyleKey>("poster");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!accessToken) {
      return;
    }
    mapboxgl.accessToken = accessToken;
  }, [accessToken]);

  useEffect(() => {
    if (!accessToken) {
      return;
    }

    if (!containerRef.current || mapRef.current) {
      return;
    }

    if (!mapboxgl.supported()) {
      setError("お使いのブラウザではMapbox GLがサポートされていません。");
      return;
    }

    const map = new mapboxgl.Map({
      container: containerRef.current,
      style: MAP_STYLE_URLS.poster,
      center: DEFAULT_CENTER,
      zoom: DEFAULT_ZOOM,
      attributionControl: false,
    });

    mapRef.current = map;
    appliedStyleRef.current = "poster";

    const navigationControl = new mapboxgl.NavigationControl({
      visualizePitch: true,
    });
    map.addControl(navigationControl, "top-right");

    const geolocateControl = new mapboxgl.GeolocateControl({
      positionOptions: { enableHighAccuracy: true },
      trackUserLocation: true,
      showUserHeading: true,
    });

    geolocateControlRef.current = geolocateControl;
    map.addControl(geolocateControl, "top-right");

    const handleStyleData = () => {
      setMapLanguageToJapanese(map);
      if (styleStateRef.current === "poster") {
        applyPosterStyling(map);
      }
    };

    map.on("styledata", handleStyleData);

    return () => {
      map.off("styledata", handleStyleData);
      map.remove();
      geolocateControlRef.current = null;
      mapRef.current = null;
      appliedStyleRef.current = null;
    };
  }, [accessToken]);

  useEffect(() => {
    styleStateRef.current = mapStyle;
    const map = mapRef.current;
    if (!map) {
      return;
    }

    if (appliedStyleRef.current === mapStyle) {
      return;
    }

    appliedStyleRef.current = mapStyle;
    map.setStyle(MAP_STYLE_URLS[mapStyle]);
  }, [mapStyle]);

  const handleStyleChange = (
    _event: SyntheticEvent,
    nextStyle: MapStyleKey | null
  ) => {
    if (!nextStyle) {
      return;
    }
    setMapStyle(nextStyle);
  };

  if (!accessToken) {
    return (
      <Alert severity="warning">
        Mapboxのアクセストークンが設定されていません。`.env.local`に`NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN`を追加してください。
      </Alert>
    );
  }

  return (
    <Box sx={{ position: "relative" }}>
      <Box
        ref={containerRef}
        sx={{
          width: "100%",
          height: { xs: 320, md: 520 },
          borderRadius: 2,
          overflow: "hidden",
        }}
      />

      {error ? (
        <Alert
          severity="error"
          sx={{
            position: "absolute",
            top: 16,
            left: 16,
            right: 16,
          }}
        >
          {error}
        </Alert>
      ) : (
        <Stack
          direction="row"
          spacing={1}
          sx={{
            position: "absolute",
            top: 16,
            left: 16,
          }}
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
              display: "inline-flex",
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
      )}
    </Box>
  );
};

export default MapboxMap;
