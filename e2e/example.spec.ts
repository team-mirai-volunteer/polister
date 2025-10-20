import { expect, test } from "@playwright/test";

test("should display the home page", async ({ page }) => {
  await page.goto("/");

  await expect(
    page.getByText("掲示板データ運用を直感的に可視化するトップページ")
  ).toBeVisible();
});
