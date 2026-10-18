import { test, expect } from "@playwright/test";
import { readFile } from "node:fs/promises";
test("real face and hand photographs yield actual blendshapes and 21 hand points", async ({
  page,
}, testInfo) => {
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
      const {
        classifyHandPose,
        createHandEnergy,
        observeHandEnergy,
        advanceHandEnergy,
        renderHandEnergy,
      } = await import("/src/labs/hand-energy.js");
      const { initialSettings } = await import("/src/shared/settings.js");
      const energy = createHandEnergy(),
        settings = initialSettings("gesture");
      observeHandEnergy(energy, handResult.landmarks[0], settings, 0);
      observeHandEnergy(energy, handResult.landmarks[0], settings, 100);
      advanceHandEnergy(energy, 0.1, settings, 200);
      const canvas = document.createElement("canvas");
      canvas.id = "energy-preview";
      canvas.width = 640;
      canvas.height = 480;
      canvas.style.cssText =
        "position:fixed;left:0;top:0;z-index:999;background:#101114";
      document.body.append(canvas);
      const ctx = canvas.getContext("2d");
      ctx.save();
      ctx.translate(640, 0);
      ctx.scale(-1, 1);
      ctx.drawImage(await image(hand), 0, 0, 640, 480);
      ctx.restore();
      renderHandEnergy(ctx, energy, settings, "#6aaaff");
      return {
        handPose: classifyHandPose(handResult.landmarks[0]),
        facePoints: faceResult.faceLandmarks[0]?.length,
        categories: faceResult.faceBlendshapes[0]?.categories,
        handPoints: handResult.landmarks[0]?.length,
      };
    },
    { face, hand },
  );
  await page
    .locator("#energy-preview")
    .screenshot({ path: testInfo.outputPath("energy-orb.png") });
  expect(results.facePoints).toBe(478);
  expect(results.handPoints).toBe(21);
  expect(results.handPose).toBe("open");
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
