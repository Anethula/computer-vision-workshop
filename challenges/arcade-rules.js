// Level 3: modify points, then import this into gesture-arcade.js at a collision.
export function pointsForCatch(ball) {
  return ball.bonus ? 5 : 1;
}
