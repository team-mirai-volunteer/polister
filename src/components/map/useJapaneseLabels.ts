import mapboxgl from "mapbox-gl";

const containsNameJa = (expression: unknown): boolean => {
  if (!Array.isArray(expression)) {
    return false;
  }

  if (expression[0] === "get" && expression[1] === "name_ja") {
    return true;
  }

  return expression.some((child) => containsNameJa(child));
};

const isFormatExpression = (expression: unknown): boolean =>
  Array.isArray(expression) && expression[0] === "format";

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
    if (!textField || containsNameJa(textField)) {
      return;
    }

    const preferredField = (isFormatExpression(textField)
      ? [
          "coalesce",
          [
            "format",
            [
              "coalesce",
              ["get", "name_ja"],
              ["get", "name:ja"],
            ],
          ],
          textField,
        ]
      : [
          "coalesce",
          ["get", "name_ja"],
          ["get", "name:ja"],
          textField,
        ]) as mapboxgl.Expression;

    map.setLayoutProperty(layer.id, "text-field", preferredField);
  });
};
