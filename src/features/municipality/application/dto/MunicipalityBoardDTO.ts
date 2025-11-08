import type {
  BoardStatus,
  TrustLevel,
} from "../../domain/value-objects/BoardAttributes";

export interface MunicipalityBoardDTO {
  id: string;
  boardNumber: string | null;
  name: string | null;
  address: string;
  longitude: number | null;
  latitude: number | null;
  status: BoardStatus;
  trustLevel: TrustLevel;
}
