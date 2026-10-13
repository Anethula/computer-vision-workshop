import { mkdir, writeFile, readFile, cp } from "node:fs/promises";
import { createHash } from "node:crypto";
const root = new URL("../public/models/", import.meta.url);
await mkdir(root, { recursive: true });
const manifest = [];
async function download(url, path) {
  const dest = new URL(path, root);
  await mkdir(new URL("./", dest), { recursive: true });
  let data;
  try {
    data = await readFile(dest);
  } catch {
    const r = await fetch(url);
    if (!r.ok) throw Error(`${r.status}: ${url}`);
    data = Buffer.from(await r.arrayBuffer());
    await writeFile(dest, data);
  }
  manifest.push({
    path,
    url,
    bytes: data.length,
    sha256: createHash("sha256").update(data).digest("hex"),
  });
  console.log(`${path}: ${data.length} bytes`);
  return data;
}
await download(
  "https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task",
  "face_landmarker.task",
);
await download(
  "https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task",
  "hand_landmarker.task",
);
const coco =
  "https://storage.googleapis.com/tfjs-models/savedmodel/ssdlite_mobilenet_v2/";
const json = JSON.parse(await download(coco + "model.json", "coco/model.json"));
for (const group of json.weightsManifest)
  for (const path of group.paths) await download(coco + path, "coco/" + path);
await cp(
  new URL("../node_modules/@mediapipe/tasks-vision/wasm/", import.meta.url),
  new URL("wasm/", root),
  { recursive: true },
);
await writeFile(
  new URL("manifest.json", root),
  JSON.stringify(
    {
      mediapipeVersion: "0.10.22-rc.20250304",
      cocoVersion: "2.2.3",
      files: manifest,
    },
    null,
    2,
  ),
);
// TensorFlow.js example photo; provenance and upstream license in public/samples/README.md.
await mkdir(new URL("../public/samples/", import.meta.url), {
  recursive: true,
});
const r = await fetch(
  "https://raw.githubusercontent.com/tensorflow/tfjs-models/c731b9ebbd6f4c9e8bf99b0df76bbdbf9c25b07f/coco-ssd/demo/cat.jpg",
);
if (!r.ok) throw Error("Sample download failed");
await writeFile(
  new URL("../public/samples/cat.jpg", import.meta.url),
  Buffer.from(await r.arrayBuffer()),
);
