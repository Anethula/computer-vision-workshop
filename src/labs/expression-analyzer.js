export const expressions = {
  smile: ["😄", "You’re smiling!"],
  surprise: ["😮", "Mouth open / surprise-like expression"],
  blink: ["😉", "You blinked!"],
  frown: ["🙁", "You appear to be frowning"],
  brows: ["🤨", "Eyebrows raised!"],
  neutral: ["😐", "Neutral expression"],
  none: ["◌", "No face detected."],
};
export function blendshapeScores(categories) {
  return Object.fromEntries(
    (categories || []).map((c) => [c.categoryName, c.score]),
  );
}
export function classifyExpression(scores, settings) {
  if (!scores) return "none";
  const avg = (a, b) => ((scores[a] || 0) + (scores[b] || 0)) / 2;
  if (avg("eyeBlinkLeft", "eyeBlinkRight") >= settings.blink_threshold)
    return "blink";
  if (scores.jawOpen >= settings.surprise_threshold) return "surprise";
  if (avg("mouthSmileLeft", "mouthSmileRight") >= settings.smile_threshold)
    return "smile";
  if (avg("mouthFrownLeft", "mouthFrownRight") >= settings.frown_threshold)
    return "frown";
  if (
    Math.max(
      scores.browInnerUp || 0,
      avg("browOuterUpLeft", "browOuterUpRight"),
    ) >= settings.brow_threshold
  )
    return "brows";
  return "neutral";
}
export function smoothScores(previous, next, window) {
  if (!next) return null;
  if (!previous) return next;
  return Object.fromEntries(
    Object.entries(next).map(([k, v]) => [
      k,
      (previous[k] || 0) + (v - (previous[k] || 0)) / window,
    ]),
  );
}
