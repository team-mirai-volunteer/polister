export type ImageStatusColor =
  | "default"
  | "success"
  | "error"
  | "warning"
  | "info";

export const getImageStatusColor = (status: string): ImageStatusColor => {
  switch (status) {
    case "VERIFIED":
      return "success";
    case "REJECTED":
      return "error";
    case "LOCATION_ISSUE":
      return "warning";
    case "DUPLICATE":
      return "default";
    case "NO_NUMBER":
      return "info";
    case "DOWNLOAD_FAILED":
      return "error";
    default:
      return "default";
  }
};

export const getImageStatusLabel = (status: string): string => {
  switch (status) {
    case "PENDING":
      return "未検証";
    case "VERIFIED":
      return "検証済み";
    case "REJECTED":
      return "却下";
    case "LOCATION_ISSUE":
      return "位置情報に問題";
    case "DUPLICATE":
      return "重複";
    case "NO_NUMBER":
      return "番号なし";
    case "DOWNLOAD_FAILED":
      return "ダウンロード失敗";
    default:
      return status;
  }
};
