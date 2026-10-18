import { createHandEnergy } from "./hand-energy.js";
import {
  toCanvas,
  pinchDistance,
  isPinching,
  smoothPoint,
  clamp,
} from "../shared/coordinates.js";
export function createGesture() {
  return {
    objects: [
      { x: 180, y: 230, shape: "circle" },
      { x: 310, y: 330, shape: "square" },
    ],
    energy: createHandEnergy(),
    cursor: null,
    pinching: false,
    grabbed: null,
    offset: null,
    completed: false,
  };
}
export function updateGesture(state, hand, settings) {
  if (!hand) {
    state.cursor = null;
    state.pinching = false;
    state.grabbed = null;
    return;
  }
  const p = toCanvas(hand[8]);
  const next = {
    x: clamp(320 + (p.x - 320) * settings.movement_speed, 0, 640),
    y: clamp(240 + (p.y - 240) * settings.movement_speed, 0, 480),
  };
  state.cursor = smoothPoint(state.cursor, next, settings.smoothing);
  const pinch =
    !(settings.effects && state.energy.pose === "fist") &&
    isPinching(pinchDistance(hand), settings.pinch_distance, state.pinching);
  if (pinch && !state.pinching) {
    state.grabbed =
      state.objects.findLast((o) =>
        o.shape === "square"
          ? Math.abs(o.x - state.cursor.x) <= settings.object_size / 2 &&
            Math.abs(o.y - state.cursor.y) <= settings.object_size / 2
          : Math.hypot(o.x - state.cursor.x, o.y - state.cursor.y) <=
            settings.object_size / 2,
      ) || null;
    if (state.grabbed)
      state.offset = {
        x: state.grabbed.x - state.cursor.x,
        y: state.grabbed.y - state.cursor.y,
      };
  }
  if (pinch && state.grabbed) {
    state.grabbed.x = clamp(
      state.cursor.x + state.offset.x,
      settings.object_size / 2,
      640 - settings.object_size / 2,
    );
    state.grabbed.y = clamp(
      state.cursor.y + state.offset.y,
      settings.object_size / 2,
      480 - settings.object_size / 2,
    );
  }
  if (!pinch) {
    if (
      state.grabbed &&
      Math.abs(state.grabbed.x - 510) < 65 - settings.object_size / 2 &&
      Math.abs(state.grabbed.y - 230) < 95 - settings.object_size / 2
    )
      state.completed = true;
    state.grabbed = null;
  }
  state.pinching = pinch;
}
export function renderGesture(ctx, state, settings, color) {
  ctx.fillStyle = "#b5f36d10";
  ctx.strokeStyle = "#b5f36d";
  ctx.setLineDash([7, 7]);
  ctx.strokeRect(445, 135, 130, 190);
  ctx.fillRect(445, 135, 130, 190);
  ctx.setLineDash([]);
  ctx.fillStyle = "#b5f36d";
  ctx.font = "12px monospace";
  ctx.fillText("DROP ZONE", 470, 123);
  for (const o of state.objects) {
    ctx.fillStyle = color;
    ctx.shadowColor = color;
    ctx.shadowBlur = state.grabbed === o ? 25 : 0;
    ctx.beginPath();
    if (o.shape === "circle")
      ctx.arc(o.x, o.y, settings.object_size / 2, 0, Math.PI * 2);
    else
      ctx.rect(
        o.x - settings.object_size / 2,
        o.y - settings.object_size / 2,
        settings.object_size,
        settings.object_size,
      );
    ctx.fill();
    ctx.shadowBlur = 0;
  }
  if (state.cursor) {
    ctx.strokeStyle = state.pinching ? "#fff" : "#b5f36d";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(
      state.cursor.x,
      state.cursor.y,
      state.pinching ? 10 : 17,
      0,
      Math.PI * 2,
    );
    ctx.stroke();
  }
}
