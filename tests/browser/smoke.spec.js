import { test, expect } from "@playwright/test";
test("dashboard, workshop and responsive navigation", async ({ page }) => {
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: "Four labs. Endless “what ifs.”" }),
  ).toBeVisible();
  await expect(page.locator(".lab-card")).toHaveCount(4);
  await page.getByRole("link", { name: "Workshop guide" }).click();
  await expect(page.locator(".agenda>div")).toHaveCount(7);
  await page.setViewportSize({ width: 390, height: 844 });
  await expect(
    page.getByRole("heading", { name: "From pixels to possibilities." }),
  ).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  expect(errors).toEqual([]);
});
test("each console applies commands, rejects invalid values, and resets", async ({
  page,
}) => {
  for (const [id, key, value] of [
    ["object", "confidence", "0.9"],
    ["face", "smile_threshold", "0.8"],
    ["gesture", "object_size", "100"],
    ["arcade", "ball_speed", "8"],
  ]) {
    await page.goto("/#lab/" + id);
    await page.locator("#commands").fill(`set ${key} ${value}`);
    await page.getByRole("button", { name: "Run Commands" }).click();
    await expect(page.locator("#settings")).toContainText(value);
    await page.locator("#commands").fill(`set ${key} 999`);
    await page.getByRole("button", { name: "Run Commands" }).click();
    await expect(page.locator("#output")).toContainText("must be a number");
    await page.getByRole("button", { name: "Reset Lab" }).click();
    await expect(page.locator("#output")).toContainText("Lab reset");
  }
});
test("arcade pointer fallback starts, pauses, restarts and resets", async ({
  page,
}) => {
  await page.goto("/#lab/arcade");
  await page.getByRole("button", { name: "Start game", exact: true }).click();
  await expect(page.locator("#results")).toContainText("PLAYING");
  await page.getByRole("button", { name: "Pause", exact: true }).click();
  await expect(page.locator("#results")).toContainText("PAUSED");
  await page.locator("#commands").fill("restart game");
  await page.getByRole("button", { name: "Run Commands" }).click();
  await expect(page.locator("#results")).toContainText("PLAYING");
  await page.getByRole("button", { name: "Reset Lab" }).click();
  await expect(page.locator("#results")).toContainText("READY");
});
test("local COCO model performs genuine inference on sample image", async ({
  page,
}) => {
  await page.goto("/#lab/object");
  await page.getByRole("button", { name: "Sample image", exact: true }).click();
  await expect(page.locator("#status")).toContainText(
    "Real inference on a still image",
    { timeout: 90000 },
  );
  await expect(page.locator("#results")).toContainText("cat", {
    timeout: 10000,
  });
  await page.locator("#commands").fill("track bottle");
  await page.getByRole("button", { name: "Run Commands" }).click();
  await expect(page.locator("#results")).toContainText("0 objects detected");
  await page.getByRole("button", { name: "Reset Lab" }).click();
  await expect(page.locator("#results")).toContainText("cat");
});
for (const id of ["object", "face", "gesture", "arcade"]) {
  test(`${id}: real worker inference consumes fake video and stops camera on navigation`, async ({
    page,
  }) => {
    const errors = [];
    page.on("pageerror", (e) => errors.push(e.message));

    await page.goto("/#lab/" + id);
    await page
      .getByRole("button", { name: "Start Camera", exact: false })
      .click();
    await expect(page.locator("#status")).toContainText("ms/frame", {
      timeout: 90000,
    });
    await page.waitForTimeout(1000);
    await expect(page.locator("#status")).not.toHaveClass(/error/);
    await expect(page.locator("#results")).toContainText(
      {
        object: "objects detected",
        face: "No face detected",
        gesture: "No hand detected",
        arcade: "Keyboard / pointer controller",
      }[id],
    );
    await page.evaluate(() => {
      window.testTrack = document
        .querySelector("video")
        .srcObject.getTracks()[0];
    });
    await page.getByRole("link", { name: "All labs" }).click();
    await expect(page.locator(".lab-card")).toHaveCount(4);
    expect(await page.evaluate(() => window.testTrack.readyState)).toBe(
      "ended",
    );
    expect(errors).toEqual([]);
  });
}

test("denied camera provides retry without breaking arcade", async ({
  browser,
}) => {
  const context = await browser.newContext({ permissions: [] });
  const page = await context.newPage();
  await page.addInitScript(() => {
    navigator.mediaDevices.getUserMedia = async () => {
      throw new DOMException("Denied", "NotAllowedError");
    };
  });
  await page.goto("/#lab/object");
  await page
    .getByRole("button", { name: "Start Camera", exact: false })
    .click();
  await expect(page.locator("#status")).toContainText("permission denied");
  await expect(
    page.getByRole("button", { name: "Retry", exact: true }),
  ).toBeVisible();
  await page.goto("/#lab/arcade");
  await page.getByRole("button", { name: "Start game", exact: true }).click();
  await expect(page.locator("#results")).toContainText("PLAYING");
  await context.close();
});

test("failed model download can retry and does not block other labs", async ({
  page,
}) => {
  await page.route("**/models/coco/model.json", (route) => route.abort());
  await page.goto("/#lab/object");
  await page.getByRole("button", { name: "Sample image", exact: true }).click();
  await expect(page.locator("#status")).toContainText("Model could not load", {
    timeout: 30000,
  });
  await page.unroute("**/models/coco/model.json");
  await page.getByRole("button", { name: "Retry", exact: true }).click();
  await expect(page.locator("#status")).toContainText("Real inference", {
    timeout: 90000,
  });
  await page.getByRole("link", { name: "All labs" }).click();
  await page.getByRole("link", { name: "Start Gesture Arcade" }).click();
  await page.getByRole("button", { name: "Start game", exact: true }).click();
  await expect(page.locator("#results")).toContainText("PLAYING");
});

test("device check can cancel a pending camera request and retry", async ({
  page,
}) => {
  await page.addInitScript(() => {
    const original = navigator.mediaDevices.getUserMedia.bind(
      navigator.mediaDevices,
    );
    navigator.mediaDevices.getUserMedia = async (constraints) => {
      const stream = await original(constraints);
      window.pendingTrack = stream.getTracks()[0];
      await new Promise((resolve) => setTimeout(resolve, 600));
      return stream;
    };
  });
  await page.goto("/#check");
  await page.getByRole("button", { name: "Test camera / Retry" }).click();
  await page.getByRole("button", { name: "Stop camera", exact: true }).click();
  await page.waitForTimeout(800);
  expect(await page.evaluate(() => window.pendingTrack.readyState)).toBe(
    "ended",
  );
  await expect(page.locator("#camera-result")).toContainText("Camera stopped");
  await page.getByRole("button", { name: "Test camera / Retry" }).click();
  await expect(page.locator("#camera-result")).toContainText(
    "Camera connected",
  );
  await page.getByRole("button", { name: "Stop camera", exact: true }).click();
  expect(await page.evaluate(() => window.pendingTrack.readyState)).toBe(
    "ended",
  );
});
