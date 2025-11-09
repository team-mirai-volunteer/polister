/**
 * Address 値オブジェクト
 *
 * 掲示板の住所を表す
 */

const ADDRESS_MAX_LENGTH = 500;
const ADDRESS_MIN_LENGTH = 1;

export class Address {
  private readonly _value: string;

  constructor(value: string) {
    // 型チェック
    if (typeof value !== "string") {
      throw new Error("住所は文字列で指定してください。");
    }

    // トリム
    const trimmed = value.trim();

    // 空文字チェック
    if (trimmed.length < ADDRESS_MIN_LENGTH) {
      throw new Error("住所を入力してください。");
    }

    // 最大長チェック
    if (trimmed.length > ADDRESS_MAX_LENGTH) {
      throw new Error(
        `住所は最大${ADDRESS_MAX_LENGTH}文字までにしてください。`
      );
    }

    this._value = trimmed;
  }

  get value(): string {
    return this._value;
  }

  /**
   * 等価性チェック
   */
  equals(other: Address): boolean {
    if (!(other instanceof Address)) {
      return false;
    }
    return this._value === other._value;
  }

  /**
   * 文字列表現
   */
  toString(): string {
    return this._value;
  }

  /**
   * JSON表現
   */
  toJSON(): string {
    return this._value;
  }

  /**
   * プレーンオブジェクトから復元
   */
  static fromString(value: string): Address {
    return new Address(value);
  }
}
