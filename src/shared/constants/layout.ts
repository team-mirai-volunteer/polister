export const APP_BAR_HEIGHT = {
  xs: 56,
  md: 72,
} as const;

export const LIST_PAGE_CONTAINER_SX = {
  py: 3,
  display: "flex",
  flexDirection: "column" as const,
  gap: 2,
  overflow: "hidden",
  height: {
    xs: `calc(100vh - ${APP_BAR_HEIGHT.xs}px)` as const,
    md: `calc(100vh - ${APP_BAR_HEIGHT.md}px)` as const,
  },
};

export const LIST_PAGE_HEADER_SX = {
  display: "flex",
  alignItems: "baseline",
  justifyContent: "space-between",
  flexWrap: { xs: "wrap", sm: "nowrap" } as const,
  gap: 1,
};

export const LIST_PAGE_BODY_SX = {
  flex: 1,
  minHeight: 0,
  display: "flex",
  width: "100%",
  overflow: "hidden",
};
