// E2E test template (improvement #102)
import { test, expect } from "@playwright/test";

test("homepage loads and shows fleet status", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator("h1")).toContainText("Gale");
  await expect(page.locator("#main")).toBeVisible();
  // Check performance: first contentful paint < 1s
  const fcp = await page.evaluate(() => {
    const entries = performance.getEntriesByType("paint");
    return entries.find(e => e.name === "first-contentful-paint");
  });
  expect(fcp).toBeDefined();
  expect(fcp.startTime).toBeLessThan(1000);
});

test("command palette opens with Ctrl+K", async ({ page }) => {
  await page.goto("/");
  await page.keyboard.press("Control+k");
  await expect(page.locator("dialog#palette")).toBeVisible();
});

test("offline fallback works", async ({ page }) => {
  await page.goto("/");
  await page.setOffline(true);
  await page.reload();
  await expect(page.locator("main")).toContainText("Gale");
});
