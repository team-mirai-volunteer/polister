import { expect, test } from "@playwright/test";

test("should display the home page", async ({ page }) => {
  await page.goto("/");

  await expect(page.getByText("Polisterプロジェクトへようこそ")).toBeVisible();
});
