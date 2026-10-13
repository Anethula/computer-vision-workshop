export const WIDTH = 640,
  HEIGHT = 480;
export const clamp = (v, min, max) => Math.max(min, Math.min(max, v));
export function toCanvas(point, mirrored = true) {
  return { x: (mirrored ? 1 - point.x : point.x) * WIDTH, y: point.y * HEIGHT };
}
export function pinchDistance(hand) {
  return Math.hypot(
    (hand[4].x - hand[8].x) * WIDTH,
    (hand[4].y - hand[8].y) * HEIGHT,
  );
}
export function isPinching(distance, threshold, wasPinching) {
  return distance < threshold * (wasPinching ? 1.3 : 1);
}
export function smoothPoint(old, next, smoothing) {
  return old
    ? {
        x: old.x + (next.x - old.x) / smoothing,
        y: old.y + (next.y - old.y) / smoothing,
      }
    : next;
}
