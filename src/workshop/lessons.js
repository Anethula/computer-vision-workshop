export const labs = [
  {
    id: "object",
    number: "01",
    icon: "⌖",
    title: "Object Hunter",
    tag: "DETECTION",
    difficulty: "Beginner",
    accent: "green",
    description:
      "Give your camera a new perspective. Find everyday objects hiding in plain sight.",
    objective: "Understand bounding boxes and confidence scores.",
    challenge: "Can you get the computer to recognize your water bottle?",
    steps:
      "Find an object nearby. Show it to your camera. Lower confidence, change box colors, then track just that class.",
    question:
      "What will happen to the number of boxes when confidence increases?",
    explanation:
      "COCO-SSD predicts a class and score for each box. A higher threshold filters out uncertain predictions; it does not make the model more accurate. Lighting, angle, and training data affect results.",
    experiment:
      "Compare 0.3 and 0.9 on the same object. Count which boxes remain.",
    optional:
      "Scavenger hunt: collect as many different detected classes as you can. Only real detections count.",
    example: "set confidence 0.5\nset color green\nshow boxes on\ntrack bottle",
    code: "function shouldHighlight(object) {\n  return object.class === TARGET\n    && object.score >= THRESHOLD;\n}",
    exerciseKey: "confidence",
    exerciseValue: 0.6,
    advanced:
      "Extend challenges/object-rules.js with a class-specific threshold.",
  },
  {
    id: "face",
    number: "02",
    icon: "☺",
    title: "Expression Analyzer",
    fullTitle: "Facial Expression Analyzer",
    tag: "FACE LANDMARKS",
    difficulty: "Beginner",
    accent: "purple",
    description:
      "A smile, a blink, a raised eyebrow. Turn facial movement into live signals.",
    objective: "Explore blendshapes, thresholds, and smoothing.",
    challenge: "How sensitive can you make your smile detector?",
    steps:
      "Smile, raise the threshold, then lower it. Find the point at which neutral expressions begin to trigger a smile.",
    question:
      "Will a smaller smile threshold make the detector more sensitive?",
    explanation:
      "MediaPipe measures visible movement as blendshape scores. Rules compare those values with thresholds. Smoothing averages changes over time to reduce flicker. These estimates describe movements, not internal emotions.",
    experiment:
      "Try smile thresholds of 0.2 and 0.8. Compare smoothing 1 and 10.",
    optional:
      "After the workshop, customize the smile emoji in expression-analyzer.js.",
    example:
      "set smile_threshold 0.45\nset blink_threshold 0.6\nshow landmarks on\nshow scores on\nset smoothing 5",
    code: "const smiling = (left + right) / 2\n  >= SMILE_THRESHOLD;",
    exerciseKey: "smile_threshold",
    exerciseValue: 0.3,
    advanced: "Extend challenges/expression-rules.js with an eyebrow rule.",
  },
  {
    id: "gesture",
    number: "03",
    icon: "✋",
    title: "Gesture Controller",
    tag: "HAND TRACKING",
    difficulty: "Intermediate",
    accent: "blue",
    description:
      "Reach into the canvas. Pinch, grab, and move shapes with just your hand.",
    objective: "Map landmarks into coordinates and build a gesture.",
    challenge:
      "Move the virtual circle into the target without touching your mouse.",
    steps:
      "Point at a shape, pinch to grab, move into the target, and release. Try different pinch distances and smoothing values.",
    question: "What happens if the pinch threshold is too large?",
    explanation:
      "The index tip is landmark 8 and thumb tip is landmark 4. Their Euclidean distance defines a pinch. Coordinates map to a mirrored 640 × 480 canvas. Release uses a threshold 30% larger than grab to prevent flicker.",
    experiment:
      "Compare pinch_distance 25 and 75. Spawn a square and change its size.",
    optional: "Add a finger drawing trail after the workshop.",
    example:
      "show landmarks on\nset pinch_distance 40\nset object_size 80\nset smoothing 4\nspawn circle",
    code: "const distance = Math.hypot(\n  thumb.x - index.x,\n  thumb.y - index.y\n);\nconst grabbing = distance < THRESHOLD;",
    exerciseKey: "pinch_distance",
    exerciseValue: 35,
    advanced:
      "Extend challenges/gesture-rules.js with a custom release margin.",
  },
  {
    id: "arcade",
    number: "04",
    icon: "◈",
    title: "Gesture Arcade",
    tag: "VISION × GAMES",
    difficulty: "Intermediate",
    accent: "orange",
    description:
      "Your hand is the controller. Catch falling orbs and chase your high score.",
    objective: "Combine vision, collision detection, and a game loop.",
    challenge: "Build your own difficulty level.",
    steps:
      "Adjust ball speed, paddle size, movement speed, and lives. Catch green orbs for 1 point and gold bonus orbs for 5.",
    question:
      "Which makes the game harder: a smaller paddle or faster falling objects?",
    explanation:
      "Hand x-coordinates set the paddle target. Delta time keeps movement consistent across frame rates. A collision occurs when a ball overlaps the paddle; a miss costs one life. Spawns and speed increase with score.",
    experiment:
      "Try a 60px paddle with speed 2, then a 200px paddle with speed 8.",
    optional:
      "Change bonus points or add a new falling object type in the source.",
    example:
      "set difficulty easy\nset ball_speed 4\nset lives 5\nset paddle_width 120\nstart game",
    code: "if (ballOverlapsPaddle) {\n  score += ball.bonus ? 5 : 1;\n} else if (ballBelowScreen) {\n  lives -= 1;\n}",
    exerciseKey: "ball_speed",
    exerciseValue: 6,
    advanced: "Extend challenges/arcade-rules.js with your own bonus scoring.",
  },
];
export const agenda = [
  ["00–10", "Welcome & live demos", "See what a camera can do."],
  ["10–20", "Computer vision, explained", "Pixels → models → predictions."],
  ["20–35", "Object Hunter", "Find, filter, and track objects."],
  ["35–50", "Expression Analyzer", "Read movement. Explore thresholds."],
  ["50–70", "Gesture Controller", "Build a pinch-and-drag interaction."],
  ["70–85", "Gesture Arcade", "Tune your game. Beat your best."],
  ["85–90", "Showcase & wrap-up", "Share an experiment and what you learned."],
];
