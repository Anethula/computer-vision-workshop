# Third-party assets

- TensorFlow.js 4.22.0 (core, converter, CPU backend) and COCO-SSD 2.2.3: Apache-2.0. Upstream: https://github.com/tensorflow/tfjs and https://github.com/tensorflow/tfjs-models. COCO-SSD lite MobileNet v2 weights come from the TensorFlow-hosted model path recorded in `public/models/manifest.json`; preserve their upstream terms when redistributing.
- MediaPipe Tasks Vision 0.10.22-rc.20250304 and matching WASM: Apache-2.0. Face Landmarker and Hand Landmarker float16 version 1 assets come from Google's official MediaPipe model bucket; provenance is recorded in the manifest. Model cards and intended-use documentation: https://ai.google.dev/edge/mediapipe/solutions/vision/face_landmarker and https://ai.google.dev/edge/mediapipe/solutions/vision/hand_landmarker.
- Sample cat photo: TensorFlow tfjs-models COCO-SSD demo asset from the exact revision in `scripts/prepare-models.mjs`. Included as an upstream example asset under the repository's Apache-2.0 license; no separate public-domain claim is made.
- Vite, esbuild, and Playwright are development tooling; their licenses remain in their installed packages and upstream repositories.

Copies of the Apache-2.0 license and upstream notices are in `public/models/` and `public/samples/`. Runtime models are served locally. No model results are simulated.
