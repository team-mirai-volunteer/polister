const HTML_ESCAPE_MAP: Record<string, string> = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&#39;",
};

/**
 * HTML 文字列へ埋め込む値をエスケープする。
 * mapbox の Popup.setHTML などへユーザー由来の値を渡す際に使用する。
 */
export const escapeHtml = (value: unknown): string => {
  if (value === null || value === undefined) {
    return "";
  }

  return String(value).replace(/[&<>"']/g, (char) => HTML_ESCAPE_MAP[char]);
};
