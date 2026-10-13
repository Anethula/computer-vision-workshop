export function filterObjects(predictions, settings) {
  return predictions.filter(
    (p) =>
      p.score >= settings.confidence &&
      (settings.track === "all" || p.class === settings.track),
  );
}
export function renderObjects(ctx, predictions, settings, color, mirror) {
  for (const p of filterObjects(predictions, settings)) {
    const [sx, y, w, h] = p.bbox;
    const x = mirror ? 640 - sx - w : sx;
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    if (settings.boxes) ctx.strokeRect(x, y, w, h);
    if (settings.labels) {
      const text = `${p.class} · ${Math.round(p.score * 100)}%`;
      ctx.font = "bold 14px monospace";
      const tw = ctx.measureText(text).width + 16;
      ctx.fillStyle = color;
      ctx.fillRect(x, Math.max(0, y - 25), tw, 25);
      ctx.fillStyle = "#101114";
      ctx.fillText(text, x + 8, Math.max(17, y - 7));
    }
  }
}
