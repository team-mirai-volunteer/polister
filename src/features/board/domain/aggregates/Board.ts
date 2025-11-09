/**
 * Board 集約ルート
 *
 * 掲示板のドメインモデル
 */

import { Address } from "@/shared/domain/board/Address";
import type {
  BoardStatus,
  TrustLevel,
} from "@/shared/domain/board/BoardAttributes";
import { Coordinates } from "@/shared/domain/board/Coordinates";

export interface BoardProps {
  id: string;
  boardNumber: string | null;
  name: string | null;
  address: Address;
  coordinates: Coordinates;
  municipalityId: string;
  trustLevel: TrustLevel;
  status: BoardStatus;
  note: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface UpdateBoardCommand {
  boardNumber?: string | null;
  name?: string | null;
  address?: string;
  coordinates?: { latitude: number; longitude: number };
  status?: BoardStatus;
  trustLevel?: TrustLevel;
  note?: string | null;
}

export class Board {
  private _id: string;
  private _boardNumber: string | null;
  private _name: string | null;
  private _address: Address;
  private _coordinates: Coordinates;
  private _municipalityId: string;
  private _trustLevel: TrustLevel;
  private _status: BoardStatus;
  private _note: string | null;
  private _createdAt: Date;
  private _updatedAt: Date;

  constructor(props: BoardProps) {
    // バリデーション
    if (!props.id || typeof props.id !== "string") {
      throw new Error("Board requires a valid id");
    }

    if (!props.municipalityId || typeof props.municipalityId !== "string") {
      throw new Error("Board requires a valid municipalityId");
    }

    if (!(props.address instanceof Address)) {
      throw new Error("Board address must be an Address value object");
    }

    if (!(props.coordinates instanceof Coordinates)) {
      throw new Error("Board coordinates must be a Coordinates value object");
    }

    if (!(props.createdAt instanceof Date)) {
      throw new Error("Board createdAt must be a Date");
    }

    if (!(props.updatedAt instanceof Date)) {
      throw new Error("Board updatedAt must be a Date");
    }

    this._id = props.id;
    this._boardNumber = props.boardNumber;
    this._name = props.name;
    this._address = props.address;
    this._coordinates = props.coordinates;
    this._municipalityId = props.municipalityId;
    this._trustLevel = props.trustLevel;
    this._status = props.status;
    this._note = props.note;
    this._createdAt = props.createdAt;
    this._updatedAt = props.updatedAt;
  }

  // Getters
  get id(): string {
    return this._id;
  }

  get boardNumber(): string | null {
    return this._boardNumber;
  }

  get name(): string | null {
    return this._name;
  }

  get address(): Address {
    return this._address;
  }

  get coordinates(): Coordinates {
    return this._coordinates;
  }

  get municipalityId(): string {
    return this._municipalityId;
  }

  get trustLevel(): TrustLevel {
    return this._trustLevel;
  }

  get status(): BoardStatus {
    return this._status;
  }

  get note(): string | null {
    return this._note;
  }

  get createdAt(): Date {
    return this._createdAt;
  }

  get updatedAt(): Date {
    return this._updatedAt;
  }

  /**
   * 掲示板情報を更新
   * ドメインロジックをカプセル化
   */
  update(command: UpdateBoardCommand): void {
    // 掲示板番号の更新
    if (command.boardNumber !== undefined) {
      this._boardNumber = command.boardNumber;
    }

    // 名前の更新
    if (command.name !== undefined) {
      this._name = command.name;
    }

    // 住所の更新
    if (command.address !== undefined) {
      this._address = new Address(command.address);
    }

    // 座標の更新
    if (command.coordinates !== undefined) {
      this._coordinates = new Coordinates(command.coordinates);
    }

    // ステータスの更新
    if (command.status !== undefined) {
      this._status = command.status;
    }

    // 信頼度の更新
    if (command.trustLevel !== undefined) {
      this._trustLevel = command.trustLevel;
    }

    // 備考の更新
    if (command.note !== undefined) {
      this._note = command.note;
    }

    // 更新日時を記録
    this._updatedAt = new Date();
  }

  /**
   * 変更履歴用にスナップショットを取得
   */
  toSnapshot(): BoardSnapshot {
    return {
      id: this._id,
      boardNumber: this._boardNumber,
      name: this._name,
      address: this._address.value,
      latitude: this._coordinates.latitude,
      longitude: this._coordinates.longitude,
      municipalityId: this._municipalityId,
      trustLevel: this._trustLevel,
      status: this._status,
      note: this._note,
      createdAt: this._createdAt.toISOString(),
      updatedAt: this._updatedAt.toISOString(),
    };
  }

  /**
   * プレーンオブジェクトに変換
   */
  toJSON(): BoardProps {
    return {
      id: this._id,
      boardNumber: this._boardNumber,
      name: this._name,
      address: this._address,
      coordinates: this._coordinates,
      municipalityId: this._municipalityId,
      trustLevel: this._trustLevel,
      status: this._status,
      note: this._note,
      createdAt: this._createdAt,
      updatedAt: this._updatedAt,
    };
  }
}

/**
 * 変更履歴記録用のスナップショット型
 */
export interface BoardSnapshot {
  id: string;
  boardNumber: string | null;
  name: string | null;
  address: string;
  latitude: number;
  longitude: number;
  municipalityId: string;
  trustLevel: TrustLevel;
  status: BoardStatus;
  note: string | null;
  createdAt: string;
  updatedAt: string;
}
