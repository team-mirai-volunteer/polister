/**
 * GetPrefecturesUseCase
 *
 * 都道府県一覧を取得するユースケース
 */

import { TOKENS } from "@/shared/lib/di/tokens";
import { inject, injectable } from "tsyringe";

import type { Prefecture } from "../../domain/entities/Prefecture";
import type {
  FindPrefecturesOptions,
  IPrefectureRepository,
  PrefectureFilter,
} from "../../domain/repositories/IPrefectureRepository";

/**
 * Server Action などの前段で正規化済みの一覧取得パラメータ。
 *
 * フィールド／オペレータのホワイトリストチェックは呼び出し元で行い、
 * このユースケースには検証済みの値のみを渡す想定です。
 */
export interface GetPrefecturesInput {
  filters?: PrefectureFilter[];
  sortField?: FindPrefecturesOptions["sortField"];
  sortOrder?: FindPrefecturesOptions["sortOrder"];
}

@injectable()
export class GetPrefecturesUseCase {
  constructor(
    @inject(TOKENS.PrefectureRepository)
    private readonly repository: IPrefectureRepository
  ) {}

  async execute(
    input: Readonly<GetPrefecturesInput> = {}
  ): Promise<Prefecture[]> {
    const options: FindPrefecturesOptions = {
      filters: input.filters,
      sortField: input.sortField,
      sortOrder: input.sortOrder,
    };

    return this.repository.findAll(options);
  }
}
