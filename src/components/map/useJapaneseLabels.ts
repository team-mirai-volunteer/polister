import mapboxgl from "mapbox-gl";

const containsNameJa = (expression: unknown): boolean => {
  if (!Array.isArray(expression)) {
    return false;
  }

  if (expression[0] === "get" && expression[1] === "name_ja") {
    return true;
  }

  return expression.some(
    (child) => Array.isArray(child) && containsNameJa(child)
  );
};

const isFormatExpression = (expression: unknown): boolean =>
  Array.isArray(expression) && expression[0] === "format";

const containsZoomExpression = (expression: unknown): boolean => {
  if (expression === "zoom") {
    return true;
  }

  if (!Array.isArray(expression)) {
    return false;
  }

  if (expression[0] === "zoom") {
    return true;
  }

  return expression.some(
    (child) => Array.isArray(child) && containsZoomExpression(child)
  );
};

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
    if (
      !textField ||
      containsNameJa(textField) ||
      containsZoomExpression(textField)
    ) {
      return;
    }

    const preferredField = (
      isFormatExpression(textField)
        ? [
            "coalesce",
            ["format", ["coalesce", ["get", "name_ja"], ["get", "name:ja"]]],
            textField,
          ]
        : ["coalesce", ["get", "name_ja"], ["get", "name:ja"], textField]
    ) as mapboxgl.Expression;

    map.setLayoutProperty(layer.id, "text-field", preferredField);
  });
};
