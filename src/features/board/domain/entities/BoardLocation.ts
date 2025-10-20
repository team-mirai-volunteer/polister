/**
 * BoardLocation エンティティ
 *
 * Map表示用に簡略化した掲示板位置情報
 */

import type {
  BoardStatus,
  TrustLevel,
} from "@/shared/domain/board/BoardAttributes";

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
  constructor(private readonly props: Readonly<BoardLocationProps>) {
    if (!props.id) {
      throw new Error("BoardLocation requires id");
    }

    if (!props.address || props.address.trim().length === 0) {
      throw new Error("BoardLocation requires a non-empty address");
    }

    if (props.longitude !== null) {
      if (
        typeof props.longitude !== "number" ||
        !Number.isFinite(props.longitude) ||
        props.longitude < -180 ||
        props.longitude > 180
      ) {
        throw new Error(
          "BoardLocation longitude must be a finite value within [-180, 180]"
        );
      }
    }

    if (props.latitude !== null) {
      if (
        typeof props.latitude !== "number" ||
        !Number.isFinite(props.latitude) ||
        props.latitude < -90 ||
        props.latitude > 90
      ) {
        throw new Error(
          "BoardLocation latitude must be a finite value within [-90, 90]"
        );
      }
    }

    if (props.boardNumber !== null) {
      if (
        typeof props.boardNumber !== "number" ||
        !Number.isInteger(props.boardNumber) ||
        props.boardNumber < 0
      ) {
        throw new Error(
          "BoardLocation boardNumber must be a non-negative integer"
        );
      }
    }
  }

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
