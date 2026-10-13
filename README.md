# USACS Vision Playground

A 90-minute Rutgers USACS computer vision workshop, delivered as one static website. Students open a URL, allow camera access, and experiment with safe commands. No student installs, backend, API keys, uploads, or external terminal. Camera frames stay on the device. Initial website/model downloads require a network connection; no offline guarantee is made.

## Four working labs

- **Object Hunter:** TensorFlow.js COCO-SSD, actual bounding boxes, confidence filtering, class tracking, and a unique-class scavenger score. Includes an example photo and local image upload for genuine inference without a camera.
- **Facial Expression Analyzer:** MediaPipe Face Landmarker, 478 landmarks and real blendshape outputs. Smile, blink, jaw opening, frown, and eyebrow rules use adjustable thresholds and exponential smoothing. Movement estimates are not measurements of internal emotion.
- **Gesture Controller:** 21 hand landmarks, mirrored index-tip cursor, thumb/index pinch, hysteresis, smoothing, draggable circles/squares, and a target challenge.
- **Gesture Arcade:** hand-controlled paddle, pointer/keyboard fallback, falling orbs, bonus points, collisions, lives, score, increasing difficulty, pause/restart, and browser-local high score.

## Organizer setup

Use Node.js 22+ (students do not need Node).

```sh
npm install
npm run dev
```

Open the printed localhost URL. Real versioned model files, matching MediaPipe WASM, and the sample photo are included in `public/`. To restore missing assets, run `npm run models` after installing dependencies. This script downloads exact version-1 MediaPipe models, COCO-SSD lite MobileNet v2, and WASM from the pinned npm package. It records SHA-256 provenance in `public/models/manifest.json`. It reuses existing model files; delete a corrupt file before restoring it. COCO's upstream path is not explicitly versioned: the checked-in files and checksums preserve the exact delivered model.

```sh
npm test
npm run build
npm run preview
```

The `predev` and `prebuild` scripts generate `public/vision-worker.js` using pinned esbuild. Edit `src/shared/vision-worker.js`, not the generated bundle. A classic worker is used because MediaPipe’s WASM loader calls `importScripts`. The production output is `dist/`. Do not share your development-server URL with students. Deploy the static output over HTTPS.

## Student setup

Open the deployed URL in current Chrome or Edge. First use **Device check**, then choose a lab. Press **Start Camera** and allow access. Paste commands into the website console and press **Run Commands**. Ctrl/⌘+Enter runs commands; Alt+Up/Down recalls command history. Each line is validated independently; valid lines run even if another line has an error. Commands are lab-specific, not shell commands or JavaScript. `help` lists supported commands; `reset` restores defaults and resets the lab state without reloading.

## Command reference

All labs: `help`, `reset`. `show` options require exactly `on` or `off`.

### Object Hunter

```text
set confidence 0.5
set color blue
show boxes on
show labels off
track bottle
track cell phone
track person
track all
reset
```

Confidence range: 0.05–1 (inclusive). Colors: green, red, blue, purple, orange, white, yellow. Tracking accepts the 80 COCO classes, including bottle, cup, laptop, chair, backpack, book, and cell phone. Inference collects detections down to 0.05; the display applies your threshold immediately. Model predictions have limitations and may miss or mislabel real objects. Hunt points count distinct classes actually detected above the selected threshold, and reset with the lab.

### Facial Expression Analyzer

```text
set smile_threshold 0.45
set surprise_threshold 0.5
set blink_threshold 0.6
set frown_threshold 0.4
set brow_threshold 0.5
show landmarks on
show scores on
set smoothing 5
reset
```

Threshold range: 0.05–1. Smoothing: whole number 1–20; 1 means no smoothing. Signals: `mouthSmileLeft/Right`, `jawOpen`, `eyeBlinkLeft/Right`, `mouthFrownLeft/Right`, `browInnerUp`, `browOuterUpLeft/Right`. Priority: blink → jaw opening → smile → frown → brows → neutral. No detected face clears scores and reports “No face detected.” Very short blinks can be missed because inference is throttled and scores are smoothed.

### Gesture Controller

```text
show landmarks on
set pinch_distance 40
set object_size 80
set movement_speed 1.2
set smoothing 4
set color purple
spawn circle
spawn square
clear objects
reset
```

Pinch distance: 10–150 reference pixels. Object size: 20–160 reference pixels. Canvas reference is always 640 × 480, independent of CSS size. Actual thumb/index normalized coordinates are scaled to that reference. A held pinch releases at 1.3× the grab threshold. Movement speed scales reach around the canvas center (0.2–3). Smoothing: integer 1–20. Colors match Object Hunter. Dropping a shape fully inside the target completes the mission; shapes wider than the target cannot fit. Tracking loss safely releases the held object.

### Gesture Arcade

```text
set difficulty easy
set ball_speed 4
set lives 5
set paddle_width 120
set movement_speed 1.0
show landmarks on
start game
pause game
restart game
reset
```

