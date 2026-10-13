const cache = new Map();
const base = import.meta.env.BASE_URL + "models/";
function workerModel(kind, onStatus) {
  if (
    !globalThis.Worker ||
    !globalThis.createImageBitmap ||
    !globalThis.OffscreenCanvas
  )
    throw Error(
      "This browser needs Web Workers, ImageBitmap, and OffscreenCanvas. Use a current Chrome or Edge browser.",
    );
  const worker = new Worker(
    new URL(import.meta.env.BASE_URL + "vision-worker.js", location.href),
    { type: "classic" },
  );
  const pending = new Map();
  let nextId = 0,
    failed = null;
  function fail(error) {
    failed = error;
    worker.terminate();
    cache.delete(kind);
    for (const { reject, timer } of pending.values()) {
      clearTimeout(timer);
      reject(error);
    }
    pending.clear();
  }
  worker.onerror = (event) =>
    fail(Error(event.message || "The vision worker stopped. Retry the model."));
  worker.onmessage = ({ data }) => {
    if (data.type === "status") {
      onStatus(data.text);
      return;
    }
    const request = pending.get(data.id);
    if (!request) return;
    clearTimeout(request.timer);
    pending.delete(data.id);
    if (data.error) {
      const error = Error(data.error);
      request.reject(error);
      fail(error);
    } else request.resolve(data.result);
  };
  function request(type, extra = {}, transfer = []) {
    if (failed) return Promise.reject(failed);
    return new Promise((resolve, reject) => {
      const id = ++nextId;
      const timer = setTimeout(
        () =>
          fail(
            Error(
              type === "load"
                ? "Model download timed out. Check your network and retry."
                : "Inference timed out. Retry or use a fallback.",
            ),
          ),
        type === "load" ? 120000 : 20000,
      );
      pending.set(id, { resolve, reject, timer });
      try {
        worker.postMessage({ id, type, ...extra }, transfer);
      } catch (e) {
        clearTimeout(timer);
        pending.delete(id);
        reject(e);
      }
    });
  }
  const ready = request("load", {
    kind,
    base: new URL(base, location.href).href,
  }).catch((error) => {
    fail(error);
    throw error;
  });
  async function infer(source, timestamp, maxBoxes = 40, minScore = 0.05) {
    await ready;
    const bitmap = await createImageBitmap(source);
    try {
      return await request("infer", { bitmap, timestamp, maxBoxes, minScore }, [
        bitmap,
      ]);
    } catch (e) {
      bitmap.close();
      throw e;
    }
  }
  return ready.then(() => ({
    detect: (source, maxBoxes, minScore) =>
      infer(source, performance.now(), maxBoxes, minScore),
    detectForVideo: (source, timestamp) => infer(source, timestamp),
  }));
}
export function loadModel(kind, onStatus = () => {}) {
  if (cache.has(kind)) return cache.get(kind);
  onStatus("Starting local inference worker…");
  const promise = Promise.resolve()
    .then(() => workerModel(kind, onStatus))
    .then((model) => {
      onStatus("Model ready · CPU inference in background worker");
      return model;
    })
    .catch((e) => {
      cache.delete(kind);
      throw Error(
        `Model could not load: ${e.message}. Retry, check the network, or run npm run models as the organizer.`,
      );
    });
  cache.set(kind, promise);
  return promise;
}
