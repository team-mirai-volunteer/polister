import mapboxgl from "mapbox-gl";

const isAlreadyJapanese = (expression: unknown): boolean => {
  if (!expression) {
    return false;
  }

  if (
    Array.isArray(expression) &&
    expression.length >= 3 &&
    expression[0] === "coalesce"
  ) {
    const first = expression[1];
    if (Array.isArray(first) && first[0] === "get" && first[1] === "name_ja") {
      return true;
    }
    return expression.some((child) => isAlreadyJapanese(child));
  }

  return false;
};

// Mapboxのスタイルに日本語ラベルを適用する。Standardスタイル以外では
// basemapコンポーネントが存在しないため、name_jaを優先する形で手動設定する。
export const setMapLanguageToJapanese = (map: mapboxgl.Map) => {
  const style = map.getStyle();
  if (!style?.layers) {
    return;
  }

  style.layers.forEach((layer) => {
    if (layer.type !== "symbol") {
      return;
    }

    const textField = layer.layout?.["text-field"];
    if (!textField || isAlreadyJapanese(textField)) {
      return;
    }

    // 既存の式を尊重しつつ、name_ja を最初に参照する共通式を適用する。
    map.setLayoutProperty(layer.id, "text-field", [
      "coalesce",
      ["get", "name_ja"],
      textField,
    ]);
  });
};
