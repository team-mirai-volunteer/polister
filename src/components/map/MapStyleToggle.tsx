"use client";

import {
  Stack,
  ToggleButton,
  ToggleButtonGroup,
  type SxProps,
  type Theme,
} from "@mui/material";

import type { MapStyleKey } from "./mapStyleConfig";

export interface MapStyleToggleProps {
  value: MapStyleKey;
  onChange: (value: MapStyleKey) => void;
  sx?: SxProps<Theme>;
}

const TOGGLE_GROUP_SX = {
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
} as const;

export function MapStyleToggle({ value, onChange, sx }: MapStyleToggleProps) {
  return (
    <Stack
      direction="row"
      spacing={1}
      sx={{
        position: "absolute",
        top: 16,
        left: 16,
        ...sx,
      }}
    >
      <ToggleButtonGroup
        size="small"
        color="primary"
        value={value}
        exclusive
        onChange={(_event, next) => {
          if (next) {
            onChange(next);
          }
        }}
        sx={TOGGLE_GROUP_SX}
      >
        <ToggleButton value="standard">通常</ToggleButton>
        <ToggleButton value="simple">シンプル</ToggleButton>
        <ToggleButton value="satellite">衛星</ToggleButton>
      </ToggleButtonGroup>
    </Stack>
  );
}

export default MapStyleToggle;
