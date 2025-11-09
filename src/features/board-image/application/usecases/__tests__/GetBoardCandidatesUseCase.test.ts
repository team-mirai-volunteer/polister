import { BoardLocation } from "@/features/board/domain/entities/BoardLocation";
import type { IBoardRepository } from "@/features/board/domain/repositories/IBoardRepository";
import { mockDeep } from "jest-mock-extended";
import { BoardImage } from "../../../domain/entities/BoardImage";
import type { IBoardImageRepository } from "../../../domain/repositories/IBoardImageRepository";
import { BoardMatchingService } from "../../../domain/services/BoardMatchingService";
import { GetBoardCandidatesUseCase } from "../GetBoardCandidatesUseCase";

describe("GetBoardCandidatesUseCase", () => {
  let useCase: GetBoardCandidatesUseCase;
  let mockBoardImageRepository: ReturnType<
    typeof mockDeep<IBoardImageRepository>
  >;
  let mockBoardRepository: ReturnType<typeof mockDeep<IBoardRepository>>;
  let matchingService: BoardMatchingService;

  beforeEach(() => {
    mockBoardImageRepository = mockDeep<IBoardImageRepository>();
    mockBoardRepository = mockDeep<IBoardRepository>();
    matchingService = new BoardMatchingService();

    useCase = new GetBoardCandidatesUseCase(
      mockBoardImageRepository,
      mockBoardRepository,
      matchingService
    );
  });

  describe("execute", () => {
    it("画像が存在しない場合、エラーをスロー", async () => {
      mockBoardImageRepository.findById.mockResolvedValue(null);

      await expect(useCase.execute("non-existent-id")).rejects.toThrow(
        "Image not found: non-existent-id"
      );
    });

    it("位置情報がある場合、空間検索で候補を取得", async () => {
      const image = new BoardImage(
        "image-id",
        null,
        null,
        "test.jpg",
        "/path/to/original.jpg",
        "/path/to/display.jpg",
        "/path/to/thumbnail.jpg",
        null,
        null,
        "東京都",
        "八丈町",
        "1-7",
        33.11711667,
        139.8105472,
        new Date(),
        null,
        "PENDING",
        null,
        null,
        null,
        false,
        new Date(),
        new Date()
      );

      const mockBoards = [
        new BoardLocation({
          id: "board-1",
          boardNumber: "1-7",
          name: "Test Board 1",
          address: "東京都八丈町三根",
          latitude: 33.11711667,
          longitude: 139.8105472,
          municipalityName: "八丈町",
          municipalityPrefecture: "東京都",
          status: "VERIFIED",
          trustLevel: "LEVEL_1",
        }),
        new BoardLocation({
          id: "board-2",
          boardNumber: "1-8",
          name: "Test Board 2",
          address: "東京都八丈町三根",
          latitude: 33.11721667,
          longitude: 139.8106472,
          municipalityName: "八丈町",
          municipalityPrefecture: "東京都",
          status: "VERIFIED",
          trustLevel: "LEVEL_1",
        }),
      ];

      mockBoardImageRepository.findById.mockResolvedValue(image);
      mockBoardRepository.findByLocation.mockResolvedValue(mockBoards);

      const result = await useCase.execute("image-id");

      expect(mockBoardRepository.findByLocation).toHaveBeenCalledWith({
        latitude: 33.11711667,
        longitude: 139.8105472,
        radiusMeters: 2000,
        limit: 50,
      });

      expect(result).toHaveLength(2);
      expect(result[0].boardId).toBe("board-1");
      expect(result[0].matchScore).toBeGreaterThan(0);
    });

    it("位置情報がない場合、市区町村検索で候補を取得", async () => {
      const image = new BoardImage(
        "image-id",
        null,
        null,
        "test.jpg",
        "/path/to/original.jpg",
        "/path/to/display.jpg",
        "/path/to/thumbnail.jpg",
        null,
        null,
        "東京都",
        "八丈町",
        "1-7",
        null, // 位置情報なし
        null,
        new Date(),
        null,
        "PENDING",
        null,
        null,
        null,
        false,
        new Date(),
        new Date()
      );

      const mockBoards = [
        new BoardLocation({
          id: "board-1",
          boardNumber: "1-7",
          name: "Test Board 1",
          address: "東京都八丈町三根",
          latitude: null,
          longitude: null,
          municipalityName: "八丈町",
          municipalityPrefecture: "東京都",
          status: "VERIFIED",
          trustLevel: "LEVEL_1",
        }),
      ];

      mockBoardImageRepository.findById.mockResolvedValue(image);
      mockBoardRepository.findByLocation.mockResolvedValue([]);
      mockBoardRepository.findByMunicipality.mockResolvedValue(mockBoards);

      const result = await useCase.execute("image-id");

      expect(mockBoardRepository.findByMunicipality).toHaveBeenCalledWith({
        prefecture: "東京都",
        city: "八丈町",
        limit: 50,
      });

      expect(result).toHaveLength(1);
      expect(result[0].boardId).toBe("board-1");
    });

    it("候補がスコア順にソートされる", async () => {
      const image = new BoardImage(
        "image-id",
        null,
        null,
        "test.jpg",
        "/path/to/original.jpg",
        "/path/to/display.jpg",
        "/path/to/thumbnail.jpg",
        null,
        null,
        "東京都",
        "八丈町",
        "1-7",
        33.11711667,
        139.8105472,
        new Date(),
        null,
        "PENDING",
        null,
        null,
        null,
        false,
        new Date(),
        new Date()
      );

      const mockBoards = [
        new BoardLocation({
          id: "board-1",
          boardNumber: "2-10", // 番号不一致、距離も遠い
          name: "Test Board 1",
          address: "東京都八丈町三根",
          latitude: 33.12,
          longitude: 139.82,
          municipalityName: "八丈町",
          municipalityPrefecture: "東京都",
          status: "VERIFIED",
          trustLevel: "LEVEL_1",
        }),
        new BoardLocation({
          id: "board-2",
          boardNumber: "1-7", // 完全一致、距離も近い
          name: "Test Board 2",
          address: "東京都八丈町三根",
          latitude: 33.11711667,
          longitude: 139.8105472,
          municipalityName: "八丈町",
          municipalityPrefecture: "東京都",
          status: "VERIFIED",
          trustLevel: "LEVEL_1",
        }),
      ];

      mockBoardImageRepository.findById.mockResolvedValue(image);
      mockBoardRepository.findByLocation.mockResolvedValue(mockBoards);

      const result = await useCase.execute("image-id");

      // スコアが高い順にソートされている
      expect(result[0].boardId).toBe("board-2"); // 高スコア
      expect(result[0].matchScore).toBeGreaterThan(result[1].matchScore);
    });

    it("上位10件のみを返す", async () => {
      const image = new BoardImage(
        "image-id",
        null,
        null,
        "test.jpg",
        "/path/to/original.jpg",
        "/path/to/display.jpg",
        "/path/to/thumbnail.jpg",
        null,
        null,
        "東京都",
        "八丈町",
        null,
        33.11711667,
        139.8105472,
        new Date(),
        null,
        "PENDING",
        null,
        null,
        null,
        false,
        new Date(),
        new Date()
      );

      // 15件の候補を用意
      const mockBoards = Array.from(
        { length: 15 },
        (_, i) =>
          new BoardLocation({
            id: `board-${i}`,
            boardNumber: `${i}-1`,
            name: `Test Board ${i}`,
            address: "東京都八丈町三根",
            latitude: 33.117 + i * 0.001,
            longitude: 139.81 + i * 0.001,
            status: "VERIFIED",
            trustLevel: "LEVEL_1",
          })
      );

      mockBoardImageRepository.findById.mockResolvedValue(image);
      mockBoardRepository.findByLocation.mockResolvedValue(mockBoards);

      const result = await useCase.execute("image-id");

      // 上位10件のみ
      expect(result).toHaveLength(10);
    });

    it("各候補にスコア詳細が含まれる", async () => {
      const image = new BoardImage(
        "image-id",
        null,
        null,
        "test.jpg",
        "/path/to/original.jpg",
        "/path/to/display.jpg",
        "/path/to/thumbnail.jpg",
        null,
        null,
        "東京都",
        "八丈町",
        "1-7",
        33.11711667,
        139.8105472,
        new Date(),
        null,
        "PENDING",
        null,
        null,
        null,
        false,
        new Date(),
        new Date()
      );

      const mockBoards = [
        new BoardLocation({
          id: "board-1",
          boardNumber: "1-7",
          name: "Test Board 1",
          address: "東京都八丈町三根",
          latitude: 33.11711667,
          longitude: 139.8105472,
          municipalityName: "八丈町",
          municipalityPrefecture: "東京都",
          status: "VERIFIED",
          trustLevel: "LEVEL_1",
        }),
      ];

      mockBoardImageRepository.findById.mockResolvedValue(image);
      mockBoardRepository.findByLocation.mockResolvedValue(mockBoards);

      const result = await useCase.execute("image-id");

      expect(result[0].scoreDetails).toBeDefined();
      expect(result[0].scoreDetails.length).toBeGreaterThan(0);
      expect(result[0].scoreDetails[0]).toHaveProperty("factor");
      expect(result[0].scoreDetails[0]).toHaveProperty("score");
      expect(result[0].scoreDetails[0]).toHaveProperty("maxScore");
      expect(result[0].scoreDetails[0]).toHaveProperty("detail");
    });
  });
});
