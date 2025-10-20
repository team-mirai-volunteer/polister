import type {
  BoardStatus,
  TrustLevel,
} from "@/shared/domain/board/BoardAttributes";

export interface BoardLocationDTO {
  id: string;
  boardNumber: number | null;
  name: string | null;
  address: string;
  longitude: number | null;
  latitude: number | null;
  status: BoardStatus;
  trustLevel: TrustLevel;
}
