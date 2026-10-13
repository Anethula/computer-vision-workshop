import { build } from "esbuild";
// Classic workers are required by MediaPipe's version-matched WASM loader.
// Vite's development workers are module workers, so bundle this entry explicitly.
await build({
  entryPoints: ["src/shared/vision-worker.js"],
  outfile: "public/vision-worker.js",
  bundle: true,
  format: "iife",
  platform: "browser",
  target: "es2022",
  minify: true,
  define: { "process.env.NODE_ENV": '"production"' },
  logLevel: "info",
});
