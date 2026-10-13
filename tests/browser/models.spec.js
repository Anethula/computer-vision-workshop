import { test, expect } from "@playwright/test";
import { readFile } from "node:fs/promises";
test("real face and hand photographs yield actual blendshapes and 21 hand points", async ({
  page,
}) => {
  await page.goto("/");
  const face = (
    await readFile(new URL("../fixtures/portrait.jpg", import.meta.url))
  ).toString("base64");
  const hand = (
    await readFile(new URL("../fixtures/right_hands.jpg", import.meta.url))
  ).toString("base64");
  const results = await page.evaluate(
    async ({ face, hand }) => {
      const { loadModel } = await import("/src/shared/models.js");
      async function image(data) {
        const img = new Image();
        img.src = "data:image/jpeg;base64," + data;
        await img.decode();
        return img;
      }
      const f = await loadModel("face");
      const faceResult = await f.detectForVideo(
        await image(face),
        performance.now(),
      );
      const h = await loadModel("hand");
      const handResult = await h.detectForVideo(
        await image(hand),
        performance.now(),
      );
      return {
        facePoints: faceResult.faceLandmarks[0]?.length,
        categories: faceResult.faceBlendshapes[0]?.categories,
        handPoints: handResult.landmarks[0]?.length,
      };
    },
    { face, hand },
  );
  expect(results.facePoints).toBe(478);
  expect(results.handPoints).toBe(21);
  for (const name of [
    "mouthSmileLeft",
    "mouthSmileRight",
    "jawOpen",
    "eyeBlinkLeft",
    "eyeBlinkRight",
    "mouthFrownLeft",
    "mouthFrownRight",
    "browInnerUp",
    "browOuterUpLeft",
    "browOuterUpRight",
  ]) {
    const c = results.categories.find((c) => c.categoryName === name);
    expect(c).toBeTruthy();
    expect(c.score).toBeGreaterThanOrEqual(0);
    expect(c.score).toBeLessThanOrEqual(1);
  }
});
