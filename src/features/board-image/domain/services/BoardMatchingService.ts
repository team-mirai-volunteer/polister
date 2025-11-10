import { normalizeBoardNumber } from "@/shared/domain/board/BoardNumber";
import { injectable } from "tsyringe";

export type MatchRank = "HIGH" | "MEDIUM" | "LOW" | "NONE";

export interface MatchScoreDetail {
  factor: "location" | "municipality" | "boardNumber";
  score: number;
  maxScore: number;
  detail: string;
}

export interface MatchScore {
  totalScore: number;
  rank: MatchRank;
  details: MatchScoreDetail[];
}

export interface BoardCandidate {
  boardId: string;
  boardNumber: string | null;
  address: string;
  municipalityName: string;
  prefecture: string;
  latitude: number;
  longitude: number;
  distance: number;
}

export interface ImageCandidate {
  csvPrefecture: string | null;
  csvCity: string | null;
  csvBoardNumber: string | null;
  latitude: number | null;
  longitude: number | null;
}

/**
 * 掲示板マッチングサービス
 * 写真と掲示板の関連付けスコアリング
 */
@injectable()
export class BoardMatchingService {
  /**
   * マッチスコアを計算
   * 合計100点満点（位置50点 + 市区町村30点 + 掲示板番号20点）
   */
  calculateMatchScore(
    image: ImageCandidate,
    board: BoardCandidate
  ): MatchScore {
    let score = 0;
    const details: MatchScoreDetail[] = [];

    // 1. 位置情報スコア（0-50点）
    if (image.latitude && image.longitude) {
      const locationScore = this.getLocationScore(board.distance);
      score += locationScore;
      details.push({
        factor: "location",
        score: locationScore,
        maxScore: 50,
        detail: `距離: ${board.distance.toFixed(0)}m`,
      });
    }

    // 2. 市区町村一致スコア（0-30点）
    const municipalityScore = this.getMunicipalityScore(
      image.csvPrefecture,
      image.csvCity,
      board.prefecture,
      board.municipalityName
    );
    score += municipalityScore;
    details.push({
      factor: "municipality",
      score: municipalityScore,
      maxScore: 30,
      detail:
        municipalityScore === 30
          ? "完全一致"
          : municipalityScore === 10
            ? "都道府県のみ一致"
            : "不一致",
    });

    // 3. 掲示板番号一致スコア（0-20点）
    if (image.csvBoardNumber && board.boardNumber) {
      const numberScore = this.getBoardNumberScore(
        image.csvBoardNumber,
        board.boardNumber
      );
      score += numberScore;
      details.push({
        factor: "boardNumber",
        score: numberScore,
        maxScore: 20,
        detail:
          numberScore === 20
            ? "完全一致"
            : numberScore === 15
              ? "部分一致"
              : numberScore === 10
                ? "範囲内"
                : "不一致",
      });
    }

    return {
      totalScore: score,
      rank: this.getScoreRank(score),
      details,
    };
  }

  /**
   * 距離に応じた位置情報スコア（0-50点）
   */
  private getLocationScore(distanceMeters: number): number {
    if (distanceMeters <= 5) return 50;
    if (distanceMeters <= 15) return 45;
    if (distanceMeters <= 30) return 40;
    if (distanceMeters <= 60) return 35;
    if (distanceMeters <= 100) return 30;
    if (distanceMeters <= 200) return 25;
    if (distanceMeters <= 400) return 20;
    if (distanceMeters <= 800) return 15;
    if (distanceMeters <= 1200) return 10;
    return 0;
  }

  /**
   * 市区町村一致スコア（0-30点）
   */
  private getMunicipalityScore(
    imagePrefecture: string | null,
    imageCity: string | null,
    boardPrefecture: string,
    boardMunicipalityName: string
  ): number {
    // 市区町村完全一致
    if (
      imagePrefecture === boardPrefecture &&
      imageCity === boardMunicipalityName
    ) {
      return 30;
    }
    // 都道府県のみ一致
    if (imagePrefecture === boardPrefecture) {
      return 10;
    }
    return 0;
  }

  /**
   * 掲示板番号一致スコア（0-20点）
   */
  private getBoardNumberScore(
    imageNumber: string,
    boardNumber: string
  ): number {
    const normalizedImage = this.normalizeBoardNumberOrNull(imageNumber);
    const normalizedBoard = this.normalizeBoardNumberOrNull(boardNumber);

    // 正規化に失敗した場合は0点扱い
    if (!normalizedImage || !normalizedBoard) {
      return 0;
    }

    // 完全一致
    if (normalizedImage === normalizedBoard) {
      return 20;
    }

    // 部分一致（前方一致・後方一致）
    if (
      normalizedImage.startsWith(normalizedBoard) ||
      normalizedBoard.startsWith(normalizedImage)
    ) {
      return 15;
    }

    // 数値範囲内チェック（±5以内）
    const imageNum = this.extractNumber(normalizedImage);
    const boardNum = this.extractNumber(normalizedBoard);
    if (
      imageNum !== null &&
      boardNum !== null &&
      Math.abs(imageNum - boardNum) <= 5
    ) {
      return 10;
    }

    return 0;
  }

  private normalizeBoardNumberOrNull(value: string): string | null {
    try {
      return normalizeBoardNumber(value);
    } catch {
      return null;
    }
  }

  /**
   * スコアランク判定
   */
  private getScoreRank(score: number): MatchRank {
    if (score >= 80) return "HIGH";
    if (score >= 50) return "MEDIUM";
    if (score >= 30) return "LOW";
    return "NONE";
  }

  /**
   * 掲示板番号から数値を抽出
   */
  private extractNumber(boardNumber: string): number | null {
    const match = boardNumber.match(/\d+/);
    return match ? parseInt(match[0], 10) : null;
  }
}
