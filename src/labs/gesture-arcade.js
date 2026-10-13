import { clamp } from "../shared/coordinates.js";
export function createGame(settings, high = 0) {
  return {
    status: "ready",
    score: 0,
    lives: settings.lives,
    high,
    balls: [],
    paddleX: 320,
    target: 320,
    elapsed: 0,
    spawn: 0,
  };
}
export function gameAction(game, action, settings) {
  if (action === "restart" || action === "reset") {
    Object.assign(game, createGame(settings, game.high));
    if (action === "restart") game.status = "playing";
  } else if (action === "start" && game.status !== "over")
    game.status = "playing";
  else if (action === "pause" && game.status === "playing")
    game.status = "paused";
}
export function collision(ball, x, width) {
  return (
    ball.y + ball.radius >= 435 &&
    ball.y - ball.radius <= 450 &&
    ball.x + ball.radius >= x - width / 2 &&
    ball.x - ball.radius <= x + width / 2
  );
}
export function updateGame(game, dt, settings, random = Math.random) {
  if (game.status !== "playing") return;
  game.elapsed += dt;
  game.spawn -= dt;
  game.paddleX = clamp(
    game.paddleX +
      (game.target - game.paddleX) *
        Math.min(1, dt * 12 * settings.movement_speed),
    settings.paddle_width / 2,
    640 - settings.paddle_width / 2,
  );
  if (game.spawn <= 0) {
    game.balls.push({
      x: 20 + random() * 600,
      y: -20,
      radius: 12,
      bonus: random() < 0.12,
    });
    game.spawn = Math.max(
      0.25,
      { easy: 1.5, medium: 1, hard: 0.65 }[settings.difficulty] /
        (1 + game.score / 30),
    );
  }
  for (const ball of game.balls) {
    ball.y += settings.ball_speed * 60 * (1 + game.score / 50) * dt;
    if (collision(ball, game.paddleX, settings.paddle_width)) {
      game.score += ball.bonus ? 5 : 1;
      game.high = Math.max(game.high, game.score);
      ball.dead = true;
    } else if (ball.y - ball.radius > 480) {
      game.lives--;
      ball.dead = true;
      if (game.lives <= 0) {
        game.lives = 0;
        game.status = "over";
        break;
      }
    }
  }
  game.balls = game.balls.filter((b) => !b.dead);
}
export function renderGame(ctx, game, settings) {
  ctx.fillStyle = "#101322d9";
  ctx.fillRect(0, 0, 640, 480);
  ctx.strokeStyle = "#ffffff08";
  for (let x = 0; x < 640; x += 40) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, 480);
    ctx.stroke();
  }
  for (let y = 0; y < 480; y += 40) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(640, y);
    ctx.stroke();
  }
  for (const ball of game.balls) {
    ctx.fillStyle = ball.bonus ? "#ffd581" : "#b5f36d";
    ctx.shadowColor = ctx.fillStyle;
    ctx.shadowBlur = 15;
    ctx.beginPath();
    ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.shadowBlur = 0;
  ctx.fillStyle = "#bc9cff";
  ctx.beginPath();
  ctx.roundRect(
    game.paddleX - settings.paddle_width / 2,
    435,
    settings.paddle_width,
    15,
    7,
  );
  ctx.fill();
  ctx.fillStyle = "#fff";
  ctx.font = "bold 19px monospace";
  ctx.fillText(`SCORE ${String(game.score).padStart(3, "0")}`, 24, 35);
  ctx.fillStyle = "#ff8d9e";
  ctx.fillText(`LIVES ${game.lives}`, 490, 35);
  if (game.status !== "playing") {
    ctx.fillStyle = "#101114b8";
    ctx.fillRect(0, 70, 640, 330);
    ctx.textAlign = "center";
    ctx.fillStyle = "#fff";
    ctx.font = "bold 32px sans-serif";
    ctx.fillText(
      { ready: "Ready, player one?", paused: "Game paused", over: "Nice run!" }[
        game.status
      ],
      320,
      210,
    );
    ctx.font = "16px sans-serif";
    ctx.fillStyle = "#a7abb9";
    ctx.fillText(
      game.status === "over"
        ? `Final score: ${game.score} · Best: ${game.high}`
        : "Move your hand, use ← →, or move the pointer.",
      320,
      248,
    );
    ctx.fillText(
      game.status === "over"
        ? "Run “restart game” to play again."
        : "Run “start game” to play.",
      320,
      280,
    );
    ctx.textAlign = "left";
  }
}
