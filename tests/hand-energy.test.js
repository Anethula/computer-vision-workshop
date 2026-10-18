import test from "node:test";
import assert from "node:assert/strict";
import {
  classifyHandPose,
  createHandEnergy,
  observeHandEnergy,
  advanceHandEnergy,
  renderHandEnergy,
} from "../src/labs/hand-energy.js";
import { initialSettings } from "../src/shared/settings.js";
import { parseCommand, applyCommand } from "../src/shared/commands.js";
function pose(fist = false) {
  const h = Array.from({ length: 21 }, () => ({ x: 0.5, y: 0.6 }));
  h[0] = { x: 0.5, y: 0.85 };
  for (let i = 0; i < 4; i++) {
    const mcp = 5 + i * 4,
      x = 0.35 + i * 0.1;
    h[mcp] = { x, y: 0.55 };
    h[mcp + 1] = { x, y: 0.4 };
    h[mcp + 2] = { x, y: fist ? 0.52 : 0.3 };
    h[mcp + 3] = { x, y: fist ? 0.62 : 0.2 };
  }
  return h;
}
const settings = () => initialSettings("gesture");
function confirm(state, hand, time = 0, s = settings()) {
  observeHandEnergy(state, hand, s, time);
  observeHandEnergy(state, hand, s, time + 100);
}
test("open/fist geometry is invariant to handedness, rotation and distance", () => {
  for (const fist of [false, true])
    for (const scale of [0.6, 1, 1.4])
      for (const theta of [0, 0.7, 2.8])
        for (const mirror of [-1, 1]) {
          const hand = pose(fist).map((p) => {
            const x = (p.x - 0.5) * 640 * scale * mirror,
              y = (p.y - 0.5) * 480 * scale;
            return {
              x: 0.5 + (x * Math.cos(theta) - y * Math.sin(theta)) / 640,
              y: 0.5 + (x * Math.sin(theta) + y * Math.cos(theta)) / 480,
            };
          });
          assert.equal(classifyHandPose(hand), fist ? "fist" : "open");
        }
  assert.equal(classifyHandPose(null), "none");
  assert.equal(classifyHandPose(Array(21).fill({ x: 0.5, y: 0.5 })), "none");
  const partial = pose();
  partial[8] = { ...partial[5] };
  assert.equal(classifyHandPose(partial), "neutral");
});
test("fresh-result confirmation prevents jitter and only open-to-fist emits one poof", () => {
  const s = settings(),
    state = createHandEnergy();
  observeHandEnergy(state, pose(), s, 0);
  advanceHandEnergy(state, 0.1, s, 100);
  assert.equal(state.charge, 0);
  observeHandEnergy(state, pose(true), s, 100);
  assert.equal(state.pose, "none");
  confirm(state, pose(), 200);
  advanceHandEnergy(state, 0.1, s, 310);
  assert.ok(state.charge > 0);
  assert.equal(state.burst, null);
  confirm(state, pose(true), 400);
  assert.ok(state.burst);
  const burst = state.burst;
  confirm(state, pose(true), 600);
  assert.equal(state.burst, burst);
  for (let i = 0; i < 10; i++) advanceHandEnergy(state, 0.1, s, 700 + i * 50);
  assert.equal(state.burst, null);
  confirm(state, pose(), 1200);
  confirm(state, pose(true), 1400);
  assert.ok(state.burst);
});
test("a fist alone, tracking loss, disabled effects and stale frames cannot create energy", () => {
  const s = settings(),
    state = createHandEnergy();
  confirm(state, pose(true));
  assert.equal(state.burst, null);
  confirm(state, pose(), 200);
  observeHandEnergy(state, null, s, 400);
  confirm(state, pose(true), 500);
  assert.equal(state.burst, null);
  confirm(state, pose(), 700);
  s.effects = false;
  advanceHandEnergy(state, 0.1, s, 900);
  assert.equal(state.pose, "none");
  assert.equal(state.charge, 0);
  s.effects = true;
  confirm(state, pose(), 1000);
  advanceHandEnergy(state, 0.1, s, 2400);
  assert.equal(state.pose, "none");
  assert.equal(state.burst, null);
});
test("new effect commands validate, update settings and reset", () => {
  const s = settings();
  applyCommand(s, parseCommand("show effects off", "gesture"), "gesture");
  assert.equal(s.effects, false);
  applyCommand(s, parseCommand("set energy_size 85", "gesture"), "gesture");
  assert.equal(s.energy_size, 85);
  assert.throws(() => parseCommand("set energy_size 999", "gesture"));
  assert.throws(() => parseCommand("show effects on", "object"));
  applyCommand(s, { type: "reset" }, "gesture");
  assert.equal(s.effects, true);
  assert.equal(s.energy_size, 55);
});
test("canvas effects render within balanced save/restore state, including reduced motion", () => {
  let depth = 0,
    arcs = 0;
  const ctx = new Proxy(
    {
      save() {
        depth++;
      },
      restore() {
        depth--;
      },
      arc() {
        arcs++;
      },
      createRadialGradient() {
        return { addColorStop() {} };
      },
    },
    { get: (target, key) => target[key] || (() => {}) },
  );
  const state = createHandEnergy(),
    s = settings();
  confirm(state, pose());
  advanceHandEnergy(state, 0.1, s, 200);
  renderHandEnergy(ctx, state, s, "#78b4ff");
  renderHandEnergy(ctx, state, s, "#78b4ff", true);
  confirm(state, pose(true), 300);
  renderHandEnergy(ctx, state, s, "#78b4ff");
  assert.equal(depth, 0);
  assert.ok(arcs >= 16);
});
