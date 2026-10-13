import test from "node:test";
import assert from "node:assert/strict";
import {
  parseCommand,
  applyCommand,
  commandReference,
} from "../src/shared/commands.js";
import { initialSettings, defaults } from "../src/shared/settings.js";
import { filterObjects } from "../src/labs/object-detector.js";
import {
  blendshapeScores,
  classifyExpression,
  smoothScores,
} from "../src/labs/expression-analyzer.js";
import {
  toCanvas,
  pinchDistance,
  isPinching,
  smoothPoint,
} from "../src/shared/coordinates.js";
import {
  createGesture,
  updateGesture,
} from "../src/labs/gesture-controller.js";
import {
  createGame,
  gameAction,
  collision,
  updateGame,
} from "../src/labs/gesture-arcade.js";
import { cameraError } from "../src/shared/camera.js";
test("parser supports whitespace, comments, multiword COCO classes, and booleans", () => {
  assert.deepEqual(parseCommand(" SET confidence 0.9 ", "object"), {
    type: "set",
    key: "confidence",
    value: 0.9,
  });
  assert.equal(parseCommand("track cell phone", "object").value, "cell phone");
  assert.equal(parseCommand("show landmarks off", "face").value, false);
  assert.equal(parseCommand("# note", "object").type, "skip");
});
test("validation rejects unknown, cross-lab, injection, invalid and out-of-range commands", () => {
  for (const c of [
    "set confidence NaN",
    "set confidence 1.1",
    "set confidence -1",
    "set color rainbow",
    "show boxes yes",
    "set smoothing 3",
    "track dragon",
    "reset now",
    "alert(1)",
    "set confidence 0.5; rm -rf",
  ])
    assert.throws(() => parseCommand(c, "object"));
  assert.throws(() => parseCommand("set smoothing 2.5", "face"));
  assert.throws(() => parseCommand("set difficulty extreme", "arcade"));
  assert.throws(() => parseCommand("set lives 0", "arcade"));
});
test("settings update, difficulty presets, and independent resets", () => {
  const s = initialSettings("object");
  applyCommand(s, parseCommand("set confidence 0.9", "object"), "object");
  assert.equal(s.confidence, 0.9);
  assert.equal(defaults.object.confidence, 0.5);
  applyCommand(s, { type: "reset" }, "object");
  assert.deepEqual(s, defaults.object);
  const g = initialSettings("arcade");
  applyCommand(g, parseCommand("set difficulty hard", "arcade"), "arcade");
  assert.equal(g.ball_speed, 7);
  assert.equal(g.paddle_width, 80);
  for (const lab of Object.keys(defaults)) {
    assert.ok(commandReference(lab).includes("help"));
    const a = initialSettings(lab);
    applyCommand(a, { type: "reset" }, lab);
    assert.deepEqual(a, defaults[lab]);
  }
});
test("objects filter confidence and class inclusively", () => {
  const p = [
    { class: "bottle", score: 0.8 },
    { class: "person", score: 0.9 },
    { class: "bottle", score: 0.4 },
  ];
  assert.equal(filterObjects(p, { confidence: 0.8, track: "all" }).length, 2);
  assert.equal(
    filterObjects(p, { confidence: 0.5, track: "bottle" }).length,
    1,
  );
});
test("actual blendshape category names map to classification signals", () => {
  const s = initialSettings("face");
  assert.equal(
    blendshapeScores([{ categoryName: "jawOpen", score: 0.8 }]).jawOpen,
    0.8,
  );
  for (const [scores, label] of [
    [null, "none"],
    [{}, "neutral"],
    [{ mouthSmileLeft: 0.8, mouthSmileRight: 0.7 }, "smile"],
    [{ jawOpen: 0.8 }, "surprise"],
    [{ eyeBlinkLeft: 0.8, eyeBlinkRight: 0.8 }, "blink"],
    [{ mouthFrownLeft: 0.8, mouthFrownRight: 0.7 }, "frown"],
    [{ browInnerUp: 0.9 }, "brows"],
  ])
    assert.equal(classifyExpression(scores, s), label);
  s.smile_threshold = 0.9;
  assert.equal(
    classifyExpression({ mouthSmileLeft: 0.8, mouthSmileRight: 0.8 }, s),
    "neutral",
  );
  assert.deepEqual(smoothScores({ jawOpen: 0 }, { jawOpen: 1 }, 5), {
    jawOpen: 0.2,
  });
  assert.equal(smoothScores({ jawOpen: 1 }, null, 5), null);
});
test("coordinate transforms, reference pixels, smoothing, and pinch hysteresis", () => {
  assert.deepEqual(toCanvas({ x: 0.25, y: 0.5 }), { x: 480, y: 240 });
  assert.deepEqual(toCanvas({ x: 0.25, y: 0.5 }, false), { x: 160, y: 240 });
  const h = Array.from({ length: 21 }, () => ({ x: 0, y: 0 }));
  h[8].x = 0.0625;
  assert.equal(pinchDistance(h), 40);
  assert.equal(isPinching(45, 40, false), false);
  assert.equal(isPinching(45, 40, true), true);
  assert.equal(isPinching(53, 40, true), false);
  assert.deepEqual(smoothPoint({ x: 0, y: 0 }, { x: 100, y: 100 }, 4), {
    x: 25,
    y: 25,
  });
});
test("gesture grabs, drags, releases, completes target, and releases on tracking loss", () => {
  const s = { ...initialSettings("gesture"), smoothing: 1 };
  const state = createGesture();
  const hand = Array.from({ length: 21 }, () => ({ x: 0, y: 0 }));
  function move(x, y, pinch) {
    hand[8] = { x: 1 - x / 640, y: y / 480 };
    hand[4] = { x: hand[8].x + (pinch ? 0.01 : 0.2), y: hand[8].y };
    updateGesture(state, hand, s);
  }
  move(180, 230, true);
  assert.equal(state.grabbed, state.objects[0]);
  move(510, 230, true);
  assert.equal(state.objects[0].x, 510);
  move(510, 230, false);
  assert.equal(state.grabbed, null);
  assert.equal(state.completed, true);
  move(510, 230, true);
  updateGesture(state, null, s);
  assert.equal(state.grabbed, null);
  assert.equal(state.cursor, null);
});
test("arcade start/pause/restart does not duplicate or clear a running game", () => {
  const s = initialSettings("arcade"),
    g = createGame(s, 10);
  assert.equal(g.status, "ready");
  gameAction(g, "start", s);
  g.score = 5;
  gameAction(g, "start", s);
  assert.equal(g.score, 5);
  gameAction(g, "pause", s);
  updateGame(g, 1, s);
  assert.equal(g.elapsed, 0);
  gameAction(g, "restart", s);
  assert.equal(g.score, 0);
  assert.equal(g.lives, 5);
  assert.equal(g.high, 10);
  assert.equal(g.status, "playing");
  gameAction(g, "reset", s);
  assert.equal(g.status, "ready");
});
test("collision includes ball radius, awards real catches, bonus points, and lives", () => {
  const s = initialSettings("arcade"),
    g = createGame(s);
  gameAction(g, "start", s);
  g.spawn = 10;
  g.balls = [{ x: 320, y: 425, radius: 12, bonus: true }];
  assert.equal(collision(g.balls[0], 320, 120), true);
  assert.equal(collision({ x: 450, y: 435, radius: 12 }, 320, 120), false);
  updateGame(g, 0, s, () => 0.5);
  assert.equal(g.score, 5);
  assert.equal(g.high, 5);
  assert.equal(g.balls.length, 0);
  g.lives = 1;
  g.balls = [{ x: 10, y: 500, radius: 12 }];
  updateGame(g, 0, s);
  assert.equal(g.lives, 0);
  assert.equal(g.status, "over");
  assert.equal(g.score, 5);
});
test("delta-time movement, paddle speed, spawn, and difficulty affect actual gameplay", () => {
  const s = initialSettings("arcade"),
    g = createGame(s);
  gameAction(g, "start", s);
  g.spawn = 10;
  g.balls = [{ x: 10, y: 0, radius: 12 }];
  updateGame(g, 0.1, s);
  assert.equal(g.balls[0].y, 24);
  s.ball_speed = 8;
  updateGame(g, 0.1, s);
  assert.equal(g.balls[0].y, 72);
  g.target = 500;
  g.paddleX = 320;
  s.movement_speed = 0.2;
  updateGame(g, 0.05, s);
  assert.ok(g.paddleX > 320 && g.paddleX < 500);
  g.spawn = 0;
  updateGame(g, 0, s, () => 0.5);
  assert.equal(g.balls.length, 2);
});
test("camera errors provide actionable instructions", () => {
  assert.match(cameraError({ name: "NotAllowedError" }), /permission denied/);
  assert.match(cameraError({ name: "NotReadableError" }), /busy/);
});

test("COCO boxes align even when camera delivers a different intrinsic resolution", async () => {
  const { referenceBoxes } = await import("../src/shared/detections.js");
  assert.deepEqual(
    referenceBoxes(
      [{ class: "person", score: 0.9, bbox: [100, 50, 400, 200] }],
      1280,
      720,
    )[0].bbox,
    [50, (50 * 480) / 720, 200, (200 * 480) / 720],
  );
});
