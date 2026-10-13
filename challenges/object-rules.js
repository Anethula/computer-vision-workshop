// Level 3: change this pure function, then use it in src/labs/object-detector.js.
// Try a lower confidence for bottles and a higher confidence for people.
export function shouldHighlight(object, settings) {
  return (
    object.score >= settings.confidence &&
    (settings.track === "all" || object.class === settings.track)
  );
}
