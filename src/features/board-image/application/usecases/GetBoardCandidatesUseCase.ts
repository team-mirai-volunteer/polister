import type { IBoardRepository } from "@/features/board/domain/repositories/IBoardRepository";
import { TOKENS } from "@/shared/lib/di/tokens";
import { inject, injectable } from "tsyringe";
import type { IBoardImageRepository } from "../../domain/repositories/IBoardImageRepository";
import { BoardMatchingService } from "../../domain/services/BoardMatchingService";

export interface BoardCandidateDTO {
  boardId: string;
  boardNumber: string | null;
  address: string;
  municipalityName: string;
  prefecture: string;
  latitude: number;
  longitude: number;
  distance: number;
  matchScore: number;
  matchRank: string;
  scoreDetails: Array<{
    factor: string;
    score: number;
    maxScore: number;
    detail: string;
  }>;
}

/**
 * 候補掲示場取得ユースケース
 * 写真の位置情報・市区町村・掲示場番号からマッチング
 */
@injectable()
export class GetBoardCandidatesUseCase {
  constructor(
    @inject(TOKENS.BoardImageRepository)
    private readonly boardImageRepository: IBoardImageRepository,
    @inject(TOKENS.BoardRepository)
    private readonly boardRepository: IBoardRepository,
    @inject(TOKENS.BoardMatchingService)
    private readonly matchingService: BoardMatchingService
  ) {}

  async execute(imageId: string): Promise<BoardCandidateDTO[]> {
    // 画像情報を取得
    const image = await this.boardImageRepository.findById(imageId);
    if (!image) {
      throw new Error(`Image not found: ${imageId}`);
    }

    let candidates: Array<{
      board: {
        id: string;
        boardNumber: string | null;
        address: string;
        municipalityName?: string;
        municipalityPrefecture?: string;
        latitude: number | null;
        longitude: number | null;
      };
      distance: number;
    }> = [];

    // 1. 空間検索による候補取得（半径2km以内）
    if (image.latitude && image.longitude) {
      const nearbyBoards = await this.boardRepository.findByLocation({
        latitude: image.latitude,
        longitude: image.longitude,
        radiusMeters: 2000,
        limit: 50,
      });

      candidates = nearbyBoards.map((board) => ({
        board,
        distance: this.calculateDistance(
          image.latitude!,
          image.longitude!,
          board.latitude!,
          board.longitude!
        ),
      }));
    }

    // 2. 市区町村による候補取得（位置情報なし時）
    if (candidates.length === 0 && image.csvPrefecture && image.csvCity) {
      const cityBoards = await this.boardRepository.findByMunicipality({
        prefecture: image.csvPrefecture,
        city: image.csvCity,
        limit: 50,
      });

      candidates = cityBoards.map((board) => ({
        board,
        distance: 0, // 市区町村検索では距離不明
      }));
    }

    // 3. スコアリング
    const scored = candidates.map(({ board, distance }) => {
      const matchScore = this.matchingService.calculateMatchScore(
        {
          csvPrefecture: image.csvPrefecture,
          csvCity: image.csvCity,
          csvBoardNumber: image.csvBoardNumber,
          latitude: image.latitude,
          longitude: image.longitude,
        },
        {
          boardId: board.id,
          boardNumber: board.boardNumber,
          address: board.address,
          municipalityName: board.municipalityName || "",
          prefecture: board.municipalityPrefecture || "",
          latitude: board.latitude || 0,
          longitude: board.longitude || 0,
          distance,
        }
      );

      return {
        board,
        distance,
        matchScore,
      };
    });

    // 4. スコア順にソート
    scored.sort((a, b) => b.matchScore.totalScore - a.matchScore.totalScore);

    // 5. 上位10件を返す
    return scored.slice(0, 10).map((item) => ({
      boardId: item.board.id,
      boardNumber: item.board.boardNumber,
      address: item.board.address,
      municipalityName: item.board.municipalityName || "",
      prefecture: item.board.municipalityPrefecture || "",
      latitude: item.board.latitude || 0,
      longitude: item.board.longitude || 0,
      distance: item.distance,
      matchScore: item.matchScore.totalScore,
      matchRank: item.matchScore.rank,
      scoreDetails: item.matchScore.details.map((d) => ({
        factor: d.factor,
        score: d.score,
        maxScore: d.maxScore,
        detail: d.detail,
      })),
    }));
  }

  /**
   * 2点間の距離を計算（Haversine formula）
   */
  private calculateDistance(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
  ): number {
    const R = 6371000; // 地球の半径（メートル）
    const φ1 = (lat1 * Math.PI) / 180;
    const φ2 = (lat2 * Math.PI) / 180;
    const Δφ = ((lat2 - lat1) * Math.PI) / 180;
    const Δλ = ((lon2 - lon1) * Math.PI) / 180;

    const a =
      Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c; // メートル
  }
}