Difficulty easy/medium/hard applies base speed and paddle presets (2/160, 4/120, 7/80). Override those after setting difficulty to build a custom level. Ball speed 1–12 is in 60 reference pixels/second units, further scaled by score. Lives: integer 1–20, immediately replacing remaining lives. Paddle width: 40–280 reference pixels. Movement speed 0.2–3 changes paddle response. Start resumes ready/paused games; restart resets score/lives and plays; reset restores defaults and returns to ready. At game over, use restart. Green = 1 point; gold = 5. Focus the game canvas for arrow keys or move the pointer over it. Background tabs pause the game. High score is local to this browser and may not persist if storage is disabled.

## Workshop and programming

The in-app Workshop guide contains the 90-minute agenda, objectives, copyable commands, prediction questions, experiments, explanations, and optional challenges. See [INSTRUCTOR_GUIDE.md](INSTRUCTOR_GUIDE.md) and [STUDENT_CHEATSHEET.md](STUDENT_CHEATSHEET.md).

Level 1 uses commands. Level 2 displays real JavaScript concepts alongside restricted numeric variable editors that use the same validated settings path. Level 3 uses pure starter functions in [challenges/](challenges/README.md); students fork the repository after the workshop to edit code and integrate their rules into the named lab module. Arbitrary JavaScript is never evaluated in the website.

## Deployment

See [DEPLOYMENT.md](DEPLOYMENT.md). A GitHub Actions workflow builds and publishes to GitHub Pages after the organizer pushes this repository and enables Pages → GitHub Actions. Static hosting uses HTTPS and a repository-aware Vite base path. Hash navigation avoids static-host deep-link 404s. No deployed URL is created by writing these files alone.

## Reliability and troubleshooting

| Problem | What to try |
| --- | --- |
| Permission denied | Allow camera access in the browser address bar/site settings; retry. |
| No camera / busy | Connect a camera; close Zoom/Meet or another camera tab; retry. |
| Camera API unavailable | Use HTTPS or localhost and a current Chrome/Edge browser. Embedded browsers may restrict cameras. |
| Slow inference | Close heavy tabs, use good lighting, hide landmarks/scores. Object detection runs at most 5 Hz; face/hands at most ~11 Hz, often slower depending on hardware. Sample images or arcade fallback avoid live inference. |
| Model fails | Use Device check → Load / Retry. Check hosted model/WASM paths and whether the network blocks downloads. Organizer can restore assets with `npm run models` then rebuild. A failed model does not disable other labs or arcade pointer/keyboard controls. |
| Wi-Fi restrictions | Serve all bundled assets from the same HTTPS host. Have the class load Device check before the session; check school network policy. |
| Wrong settings | Run `reset` or click Reset Lab. |
| Shapes jitter / release | Increase smoothing or adjust pinch distance. Keep the whole hand visible. |
| Misclassified expression | Inspect raw scores, adjust thresholds, improve lighting. This system cannot determine someone’s emotions. |

Model loading is lazy and cached; rejected loads are removed for retry. All streams stop on lab navigation and page exit. One animation loop handles rendering and game updates; inference is serialized and skips duplicate video frames. All model inference runs on CPU in background Web Workers, keeping synchronous model calls off the UI thread. Each worker serializes requests, closes transferred ImageBitmaps, and is terminated if loading or inference fails/times out. The UI waits an idle interval after each inference. Slower devices still have a lower inference rate, but the game and command interface remain independent. Current Chrome/Edge must support Worker, OffscreenCanvas, and createImageBitmap. Model caches remain available while the page is open to avoid expensive repeated initialization. Reload closes the page's resources.

## Verification

`npm test` covers parsing/validation, setting/reset behavior, object filtering, blendshape rules and missing faces, pinch hysteresis, transforms, gesture dragging and target completion, collision/scoring/lives, and game state. Browser tests use deterministic fake camera input and real downloaded models, not fabricated model predictions.

```sh
npx playwright install chromium
npm run test:browser
```

Browser tests cover navigation/mobile width, consoles, arcade fallback, sample-image COCO inference, MediaPipe initialization and fake-video inference, denied permissions, and stream cleanup. Automated fake input does not demonstrate expression recognition or gestures on a real human. Check [VERIFICATION.md](VERIFICATION.md) for actually completed results and the manual checklist.

## Structure and model sources

`src/labs/` holds testable lab rules; `src/shared/` holds commands, settings, camera, models, coordinate mapping and rendering. `src/workshop/lessons.js` holds in-app curriculum. `public/models/` contains actual local assets. `scripts/prepare-models.mjs` preserves provenance.

Model API references: [COCO-SSD](https://github.com/tensorflow/tfjs-models/tree/master/coco-ssd), [MediaPipe Face Landmarker](https://ai.google.dev/edge/mediapipe/solutions/vision/face_landmarker/web_js), [MediaPipe Hand Landmarker](https://ai.google.dev/edge/mediapipe/solutions/vision/hand_landmarker/web_js). Runtime dependencies and lockfile are pinned. Review [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md) before redistribution.
