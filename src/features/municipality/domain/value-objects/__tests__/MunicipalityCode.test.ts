/**
 * MunicipalityCode 値オブジェクトのユニットテスト
 */

import { describe, expect, it } from "@jest/globals";
import { MunicipalityCode } from "../MunicipalityCode";

describe("MunicipalityCode", () => {
  describe("create", () => {
    it("有効な5桁の行政区域コードでインスタンスを作成できる", () => {
      const code = MunicipalityCode.create("01101");
      expect(code.toString()).toBe("01101");
    });

    it("5桁未満のコードでエラーを投げる", () => {
      expect(() => MunicipalityCode.create("0110")).toThrow(
        "Invalid municipality code: 0110. Must be 5 digits."
      );
    });

    it("5桁を超えるコードでエラーを投げる", () => {
      expect(() => MunicipalityCode.create("011011")).toThrow(
        "Invalid municipality code: 011011. Must be 5 digits."
      );
    });

    it("数字以外の文字を含むコードでエラーを投げる", () => {
      expect(() => MunicipalityCode.create("0110a")).toThrow();
    });

    it("空文字列でエラーを投げる", () => {
      expect(() => MunicipalityCode.create("")).toThrow();
    });
  });

  describe("getPrefectureCode", () => {
    it("都道府県コード（最初の2桁）を取得できる", () => {
      const code = MunicipalityCode.create("01101");
      expect(code.getPrefectureCode()).toBe("01");
    });

    it("東京都のコードから13を取得できる", () => {
      const code = MunicipalityCode.create("13101");
      expect(code.getPrefectureCode()).toBe("13");
    });
  });

  describe("getCityCode", () => {
    it("市区町村コード（後ろの3桁）を取得できる", () => {
      const code = MunicipalityCode.create("01101");
      expect(code.getCityCode()).toBe("101");
    });

    it("千代田区のコードから101を取得できる", () => {
      const code = MunicipalityCode.create("13101");
      expect(code.getCityCode()).toBe("101");
    });
  });

  describe("equals", () => {
    it("同じコードの場合trueを返す", () => {
      const code1 = MunicipalityCode.create("01101");
      const code2 = MunicipalityCode.create("01101");
      expect(code1.equals(code2)).toBe(true);
    });

    it("異なるコードの場合falseを返す", () => {
      const code1 = MunicipalityCode.create("01101");
      const code2 = MunicipalityCode.create("13101");
      expect(code1.equals(code2)).toBe(false);
    });
  });

  describe("toString", () => {
    it("文字列として取得できる", () => {
      const code = MunicipalityCode.create("01101");
      expect(code.toString()).toBe("01101");
    });
  });
});
