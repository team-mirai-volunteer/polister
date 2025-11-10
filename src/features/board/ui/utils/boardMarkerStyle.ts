export interface BoardMarkerPalette {
  primary: string;
  secondary: string;
  white: string;
}

export interface BoardMarkerStyleOptions {
  size?: number;
  focusedSize?: number;
}

export function applyBoardMarkerStyle(
  element: HTMLElement,
  isFocused: boolean,
  palette: BoardMarkerPalette,
  options?: BoardMarkerStyleOptions
): void {
  const baseSize = options?.size ?? 14;
  const focusedSize = options?.focusedSize ?? 18;
  const size = isFocused ? focusedSize : baseSize;

  element.style.width = `${size}px`;
  element.style.height = `${size}px`;
  element.style.borderRadius = "50%";
  element.style.backgroundColor = isFocused
    ? palette.secondary
    : palette.primary;
  element.style.opacity = isFocused ? "1" : "0.75";
  element.style.border = `2px solid ${palette.white}`;
  element.style.boxShadow = isFocused
    ? "0 0 0 3px rgba(228,0,20,0.25)"
    : "0 0 6px rgba(29,41,61,0.25)";
  element.style.transition =
    "background-color 0.2s ease, box-shadow 0.2s ease, opacity 0.2s ease";
  element.style.transform = isFocused ? "scale(1.1)" : "scale(1)";
}

export function createBoardMarkerElement(
  palette: BoardMarkerPalette,
  {
    label,
    isFocused = false,
    interactive = true,
    size,
    focusedSize,
  }: {
    label?: string;
    isFocused?: boolean;
    interactive?: boolean;
    size?: number;
    focusedSize?: number;
  } = {}
) {
  const element = document.createElement(interactive ? "button" : "div");
  element.style.border = "none";
  element.style.padding = "0";
  element.style.background = "transparent";
  element.style.cursor = interactive ? "pointer" : "default";
  element.style.outline = "none";
  element.style.transition =
    "background-color 0.2s ease, box-shadow 0.2s ease, opacity 0.2s ease";
  if (interactive) {
    (element as HTMLButtonElement).type = "button";
  }

  if (label) {
    element.setAttribute("aria-label", label);
    element.setAttribute("title", label);
  }

  applyBoardMarkerStyle(element, isFocused, palette, { size, focusedSize });

  return element;
}
