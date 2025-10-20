/**
 * Municipality エンティティ
 *
 * 市区町村の情報を表現するドメインエンティティ
 */

import type { ContactStatus, MunicipalityStatus } from "@prisma/client";
import { MunicipalityCode } from "../value-objects/MunicipalityCode";

export class Municipality {
  constructor(
    public readonly id: string,
    public readonly name: string,
    public readonly code: MunicipalityCode,
    public readonly prefecture: string,
    public readonly polygon: unknown | null,
    public readonly source: string,
    // データ収集管理フィールド
    public readonly url: string | null,
    public readonly boardCount: number | null,
    public readonly dataVersion: string | null,
    public readonly status: MunicipalityStatus,
    public readonly contactStatus: ContactStatus | null,
    public readonly notes: string | null,
    public readonly folderId: string | null,
    public readonly createdAt: Date,
    public readonly updatedAt: Date
  ) {}

  /**
   * データ収集が完了しているか
   */
  isDataCollected(): boolean {
    return this.status === "COMPLETED";
  }

  /**
   * 選管に問い合わせ可能か
   */
  canContact(): boolean {
    return (
      this.contactStatus !== "STOPPED" && this.contactStatus !== "RECEIVED"
    );
  }

  /**
   * 作業中か
   */
  isInProgress(): boolean {
    return (
      this.status === "IN_PROGRESS" ||
      this.status === "CONTACTING" ||
      this.status === "DIGITIZING" ||
      this.status === "PDF_COMPLETED" ||
      this.status === "CSV_COMPLETED" ||
      this.status === "QUALITY_CHECK"
    );
  }

  /**
   * 都道府県コードを取得
   */
  getPrefectureCode(): string {
    return this.code.getPrefectureCode();
  }

  /**
   * 表示用の完全な名前を取得
   */
  getFullName(): string {
    return `${this.prefecture} ${this.name}`;
  }
}
