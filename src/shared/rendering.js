import { toCanvas } from "./coordinates.js";
export const handEdges = [
  [0, 1],
  [1, 2],
  [2, 3],
  [3, 4],
  [0, 5],
  [5, 6],
  [6, 7],
  [7, 8],
  [5, 9],
  [9, 10],
  [10, 11],
  [11, 12],
  [9, 13],
  [13, 14],
  [14, 15],
  [15, 16],
  [13, 17],
  [0, 17],
  [17, 18],
  [18, 19],
  [19, 20],
];
export function renderLandmarks(ctx, points, hand = false) {
  if (!points) return;
  ctx.strokeStyle = "#b5f36d99";
  ctx.lineWidth = 2;
  if (hand)
    for (const [a, b] of handEdges) {
      const p = toCanvas(points[a]),
        q = toCanvas(points[b]);
      ctx.beginPath();
      ctx.moveTo(p.x, p.y);
      ctx.lineTo(q.x, q.y);
      ctx.stroke();
    }
  ctx.fillStyle = "#b5f36d";
  for (const point of points) {
    const p = toCanvas(point);
    ctx.beginPath();
    ctx.arc(p.x, p.y, hand ? 3 : 1.4, 0, Math.PI * 2);
    ctx.fill();
  }
}
