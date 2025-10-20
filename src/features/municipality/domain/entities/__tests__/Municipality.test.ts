/**
 * Municipality エンティティのユニットテスト
 */

import { describe, expect, it } from "@jest/globals";
import type { ContactStatus, MunicipalityStatus } from "@prisma/client";
import { MunicipalityCode } from "../../value-objects/MunicipalityCode";
import { Municipality } from "../Municipality";

describe("Municipality", () => {
  const createMunicipality = (
    status: MunicipalityStatus = "NOT_STARTED",
    contactStatus: ContactStatus | null = null
  ): Municipality => {
    return new Municipality(
      "test-id",
      "千代田区",
      MunicipalityCode.create("13101"),
      "東京都",
      null,
      "MLIT",
      null,
      null,
      null,
      status,
      contactStatus,
      null,
      null,
      new Date(),
      new Date()
    );
  };

  describe("isDataCollected", () => {
    it("ステータスがCOMPLETEDの場合trueを返す", () => {
      const municipality = createMunicipality("COMPLETED");
      expect(municipality.isDataCollected()).toBe(true);
    });

    it("ステータスがNOT_STARTEDの場合falseを返す", () => {
      const municipality = createMunicipality("NOT_STARTED");
      expect(municipality.isDataCollected()).toBe(false);
    });
  });

  describe("canContact", () => {
    it("contactStatusがSTOPPEDの場合falseを返す", () => {
      const municipality = createMunicipality("NOT_STARTED", "STOPPED");
      expect(municipality.canContact()).toBe(false);
    });

    it("contactStatusがRECEIVEDの場合falseを返す", () => {
      const municipality = createMunicipality("NOT_STARTED", "RECEIVED");
      expect(municipality.canContact()).toBe(false);
    });

    it("contactStatusがNOT_CONTACTEDの場合trueを返す", () => {
      const municipality = createMunicipality("NOT_STARTED", "NOT_CONTACTED");
      expect(municipality.canContact()).toBe(true);
    });

    it("contactStatusがnullの場合trueを返す", () => {
      const municipality = createMunicipality();
      expect(municipality.canContact()).toBe(true);
    });
  });

  describe("isInProgress", () => {
    it("ステータスがIN_PROGRESSの場合trueを返す", () => {
      const municipality = createMunicipality("IN_PROGRESS");
      expect(municipality.isInProgress()).toBe(true);
    });

    it("ステータスがCONTACTINGの場合trueを返す", () => {
      const municipality = createMunicipality("CONTACTING");
      expect(municipality.isInProgress()).toBe(true);
    });

    it("ステータスがQUALITY_CHECKの場合trueを返す", () => {
      const municipality = createMunicipality("QUALITY_CHECK");
      expect(municipality.isInProgress()).toBe(true);
    });

    it("ステータスがCOMPLETEDの場合falseを返す", () => {
      const municipality = createMunicipality("COMPLETED");
      expect(municipality.isInProgress()).toBe(false);
    });

    it("ステータスがNOT_STARTEDの場合falseを返す", () => {
      const municipality = createMunicipality("NOT_STARTED");
      expect(municipality.isInProgress()).toBe(false);
    });
  });

  describe("getPrefectureCode", () => {
    it("都道府県コードを取得できる", () => {
      const municipality = createMunicipality();
      expect(municipality.getPrefectureCode()).toBe("13");
    });
  });

  describe("getFullName", () => {
    it("都道府県名と市区町村名を連結した完全な名前を取得できる", () => {
      const municipality = createMunicipality();
      expect(municipality.getFullName()).toBe("東京都 千代田区");
    });

    it("札幌市中央区の完全な名前を取得できる", () => {
      const municipality = new Municipality(
        "test-id-2",
        "札幌市中央区",
        MunicipalityCode.create("01101"),
        "北海道",
        null,
        "MLIT",
        null,
        null,
        null,
        "NOT_STARTED",
        null,
        null,
        null,
        new Date(),
        new Date()
      );
      expect(municipality.getFullName()).toBe("北海道 札幌市中央区");
    });
  });
});
