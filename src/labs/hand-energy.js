import { toCanvas, smoothPoint, clamp } from "../shared/coordinates.js";
const fingers = [
  [5, 6, 8],
  [9, 10, 12],
  [13, 14, 16],
  [17, 18, 20],
];
const distance = (a, b) => Math.hypot((a.x - b.x) * 640, (a.y - b.y) * 480);
function angle(a, b, c) {
  const u = { x: (a.x - b.x) * 640, y: (a.y - b.y) * 480 },
    v = { x: (c.x - b.x) * 640, y: (c.y - b.y) * 480 };
  const length = Math.hypot(u.x, u.y) * Math.hypot(v.x, v.y);
  return length
    ? (Math.acos(clamp((u.x * v.x + u.y * v.y) / length, -1, 1)) * 180) /
        Math.PI
    : 0;
}
// Angles and palm-relative distances work for either hand and different camera distances.
export function classifyHandPose(hand) {
  if (
    !Array.isArray(hand) ||
    hand.length !== 21 ||
    hand.some((p) => !p || !Number.isFinite(p.x) || !Number.isFinite(p.y))
  )
    return "none";
  const palm = distance(hand[0], hand[9]);
  if (palm < 8) return "none";
  let extended = 0,
    curled = 0;
  for (const [mcp, pip, tip] of fingers) {
    const bend = angle(hand[mcp], hand[pip], hand[tip]);
    if (
      bend > 150 &&
      distance(hand[0], hand[tip]) > distance(hand[0], hand[pip]) * 1.1
    )
      extended++;
    if (bend < 115 && distance(hand[mcp], hand[tip]) < palm * 0.95) curled++;
  }
  return extended === 4 ? "open" : curled === 4 ? "fist" : "neutral";
}
export function createHandEnergy() {
  return {
    pose: "none",
    candidate: "none",
    samples: 0,
    candidateSince: 0,
    lastSeen: -Infinity,
    anchor: null,
    charge: 0,
    phase: 0,
    armedUntil: 0,
    burst: null,
  };
}
export function resetHandEnergy(state) {
  Object.assign(state, createHandEnergy());
}
// Called only when a NEW model result arrives, never once per display frame.
export function observeHandEnergy(state, hand, settings, now) {
  if (!settings.effects || !hand) {
    resetHandEnergy(state);
    return;
  }
  const pose = classifyHandPose(hand);
  if (pose === "none") {
    resetHandEnergy(state);
    return;
  }
  state.lastSeen = now;
  const points = [0, 5, 9, 13, 17].map((i) => toCanvas(hand[i]));
  const center = {
    x: points.reduce((s, p) => s + p.x, 0) / 5,
    y: points.reduce((s, p) => s + p.y, 0) / 5,
  };
  state.anchor = smoothPoint(state.anchor, center, settings.smoothing);
  if (pose !== state.candidate) {
    state.candidate = pose;
    state.samples = 1;
    state.candidateSince = now;
  } else state.samples++;
  if (state.samples < 2 || now - state.candidateSince < 70) return;
  if (pose === "open") {
    state.pose = "open";
    state.armedUntil = now + 1500;
  } else if (pose === "fist") {
    if (state.pose !== "fist" && state.armedUntil > now) {
      state.burst = { ...state.anchor, age: 0 };
      state.armedUntil = 0;
      state.charge = 0;
    }
    state.pose = "fist";
  } else state.pose = "neutral";
}
export function advanceHandEnergy(state, dt, settings, now) {
  if (!settings.effects || now - state.lastSeen > 1200) {
    resetHandEnergy(state);
    return;
  }
  const seconds = clamp(dt, 0, 0.1);
  state.phase = (state.phase + seconds * 2.5) % (Math.PI * 2);
  const target = state.pose === "open" ? 1 : 0;
  state.charge += (target - state.charge) * Math.min(1, seconds * 9);
  if (state.burst) {
    state.burst.age += seconds;
    if (state.burst.age > 0.75) state.burst = null;
  }
}
export function renderHandEnergy(
  ctx,
  state,
  settings,
  color,
  reducedMotion = false,
) {
  if (!settings.effects) return;
  ctx.save();
  if (state.anchor && state.charge > 0.02) {
    const { x, y } = state.anchor,
      r = settings.energy_size * state.charge;
    ctx.globalCompositeOperation = "lighter";
    const glow = ctx.createRadialGradient(x, y, 0, x, y, r * 1.7);
    glow.addColorStop(0, "#f4ffff");
    glow.addColorStop(0.12, "#b8faff");
    glow.addColorStop(0.38, color + "bb");
    glow.addColorStop(1, color + "00");
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(x, y, r * 1.7, 0, Math.PI * 2);
    ctx.fill();
    ctx.translate(x, y);
    ctx.strokeStyle = "#bffaff";
    ctx.lineWidth = 1.8;
    ctx.globalAlpha = state.charge * 0.85;
    for (let strand = 0; strand < 4; strand++) {
      const phase = reducedMotion
        ? strand * 1.6
        : state.phase * (strand % 2 ? 1 : -1) + strand * 1.6;
      ctx.beginPath();
      for (let i = 0; i <= 24; i++) {
        const t = i / 24,
          theta = t * Math.PI * 3 + phase,
          rr = r * (0.15 + t * 0.85);
        const sx = Math.cos(theta) * rr,
          sy = Math.sin(theta) * rr * 0.55,
          tilt = (strand * Math.PI) / 4,
          px = sx * Math.cos(tilt) - sy * Math.sin(tilt),
          py = sx * Math.sin(tilt) + sy * Math.cos(tilt);
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.stroke();
    }
    ctx.rotate(reducedMotion ? 0.4 : state.phase * 0.6);
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.ellipse(0, 0, r, r * 0.55, 0, 0, Math.PI * 2);
    ctx.stroke();
  }
  ctx.restore();
  if (state.burst) {
    ctx.save();
    const { x, y, age } = state.burst,
      t = age / 0.75,
      r = settings.energy_size;
    ctx.globalAlpha = (1 - t) * 0.75;
    ctx.strokeStyle = "#d4f7ff";
    ctx.lineWidth = 3 * (1 - t);
    ctx.beginPath();
    ctx.arc(x, y, r * (0.2 + t * 1.7), 0, Math.PI * 2);
    ctx.stroke();
    // A fixed 14 puffs; no textures, shaders, particle allocations, or extra animation loops.
    for (let i = 0; i < 14; i++) {
      const theta = (i / 14) * Math.PI * 2,
        travel = reducedMotion ? r * 0.3 : r * t * (0.8 + (i % 3) * 0.3);
      ctx.fillStyle = i % 2 ? "#d6edff" : color;
      ctx.beginPath();
      ctx.arc(
        x + Math.cos(theta) * travel,
        y + Math.sin(theta) * travel - t * 18,
        r * (0.12 + t * 0.18),
        0,
        Math.PI * 2,
      );
      ctx.fill();
    }
    ctx.restore();
  }
}
