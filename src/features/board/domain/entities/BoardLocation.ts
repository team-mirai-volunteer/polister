/**
 * BoardLocation エンティティ
 *
 * Map表示用に簡略化した掲示板位置情報
 */

import type {
  BoardStatus,
  TrustLevel,
} from "@/features/municipality/domain/value-objects/BoardAttributes";

export interface BoardLocationProps {
  id: string;
  boardNumber: number | null;
  name: string | null;
  address: string;
  longitude: number | null;
  latitude: number | null;
  status: BoardStatus;
  trustLevel: TrustLevel;
}

export class BoardLocation {
  constructor(private readonly props: BoardLocationProps) {}

  get id(): string {
    return this.props.id;
  }

  get boardNumber(): number | null {
    return this.props.boardNumber;
  }

  get name(): string | null {
    return this.props.name;
  }

  get address(): string {
    return this.props.address;
  }

  get longitude(): number | null {
    return this.props.longitude;
  }

  get latitude(): number | null {
    return this.props.latitude;
  }

  get status(): BoardStatus {
    return this.props.status;
  }

  get trustLevel(): TrustLevel {
    return this.props.trustLevel;
  }
}
