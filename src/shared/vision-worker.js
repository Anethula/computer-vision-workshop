import * as tf from "@tensorflow/tfjs-core";
import "@tensorflow/tfjs-backend-cpu";
import * as coco from "@tensorflow-models/coco-ssd";
import {
  FilesetResolver,
  FaceLandmarker,
  HandLandmarker,
} from "@mediapipe/tasks-vision";
let model, kind;
const status = (text) => self.postMessage({ type: "status", text });
async function handle(message) {
  const { id, type, bitmap } = message;
  try {
    if (type === "load") {
      kind = message.kind;
      status("Loading local model assets in a background worker…");
      if (kind === "object") {
        await tf.setBackend("cpu");
        await tf.ready();
        model = await coco.load({
          base: "lite_mobilenet_v2",
          modelUrl: message.base + "coco/model.json",
        });
      } else {
        const files = await FilesetResolver.forVisionTasks(
          message.base + "wasm",
        );
        const Type = kind === "face" ? FaceLandmarker : HandLandmarker;
        model = await Type.createFromOptions(files, {
          baseOptions: {
            modelAssetPath:
              message.base +
              (kind === "face" ? "face" : "hand") +
              "_landmarker.task",
            delegate: "CPU",
          },
          runningMode: "VIDEO",
          ...(kind === "face"
            ? { numFaces: 1, outputFaceBlendshapes: true }
            : { numHands: 1 }),
        });
      }
      self.postMessage({ id, result: true });
    } else if (type === "infer") {
      if (!model) throw Error("Model is not initialized.");
      const result =
        kind === "object"
          ? await model.detect(bitmap, message.maxBoxes, message.minScore)
          : model.detectForVideo(bitmap, message.timestamp);
      self.postMessage({ id, result });
    }
  } catch (error) {
    self.postMessage({ id, error: error.message || String(error) });
  } finally {
    bitmap?.close();
  }
}
// Serialize messages, including sample-image commands, within each cached model.
let queue = Promise.resolve();
self.onmessage = (event) => {
  queue = queue.then(() => handle(event.data));
};
