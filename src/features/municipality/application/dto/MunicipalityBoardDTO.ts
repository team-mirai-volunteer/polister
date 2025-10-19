import type { BoardStatus, TrustLevel } from "@prisma/client";

export interface MunicipalityBoardDTO {
  id: string;
  boardNumber: number | null;
  name: string | null;
  address: string;
  longitude: number | null;
  latitude: number | null;
  status: BoardStatus;
  trustLevel: TrustLevel;
}
