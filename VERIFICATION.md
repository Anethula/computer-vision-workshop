# Verification record

Executed on macOS ARM64 with Node.js 24.2.0. The project supports Node.js 22+ for organizers. Browser automation used Playwright 1.56.1 and its Chromium 141.0.7390.37. No real webcam hardware was accessed during testing.

## Completed checks

- `npm install`: successful; exact runtime/dev dependencies and package lock installed.
- `npm run models`: successful; actual MediaPipe version-1 face/hand models, COCO model plus all five shards, version-matched WASM, and a real sample photo downloaded.
- `npm test`: 13 passing tests, covering commands/validation, settings/reset, object filtering, expression classification and missing faces, smoothing, pinch hysteresis, coordinates, intrinsic video size mapping, gesture grab/drag/drop and tracking loss, game states, collisions/score/lives/delta time, and model asset checksum/manifest integrity.
- `npm run build`: successful, including a build with `BASE_PATH=/Computer-Vision-workshop/` matching a GitHub Pages repository subdirectory.
- `npm run test:browser`: all 12 cases passed in the final complete run (34.3 seconds): dashboard and workshop navigation/mobile width, all lab consoles and resets, arcade controls, actual sample-image object inference, all four labs consuming a fake camera stream, no face/hand handling, stream cleanup on navigation, denied permissions, failed model download followed by successful retry, pending camera cancellation/retry, and actual face/hand image outputs.
- Real-image model assertions: COCO-SSD identifies a cat; Face Landmarker returns 478 landmarks and the documented smile, blink, jaw, frown, and eyebrow blendshape category names; Hand Landmarker returns 21 landmarks. These use model outputs, never synthetic predictions.
- Production subdirectory smoke: compiled assets served under `/Computer-Vision-workshop/`; dashboard navigation, real COCO sample-image inference, Face/Hand model initialization, and zero uncaught browser errors passed.
- Desktop dashboard/lab and 390px mobile screens captured and visually reviewed for layout, readability, and overflow.
- After the final sample Retry-button adjustment, its failure/recovery browser test and the production build passed again.
- `npm audit`: zero known vulnerabilities after replacing the full TFJS convenience package with pinned core/converter/backends and updating Vite.

Browser failures found during development were corrected or rerun after the source was stable. A first attempt ran before the Chromium download finished; a later stream assertion coincided with a Vite code reload. A combined GPU run then stalled under headless Chromium. The final implementation moves all inference into classic CPU workers, with timeouts and serialized frame handling; the final complete suite passed with that implementation. Camera cleanup assertions wait for the new route to render before inspecting the previous track. Fake-camera tests exercise actual browser video input and model calls, but their generated frames contain no real person or hand.

## Manual acceptance before the live workshop

These checks are still required and are **not claimed as passed**:

1. Real webcam permission, detection, facial movements/blinks, hand pinch/drag/release, and hand-controlled arcade on representative Windows, macOS, and ChromeOS laptops using Chrome/Edge.
2. Real camera mirroring and box/landmark alignment for 4:3 and 16:9 camera devices; software transforms are tested, but hardware previews need checking.
3. Full live 90-minute workshop, projector legibility, low-end performance, and simultaneous classroom asset downloads.
4. The actual deployed GitHub Pages HTTPS URL and campus Wi-Fi model loading/permissions. No remote repository or deployment was created in this task.
5. Permission-denied recovery through real browser UI, unplugged/busy camera behavior, and long-duration resource use on physical devices.
6. Keyboard-only and screen-reader usability with actual assistive technology; semantic controls and focus styling are implemented, but no formal accessibility certification is claimed.

## Remaining limitations

Models are fixed pretrained systems and can miss/mislabel inputs. Facial movements do not reveal internal emotions. Model initialization downloads substantial assets (the complete static build is approximately 52 MB); network access is needed and offline use is not guaranteed. Inference runs on CPU in background workers and is throttled; low-end devices may update tracking slowly. Worker, OffscreenCanvas, and ImageBitmap support are required for models. Brief blinks can be missed with smoothing/throttling. Only Object Hunter offers still-image fallback; Gesture Arcade offers pointer/keyboard fallback. Gesture Controller and facial live analysis require a compatible camera and runtime. High score depends on localStorage availability. Models have a two-minute initialization timeout and a 20-second inference timeout. Failures terminate the worker, evict the cached model, and allow retry.
