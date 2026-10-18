# Start here — students on Mac or Windows

## Joining the workshop: nothing to install

Your instructor deploys the website and shares one HTTPS link. You do not need to clone this repository, install Node.js or Python, use a terminal, or create an account.

You need:

- A Mac or Windows laptop with an up-to-date Chrome or Edge browser. If one of these browsers is already installed, no additional software is needed.
- A working built-in or USB webcam and permission to use it.
- Internet access for the website and initial model downloads; allow a little time for the first load.
- Enough light to see your face and whole hand clearly.

1. Open the instructor's HTTPS website link directly in a browser tab.
2. Open **Device check**. Test the camera and load each model before class starts.
3. Pick a lab, press **Start Camera**, and choose **Allow** when the browser asks.
4. Paste commands into the website's **Experiment Console**, then press **Run Commands**. These commands go in the website, not your computer's terminal.
5. Stop the camera when finished. Leaving a lab also stops it.

### Lab 3: energy gestures

Face your palm toward the camera with your whole hand visible. Extend all four fingers and hold briefly: a swirling energy orb appears over your palm. Close those fingers into a fist and hold briefly: the orb becomes a poof. Open your hand again to recharge. A fist alone does not repeatedly trigger bursts. You can still pinch and drag the shapes.

```text
show effects on
set energy_size 55
set color blue
```

Try sizes 20–100 and different colors. **Effects: On/Off** or `show effects off` turns off the animation. Reduced-motion browser/OS preferences simplify the effect. Turning effects off does not stop hand tracking; Stop Camera does.

### If something doesn't work

- **Permission denied:** allow camera access in the browser's address-bar/site settings, then Retry.
- **Camera busy:** close video-call apps and other camera tabs, then retry.
- **Tracking misses your hand:** move farther back until the whole hand is visible, face your palm to the camera, improve lighting, and hold the pose briefly. Pose rules are estimates; angles and occlusion can cause mistakes.
- **Slow laptop:** close other heavy tabs/apps and use `show landmarks off` and `show effects off`. Processing runs in CPU workers, but slower laptops still update tracking less often.
- **Model does not load:** use Device check and Retry. A managed school laptop may restrict cameras, workers, WebAssembly, graphics, or downloads. Ask the instructor about using another compatible device.
- **No camera:** Object Hunter supports Sample image/local image upload. Gesture Arcade supports pointer/keyboard. Lab 3's hand effects require a camera; there is no pretend tracking mode.

Mac and Windows use the same website and commands. There is no guarantee for every laptop or browser; the instructor should test representative devices and campus Wi-Fi before class. No dedicated graphics card is required by the inference code. Current browser support for workers, OffscreenCanvas, ImageBitmap and WebAssembly is needed. Camera images stay on your device.

## Optional: cloning the project to edit its source

This is for students who want to develop the application, not a requirement for participating in the workshop.

Install **Node.js 22 or newer** (npm comes with it). To use `git clone`, also install **Git**. Alternatively, download the repository as a ZIP and extract it; Git is then unnecessary. A code editor is optional.

Open Terminal on Mac or Command Prompt on Windows, navigate to the project folder, then run:

```sh
npm install
npm run dev
```

Open the localhost URL printed in the terminal, keep that terminal open, and allow camera access in the browser. To stop the server, press Ctrl+C. On PowerShell, if execution policy blocks `npm.ps1`, use `npm.cmd install` and `npm.cmd run dev`, or use Command Prompt. You do not need to change system security settings.

Models are bundled in `public/models/`. If missing, restore them with `npm run models` after dependency installation. Do not open `index.html` directly from the filesystem. `npm run dev` automatically builds the worker bundle before launching. No Python, pip, OpenCV installation, API keys, or backend is required.

## Instructor / organizer

See README.md for setup and DEPLOYMENT.md for GitHub Pages. Deploy once, then send the website URL to students. Test actual Mac/Windows webcams and school networks; automated fixture/fake-camera tests cannot guarantee every physical device. Preload models before the session and plan for shared Wi-Fi bandwidth. Keep the image and arcade fallbacks ready.
