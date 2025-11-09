/**
 * ストレージサービスインターフェース
 * 開発環境（ローカル）と本番環境（Cloud Storage）の両方に対応
 */
export interface IStorageService {
  /**
   * ファイルを保存
   * @param file ファイルバッファ
   * @param path 保存先パス（相対パス）
   * @returns 保存されたファイルの完全パス
   */
  save(file: Buffer, path: string): Promise<string>;

  /**
   * ファイルを取得
   * @param path ファイルパス
   * @returns ファイルバッファ
   */
  get(path: string): Promise<Buffer>;

  /**
   * ファイルを削除
   * @param path ファイルパス
   */
  delete(path: string): Promise<void>;

  /**
   * 公開URLを取得
   * @param path ファイルパス
   * @returns 公開URL（ローカル: /api/images/..., Cloud: 署名付きURL）
   */
  getPublicUrl(path: string): Promise<string>;

  /**
   * ファイルが存在するか確認
   * @param path ファイルパス
   */
  exists(path: string): Promise<boolean>;
}
