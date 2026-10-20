import test from "node:test";
import assert from "node:assert/strict";
import { handPaddleTarget } from "../src/labs/gesture-arcade.js";

test("central camera range covers the playfield and clamps outside it", () => {
  const hand = Array.from({ length: 21 }, () => ({ x: 0.5, y: 0.5 }));
  for (const [x, expected] of [[0.75, 0], [0.5, 320], [0.25, 640], [0.95, 0], [0.05, 640]]) {
    hand[8].x = x;
    assert.equal(handPaddleTarget(hand), expected);
  }
});
