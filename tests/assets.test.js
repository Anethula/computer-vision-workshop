import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { createHash } from "node:crypto";
test("bundled model manifests, checksums, shards and WASM are valid", async () => {
  const root = new URL("../public/models/", import.meta.url);
  const m = JSON.parse(await readFile(new URL("manifest.json", root), "utf8"));
  for (const f of m.files) {
    const data = await readFile(new URL(f.path, root));
    assert.equal(data.length, f.bytes, f.path);
    assert.equal(
      createHash("sha256").update(data).digest("hex"),
      f.sha256,
      f.path,
    );
  }
  const coco = JSON.parse(
    await readFile(new URL("coco/model.json", root), "utf8"),
  );
  assert.ok(coco.modelTopology.node.length > 0);
  for (const group of coco.weightsManifest)
    for (const path of group.paths)
      assert.ok(m.files.some((f) => f.path === "coco/" + path));
  for (const file of [
    "vision_wasm_internal.wasm",
    "vision_wasm_nosimd_internal.wasm",
  ]) {
    const data = await readFile(new URL("wasm/" + file, root));
    assert.deepEqual([...data.subarray(0, 4)], [0, 97, 115, 109]);
  }
  const pkg = JSON.parse(
    await readFile(new URL("../package.json", import.meta.url), "utf8"),
  );
  assert.equal(pkg.dependencies["@mediapipe/tasks-vision"], m.mediapipeVersion);
  assert.ok(
    (await readFile(new URL("../public/samples/cat.jpg", import.meta.url)))
      .length > 1000,
  );
});
