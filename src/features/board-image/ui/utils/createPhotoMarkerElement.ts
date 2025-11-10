export interface CreatePhotoMarkerOptions {
  previewUrl?: string | null;
  order?: number;
  label?: string;
  size?: number;
  fallbackText?: string;
}

export function createPhotoMarkerElement({
  previewUrl,
  order,
  label,
  size = 56,
  fallbackText = "No Image",
}: CreatePhotoMarkerOptions): HTMLDivElement {
  const element = document.createElement("div");
  element.style.width = `${size}px`;
  element.style.height = `${size}px`;
  element.style.borderRadius = "12px";
  element.style.border = "2px solid #fff";
  element.style.boxShadow = "0 4px 12px rgba(0,0,0,0.25)";
  element.style.backgroundColor = "#d32f2f";
  element.style.backgroundSize = "cover";
  element.style.backgroundPosition = "center";
  element.style.position = "relative";
  element.style.overflow = "hidden";
  element.style.cursor = "pointer";
  element.style.zIndex = "10";

  if (previewUrl) {
    element.style.backgroundImage = `url(${previewUrl})`;
  } else {
    element.style.display = "flex";
    element.style.alignItems = "center";
    element.style.justifyContent = "center";
    element.style.color = "#fff";
    element.style.fontSize = "10px";
    element.style.fontWeight = "bold";
    element.textContent = fallbackText;
  }

  if (typeof order === "number") {
    const badge = document.createElement("div");
    badge.textContent = `${order}`;
    badge.style.position = "absolute";
    badge.style.top = "4px";
    badge.style.left = "4px";
    badge.style.width = "20px";
    badge.style.height = "20px";
    badge.style.borderRadius = "999px";
    badge.style.backgroundColor = "rgba(0, 0, 0, 0.7)";
    badge.style.color = "#fff";
    badge.style.fontSize = "12px";
    badge.style.display = "flex";
    badge.style.alignItems = "center";
    badge.style.justifyContent = "center";
    badge.style.fontWeight = "bold";
    badge.style.pointerEvents = "none";
    element.appendChild(badge);
  }

  if (label) {
    element.setAttribute("aria-label", label);
    element.setAttribute("title", label);
  }

  return element;
}
