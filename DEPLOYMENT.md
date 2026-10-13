# Deploy with GitHub Pages

Only the organizer performs these steps. Students open a single HTTPS URL.

1. Create a GitHub repository and push the project including `public/models/`, `public/samples/`, `package-lock.json`, and `.github/workflows/pages.yml`. This task created project files in the supplied folder; it did not create or publish a GitHub repository.
2. Use `main` as the deployment branch, or change the workflow's branch filter to match your default branch.
3. In repository Settings → Pages, choose **GitHub Actions** as the build source.
4. Push to `main` or manually run **Deploy Vision Playground**. The workflow runs `npm ci`, `npm test`, and `npm run build`, uploads `dist`, and deploys it to Pages.
5. Open the URL returned by the deployment job, normally `https://OWNER.github.io/REPOSITORY/`. Run Device check there before sharing it.

The workflow sets `BASE_PATH=/REPOSITORY/` for Vite. For an account-root site (`OWNER.github.io`) or a custom domain, set `BASE_PATH=/` instead. For any other static host, run `npm run build` with an appropriate base path and upload the entire `dist/` folder. Do not omit the large binary model files or WASM.

## Verify before class

- The HTTPS root, JS/CSS assets, `models/coco/model.json`, every referenced shard, `models/face_landmarker.task`, `models/hand_landmarker.task`, and `models/wasm/` all return actual files (not an HTML fallback).
- Device check loads all three models and shows a live webcam preview after user interaction.
- Object Hunter recognizes objects; face and hand labs report actual signals from your webcam.
- Navigate between labs and confirm the webcam indicator turns off.
- The site works from the campus Wi-Fi and on student Chrome/Edge devices.

Everything needed for inference is same-origin in the production bundle. No third-party CDN is required at runtime. Initial asset loading still needs internet. Browser caching is best effort; offline operation is not guaranteed. HTTPS is essential for camera permission outside localhost. A sandboxed iframe or embedded browser may block camera access even over HTTPS; open the site directly in a browser tab.

## Manual deployment build

```sh
npm ci
npm test
BASE_PATH=/Computer-Vision-workshop/ npm run build
```

PowerShell equivalent: `$env:BASE_PATH='/Computer-Vision-workshop/'; npm run build`.

Model files are already included. If restoring them, run `npm run models` before building. Check `public/models/manifest.json` and third-party notices before redistributing. The workflow requires GitHub Pages availability for the repository and permission to deploy from Actions.
