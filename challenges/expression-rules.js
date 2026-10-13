// Level 3: add another visible-movement rule; do not infer internal emotions.
// Compare this with classifyExpression in src/labs/expression-analyzer.js.
export function isSmiling(scores, threshold = 0.45) {
  return (
    ((scores.mouthSmileLeft || 0) + (scores.mouthSmileRight || 0)) / 2 >=
    threshold
  );
}
