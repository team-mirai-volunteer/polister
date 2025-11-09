import type { BoardCandidate, ImageCandidate } from "../BoardMatchingService";
import { BoardMatchingService } from "../BoardMatchingService";

describe("BoardMatchingService", () => {
  let service: BoardMatchingService;

  beforeEach(() => {
    service = new BoardMatchingService();
  });

  describe("calculateMatchScore", () => {
    const createImageCandidate = (
      overrides: Partial<ImageCandidate> = {}
    ): ImageCandidate => ({
      csvPrefecture: "東京都",
      csvCity: "八丈町",
      csvBoardNumber: "1-7",
      latitude: 33.11711667,
      longitude: 139.8105472,
      ...overrides,
    });

    const createBoardCandidate = (
      overrides: Partial<BoardCandidate> = {}
    ): BoardCandidate => ({
      boardId: "test-board-id",
      boardNumber: "1-7",
      address: "東京都八丈町三根",
      municipalityName: "八丈町",
      prefecture: "東京都",
      latitude: 33.11711667,
      longitude: 139.8105472,
      distance: 0,
      ...overrides,
    });

    describe("位置情報スコア（0-50点）", () => {
      it("10m以内の場合、50点を付与", () => {
        const image = createImageCandidate();
        const board = createBoardCandidate({ distance: 5 });

        const result = service.calculateMatchScore(image, board);

        const locationScore = result.details.find(
          (d) => d.factor === "location"
        );
        expect(locationScore?.score).toBe(50);
        expect(locationScore?.detail).toContain("距離: 5m");
      });

      it("50m以内の場合、40点を付与", () => {
        const image = createImageCandidate();
        const board = createBoardCandidate({ distance: 30 });

        const result = service.calculateMatchScore(image, board);

        const locationScore = result.details.find(
          (d) => d.factor === "location"
        );
        expect(locationScore?.score).toBe(40);
      });

      it("100m以内の場合、30点を付与", () => {
        const image = createImageCandidate();
        const board = createBoardCandidate({ distance: 80 });

        const result = service.calculateMatchScore(image, board);

        const locationScore = result.details.find(
          (d) => d.factor === "location"
        );
        expect(locationScore?.score).toBe(30);
      });

      it("500m以内の場合、20点を付与", () => {
        const image = createImageCandidate();
        const board = createBoardCandidate({ distance: 300 });

        const result = service.calculateMatchScore(image, board);

        const locationScore = result.details.find(
          (d) => d.factor === "location"
        );
        expect(locationScore?.score).toBe(20);
      });

      it("1km以内の場合、10点を付与", () => {
        const image = createImageCandidate();
        const board = createBoardCandidate({ distance: 800 });

        const result = service.calculateMatchScore(image, board);

        const locationScore = result.details.find(
          (d) => d.factor === "location"
        );
        expect(locationScore?.score).toBe(10);
      });

      it("1km超の場合、0点を付与", () => {
        const image = createImageCandidate();
        const board = createBoardCandidate({ distance: 1500 });

        const result = service.calculateMatchScore(image, board);

        const locationScore = result.details.find(
          (d) => d.factor === "location"
        );
        expect(locationScore?.score).toBe(0);
      });

      it("位置情報がない場合、位置情報スコアが含まれない", () => {
        const image = createImageCandidate({
          latitude: null,
          longitude: null,
        });
        const board = createBoardCandidate();

        const result = service.calculateMatchScore(image, board);

        const locationScore = result.details.find(
          (d) => d.factor === "location"
        );
        expect(locationScore).toBeUndefined();
        // 市区町村と掲示板番号のみが含まれる
        expect(result.details).toHaveLength(2);
      });
    });

    describe("市区町村スコア（0-30点）", () => {
      it("市区町村が完全一致の場合、30点を付与", () => {
        const image = createImageCandidate({
          csvPrefecture: "東京都",
          csvCity: "八丈町",
        });
        const board = createBoardCandidate({
          prefecture: "東京都",
          municipalityName: "八丈町",
        });

        const result = service.calculateMatchScore(image, board);

        const municipalityScore = result.details.find(
          (d) => d.factor === "municipality"
        );
        expect(municipalityScore?.score).toBe(30);
        expect(municipalityScore?.detail).toBe("完全一致");
      });

      it("都道府県のみ一致の場合、10点を付与", () => {
        const image = createImageCandidate({
          csvPrefecture: "東京都",
          csvCity: "新宿区",
        });
        const board = createBoardCandidate({
          prefecture: "東京都",
          municipalityName: "渋谷区",
        });

        const result = service.calculateMatchScore(image, board);

        const municipalityScore = result.details.find(
          (d) => d.factor === "municipality"
        );
        expect(municipalityScore?.score).toBe(10);
        expect(municipalityScore?.detail).toBe("都道府県のみ一致");
      });

      it("都道府県も不一致の場合、0点を付与", () => {
        const image = createImageCandidate({
          csvPrefecture: "東京都",
          csvCity: "新宿区",
        });
        const board = createBoardCandidate({
          prefecture: "神奈川県",
          municipalityName: "横浜市",
        });

        const result = service.calculateMatchScore(image, board);

        const municipalityScore = result.details.find(
          (d) => d.factor === "municipality"
        );
        expect(municipalityScore?.score).toBe(0);
        expect(municipalityScore?.detail).toBe("不一致");
      });

      it("CSV情報がない場合、0点を付与", () => {
        const image = createImageCandidate({
          csvPrefecture: null,
          csvCity: null,
        });
        const board = createBoardCandidate();

        const result = service.calculateMatchScore(image, board);

        const municipalityScore = result.details.find(
          (d) => d.factor === "municipality"
        );
        expect(municipalityScore?.score).toBe(0);
      });
    });

    describe("掲示板番号スコア（0-20点）", () => {
      it("完全一致の場合、20点を付与", () => {
        const image = createImageCandidate({ csvBoardNumber: "1-7" });
        const board = createBoardCandidate({ boardNumber: "1-7" });

        const result = service.calculateMatchScore(image, board);

        const numberScore = result.details.find(
          (d) => d.factor === "boardNumber"
        );
        expect(numberScore?.score).toBe(20);
        expect(numberScore?.detail).toBe("完全一致");
      });

      it("部分一致（前方一致）の場合、15点を付与", () => {
        const image = createImageCandidate({ csvBoardNumber: "1" });
        const board = createBoardCandidate({ boardNumber: "1-7" });

        const result = service.calculateMatchScore(image, board);

        const numberScore = result.details.find(
          (d) => d.factor === "boardNumber"
        );
        expect(numberScore?.score).toBe(15);
        expect(numberScore?.detail).toBe("部分一致");
      });

      it("数値範囲内（±5以内）の場合、10点を付与", () => {
        const image = createImageCandidate({ csvBoardNumber: "3" });
        const board = createBoardCandidate({ boardNumber: "8" }); // 差が5

        const result = service.calculateMatchScore(image, board);

        const numberScore = result.details.find(
          (d) => d.factor === "boardNumber"
        );
        expect(numberScore?.score).toBe(10);
        expect(numberScore?.detail).toBe("範囲内");
      });

      it("不一致の場合、0点を付与", () => {
        const image = createImageCandidate({ csvBoardNumber: "1-7" });
        const board = createBoardCandidate({ boardNumber: "20-10" }); // 数値が大きく離れている

        const result = service.calculateMatchScore(image, board);

        const numberScore = result.details.find(
          (d) => d.factor === "boardNumber"
        );
        expect(numberScore?.score).toBe(0);
        expect(numberScore?.detail).toBe("不一致");
      });

      it("無効な形式の掲示板番号は0点として扱う", () => {
        const image = createImageCandidate({ csvBoardNumber: "A-1" });
        const board = createBoardCandidate({ boardNumber: "1-7" });

        const result = service.calculateMatchScore(image, board);

        const numberScore = result.details.find(
          (d) => d.factor === "boardNumber"
        );
        expect(numberScore?.score).toBe(0);
        expect(numberScore?.detail).toBe("不一致");
      });

      it("掲示板側の番号が無効な場合も0点で継続する", () => {
        const image = createImageCandidate({ csvBoardNumber: "1-7" });
        const board = createBoardCandidate({ boardNumber: "invalid-value" });

        const result = service.calculateMatchScore(image, board);

        const numberScore = result.details.find(
          (d) => d.factor === "boardNumber"
        );
        expect(numberScore?.score).toBe(0);
        expect(numberScore?.detail).toBe("不一致");
      });

      it("掲示板番号がない場合、掲示板番号スコアが含まれない", () => {
        const image = createImageCandidate({ csvBoardNumber: null });
        const board = createBoardCandidate({ boardNumber: "1-7" });

        const result = service.calculateMatchScore(image, board);

        const numberScore = result.details.find(
          (d) => d.factor === "boardNumber"
        );
        expect(numberScore).toBeUndefined();
        // 位置情報と市区町村のみが含まれる
        expect(result.details).toHaveLength(2);
      });
    });

    describe("総合スコアとランク判定", () => {
      it("80点以上の場合、HIGH判定", () => {
        const image = createImageCandidate();
        const board = createBoardCandidate({ distance: 5 }); // 50 + 30 + 20 = 100点

        const result = service.calculateMatchScore(image, board);

        expect(result.totalScore).toBe(100);
        expect(result.rank).toBe("HIGH");
      });

      it("50-79点の場合、MEDIUM判定", () => {
        const image = createImageCandidate({ csvBoardNumber: null });
        const board = createBoardCandidate({ distance: 30 }); // 40 + 30 + 0 = 70点

        const result = service.calculateMatchScore(image, board);

        expect(result.totalScore).toBe(70);
        expect(result.rank).toBe("MEDIUM");
      });

      it("30-49点の場合、LOW判定", () => {
        const image = createImageCandidate({ csvBoardNumber: null });
        const board = createBoardCandidate({ distance: 800 }); // 10 + 30 + 0 = 40点

        const result = service.calculateMatchScore(image, board);

        expect(result.totalScore).toBe(40);
        expect(result.rank).toBe("LOW");
      });

      it("30点未満の場合、NONE判定", () => {
        const image = createImageCandidate({
          csvPrefecture: "東京都",
          csvCity: "新宿区",
          csvBoardNumber: null,
        });
        const board = createBoardCandidate({
          prefecture: "神奈川県",
          municipalityName: "横浜市",
          distance: 2000,
        }); // 0 + 0 + 0 = 0点

        const result = service.calculateMatchScore(image, board);

        expect(result.totalScore).toBe(0);
        expect(result.rank).toBe("NONE");
      });

      it("全ての情報がある場合、スコア詳細が3要素含まれる", () => {
        const image = createImageCandidate();
        const board = createBoardCandidate();

        const result = service.calculateMatchScore(image, board);

        expect(result.details).toHaveLength(3);
        expect(result.details.map((d) => d.factor)).toEqual([
          "location",
          "municipality",
          "boardNumber",
        ]);
      });

      it("位置情報がない場合、市区町村と掲示板番号のみ含まれる", () => {
        const image = createImageCandidate({
          latitude: null,
          longitude: null,
        });
        const board = createBoardCandidate();

        const result = service.calculateMatchScore(image, board);

        expect(result.details).toHaveLength(2);
        expect(result.details.map((d) => d.factor)).toEqual([
          "municipality",
          "boardNumber",
        ]);
      });
    });
  });
});
