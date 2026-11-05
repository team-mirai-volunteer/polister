import { updateBoardAction } from "@/features/board/application/actions/updateBoardAction";
import { getAuthenticatedUserId } from "@/shared/lib/auth/session";

const mockExecute = jest.fn();

jest.mock("@/shared/lib/auth/session", () => ({
  getAuthenticatedUserId: jest.fn(),
}));

jest.mock("@/shared/lib/di/container", () => ({
  setupDI: () => ({
    resolve: () => ({ execute: mockExecute }),
  }),
}));

jest.mock("@/features/board/application/usecases/UpdateBoardUseCase", () => ({
  UpdateBoardUseCase: class {},
  UpdateBoardError: class extends Error {
    code = "UPDATE_BOARD_ERROR";
  },
}));

const mockedGetUserId = getAuthenticatedUserId as jest.MockedFunction<
  typeof getAuthenticatedUserId
>;

describe("updateBoardAction", () => {
  beforeEach(() => {
    mockExecute.mockReset();
    mockedGetUserId.mockReset();
  });

  it("未ログインの場合は更新せずエラーを返す", async () => {
    mockedGetUserId.mockResolvedValue(null);

    const result = await updateBoardAction({
      boardId: "board-1",
      changeReason: "MANUAL_INPUT",
    });

    expect(result).toEqual({
      success: false,
      error: { code: "UNAUTHORIZED", message: "ログインが必要です。" },
    });
    expect(mockExecute).not.toHaveBeenCalled();
  });

  it("変更者 ID はセッションのユーザー ID を使う", async () => {
    mockedGetUserId.mockResolvedValue("session-user");

    const result = await updateBoardAction({
      boardId: "board-1",
      changeReason: "MANUAL_INPUT",
      // 型から外したフィールドが渡されても無視されること
      ...({ userId: "other-user" } as object),
    });

    expect(result).toEqual({ success: true });
    expect(mockExecute).toHaveBeenCalledWith(
      expect.objectContaining({ boardId: "board-1", userId: "session-user" })
    );
  });
});
