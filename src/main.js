import { starterCode, codeCommands } from "./shared/code-lab.js";
import {
  observeHandEnergy,
  advanceHandEnergy,
  renderHandEnergy,
  resetHandEnergy,
} from "./labs/hand-energy.js";
import "./styles/main.css";
import { labs } from "./workshop/lessons.js";
import { initialSettings, colors, ranges } from "./shared/settings.js";
import {
  parseCommand,
  applyCommand,
  commandReference,
} from "./shared/commands.js";
import { startCamera, stopCamera, cameraError } from "./shared/camera.js";
import { loadModel } from "./shared/models.js";
import { referenceBoxes } from "./shared/detections.js";
import { filterObjects, renderObjects } from "./labs/object-detector.js";
import {
  blendshapeScores,
  classifyExpression,
  smoothScores,
  expressions,
} from "./labs/expression-analyzer.js";
import {
  createGesture,
  updateGesture,
  renderGesture,
} from "./labs/gesture-controller.js";
import {
  createGame,
  gameAction,
  updateGame,
  renderGame,
  handPaddleTarget,
  renderHandGuide,
} from "./labs/gesture-arcade.js";
import { renderLandmarks } from "./shared/rendering.js";
import { pinchDistance, clamp } from "./shared/coordinates.js";
const app = document.querySelector("#app");
const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
const escape = (s) =>
  String(s).replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ],
  );
const $ = (id) => document.getElementById(id);
let sourceRevision = 0;
let active = null,
  epoch = 0,
  frame = 0,
  currentModel = null,
  stream = null,
  starting = false,
  predictions = [],
  hand = null,
  facePoints = null,
  scores = null,
  gesture = null,
  game = null,
  sample = null,
  lastInference = 0,
  lastVideo = -1,
  busy = false,
  lastFrame = 0,
  lastUI = 0;
const settings = Object.fromEntries(
  labs.map((l) => [l.id, initialSettings(l.id)]),
);
const histories = Object.fromEntries(labs.map((l) => [l.id, []]));
let historyIndex = 0;
const collected = new Set();
let high = 0;
try {
  high = Number(localStorage.getItem("usacs-high")) || 0;
} catch {}
function shell(content, page = "home") {
  app.innerHTML = `<header class="topbar"><a class="brand" href="#home" aria-label="USACS Vision Playground home"><span class="brand-mark">u<span>•</span></span><span>USACS <strong>VISION PLAYGROUND</strong></span></a><nav aria-label="Main navigation"><a href="#home" class="${page === "home" ? "selected" : ""}">Playground</a><a href="#workshop" class="${page === "workshop" ? "selected" : ""}">Workshop guide</a><a href="#check" class="${page === "check" ? "selected" : ""}">Device check</a></nav><span class="rutgers">RUTGERS <i>↗</i></span></header><main>${content}</main><footer><span>Built for curious minds. <strong>Rutgers USACS</strong></span><span><i class="dot"></i> Local inference · Your camera stays yours</span></footer>`;
}
function home() {
  shell(
    `<section class="hero"><div class="eyebrow"><span class="dot"></span> THE COMPUTER VISION WORKSHOP</div><h1>See the world.<br><span>Teach your computer to.</span></h1><p>Turn your webcam into a playground. Explore four hands-on labs,<br class="desktop"> experiment with a little code, and see what happens.</p><div class="hero-actions"><a class="button primary" href="#lab/object">Let’s experiment <span>↗</span></a><a class="button subtle" href="#workshop">Explore the workshop <span>→</span></a></div><div class="hero-meta"><span>◷ &nbsp;90 minutes</span><span>⌘ &nbsp;No installation</span><span>◎ &nbsp;100% in your browser</span></div><div class="vision-art" aria-hidden="true"><div class="art-grid"></div><div class="scan-box"><span class="scan-label">curiosity <b>99.9%</b></span><div class="orb"></div><span class="cross c1">+</span><span class="cross c2">+</span><span class="cross c3">+</span><span class="cross c4">+</span></div><div class="art-caption">INPUT: YOUR WORLD<br>OUTPUT: POSSIBILITIES<span>● SYSTEM READY</span></div></div></section><section class="labs-section"><div class="section-heading"><div><span class="eyebrow">PICK YOUR EXPERIMENT</span><h2>Four labs. Endless “what ifs.”</h2></div><span class="section-note">Start anywhere. Make it your own.</span></div><div class="lab-grid">${labs.map((l) => `<article class="lab-card ${l.accent}"><div class="card-top"><span class="lab-icon">${l.icon}</span><span class="lab-number">LAB ${l.number}</span></div><span class="eyebrow">${l.tag}</span><h3>${l.title}</h3><p>${l.description}</p><div class="objective">${l.objective}</div><div class="card-bottom"><span class="difficulty"><i class="dot"></i> ${l.difficulty}</span><a href="#lab/${l.id}" aria-label="Start ${l.title}">Start lab <span>↗</span></a></div></article>`).join("")}</div></section><section class="how-strip"><div><span class="mini-icon">01</span><h3>Open a lab</h3><p>Pick something that sparks your curiosity.</p></div><div><span class="mini-icon">02</span><h3>Connect your camera</h3><p>Everything is processed on your device.</p></div><div><span class="mini-icon">03</span><h3>Change a command</h3><p>Predict. Experiment. See the difference.</p></div></section>`,
  );
}
function cleanup() {
  busy = false;
  epoch++;
  sourceRevision++;
  cancelAnimationFrame(frame);
  stopCamera($("video"));
  stream = null;
  starting = false;
  currentModel = null;
  sample = null;
  predictions = [];
  hand = null;
  facePoints = null;
  scores = null;
  lastVideo = -1;
  lastInference = 0;
  lastFrame = 0;
  lastUI = 0;
  active = null;
}
function lessonMarkup(l) {
  return `<div class="lesson-grid"><article class="lesson"><span class="eyebrow">01 / PREDICT</span><h3>${l.question}</h3><p>Make a prediction before changing a parameter.</p></article><article class="lesson"><span class="eyebrow">02 / EXPERIMENT</span><h3>${l.challenge}</h3><p>${l.steps}</p><p>${l.experiment}</p></article><article class="lesson"><span class="eyebrow">03 / UNDERSTAND</span><h3>Why does it work?</h3><p>${l.explanation}</p><p><strong>Go further:</strong> ${l.optional}</p></article></div>`;
}
function workshop() {
  shell(
    `<section class="page-intro"><span class="eyebrow">YOUR 90-MINUTE FIELD GUIDE</span><h1>From pixels to possibilities.</h1><p>Predict first. Change one thing. Explain what happened.</p></section>${labs.map((l) => `<section class="workshop-lab"><div class="section-heading"><div><span class="eyebrow">LAB ${l.number} / ${l.objective}</span><h2>${l.fullTitle || l.title}</h2></div><a href="#lab/${l.id}" class="button subtle">Open lab ↗</a></div>${lessonMarkup(l)}<div class="copy-block"><pre>${escape(l.example)}</pre><button class="button" data-copy="${l.id}">Copy commands</button></div></section>`).join("")}<aside class="privacy-note">A camera is an input, not a mind reader. Facial movements do not reliably reveal internal emotions. No images are uploaded or recorded by this application.</aside>`,
    "workshop",
  );
  app
    .querySelectorAll("[data-copy]")
    .forEach(
      (b) =>
        (b.onclick = () =>
          copy(labs.find((l) => l.id === b.dataset.copy).example, b)),
    );
}
function check() {
  shell(
    `<section class="page-intro"><span class="eyebrow">BEFORE THE WORKSHOP</span><h1>Ready for your close-up?</h1><p>Test this device, this browser, and this network before the session.</p></section><div class="device-grid"><section class="panel"><h2>Camera check</h2><p>Requires HTTPS or localhost. Permission is requested only when you press the button.</p><video id="video" class="check-video" autoplay playsinline muted></video><div class="button-row"><button class="button primary" id="check-camera">Test camera / Retry</button><button class="button" id="check-stop">Stop camera</button></div><p id="camera-result" role="status">${window.isSecureContext ? "✓ Secure context" : "✕ HTTPS required"} · ${navigator.mediaDevices?.getUserMedia ? "Camera API available" : "Camera API unavailable"}</p></section><section class="panel"><h2>Model check</h2><p>Downloads and initializes each real model. Frames stay on your device. A successful load is not a webcam inference test.</p>${["object", "face", "hand"].map((k) => `<div class="model-check"><span>${{ object: "COCO-SSD", face: "Face Landmarker", hand: "Hand Landmarker" }[k]}</span><button class="button small" data-model="${k}">Load / Retry</button><p id="model-${k}" role="status">Not tested</p></div>`).join("")}</section></div><aside class="privacy-note">Recommended: current Chrome or Edge on Windows, macOS, or ChromeOS. Allow camera permission, close video-call apps, and use good lighting. Slower devices can use sample images in Object Hunter or keyboard controls in Gesture Arcade.</aside>`,
    "check",
  );
  const token = epoch;
  $("check-camera").onclick = async () => {
    if (starting) return;
    starting = true;
    const revision = ++sourceRevision;
    const b = $("check-camera");
    b.disabled = true;
    try {
      stopCamera($("video"));
      const video = $("video");
      const s = await startCamera(
        video,
        () => token === epoch && revision === sourceRevision,
      );
      if (token !== epoch || revision !== sourceRevision) {
        s.getTracks().forEach((t) => t.stop());
        return;
      }
      stream = s;
      $("camera-result").textContent = "✓ Camera connected. Preview is live.";
    } catch (e) {
      if (token === epoch && revision === sourceRevision)
        $("camera-result").textContent = cameraError(e);
    } finally {
      if (token === epoch && revision === sourceRevision) {
        starting = false;
        b.disabled = false;
      }
    }
  };
  $("check-stop").onclick = () => {
    sourceRevision++;
    starting = false;
    $("check-camera").disabled = false;
    stopCamera($("video"));
    stream = null;
    $("camera-result").textContent = "Camera stopped.";
  };
  app.querySelectorAll("[data-model]").forEach(
    (b) =>
      (b.onclick = async () => {
        b.disabled = true;
        const out = $("model-" + b.dataset.model);
        try {
          await loadModel(b.dataset.model, (s) => {
            if (token === epoch) out.textContent = s;
          });
          if (token === epoch) out.textContent = "✓ Model loaded successfully";
        } catch (e) {
          if (token === epoch) out.textContent = e.message;
        } finally {
          b.disabled = false;
        }
      }),
  );
}
function labPage(id) {
  const l = labs.find((l) => l.id === id);
  if (!l) {
    home();
    return;
  }
  active = id;
  gesture = createGesture();
  game = createGame(settings.arcade, high);
  historyIndex = histories[id].length;
  shell(
    `<div class="lab-heading"><a href="#home" class="back">← All labs</a><div><span class="eyebrow">LAB ${l.number} / ${l.tag}</span><h1>${l.fullTitle || l.title}</h1><p>${l.objective}</p></div><span class="difficulty">${l.difficulty}</span></div><div class="workspace"><section class="vision-panel panel" id="vision-panel"><div class="panel-title"><span><i class="dot" id="camera-dot"></i> LIVE INPUT</span><span id="source-label">640 × 480 · mirrored</span></div><div class="stage" id="stage"><video id="video" autoplay muted playsinline></video><canvas id="canvas" width="640" height="480" tabindex="0" aria-label="${id === "arcade" ? "Arcade game. Left and right arrow keys move the paddle." : l.title + " camera overlay"}"></canvas><div class="stage-empty" id="stage-empty"><span>${l.icon}</span><h2>Your world is the input.</h2><p>Connect your webcam to start exploring.</p><small>Local processing. No uploads.</small></div></div><div class="camera-toolbar"><button class="button" id="fullscreen" aria-pressed="false">Fullscreen</button><button class="button primary" id="start-camera">◉ Start Camera</button><button class="button" id="stop-camera" disabled>Stop Camera</button><button class="button" id="retry" hidden>Retry</button>${id === "gesture" ? '<button class="button" id="energy-toggle" aria-pressed="true">Effects: On</button>' : ""}${id === "object" ? '<button class="button" id="sample">Sample image</button><label class="button upload">Upload image<input id="upload" type="file" accept="image/*"></label>' : ""}${id === "arcade" ? '<button class="button" id="play">Start game</button><button class="button" id="pause">Pause</button>' : ""}</div><div class="tracking-status" id="status" role="status">Camera off. ${id === "arcade" ? "Keyboard and pointer controls are ready." : "Ready when you are."}</div><div class="result-panel" id="results"></div><details class="data-inspector" open><summary>Live JavaScript output</summary><p>Current results, refreshed live. Pause to inspect or copy a snapshot. null means no detection. Coordinates: boxes use 640 × 480 reference pixels; landmarks use normalized image coordinates. Face scores are smoothed; gesture and game state are derived by our code.</p><button class="button" id="freeze-output" aria-pressed="false">Pause output</button> <button class="button" id="copy-output">Copy output</button><pre id="live-output"></pre></details>${id === "gesture" ? '<div class="mini-note">Open your hand with all four fingers extended to charge an energy orb. Close into a fist to make it poof! Hold each pose briefly with your palm facing the camera. Pinch still grabs shapes. Use “show effects off” to disable effects. Distances use a 640 × 480 reference canvas.</div>' : ""}${id === "face" ? '<div class="mini-note">Visible expression estimates describe facial movement, not someone’s internal emotions.</div>' : ""}${id === "arcade" ? '<div class="mini-note">Move your index fingertip within the center guide in the camera preview to reach the whole paddle range. Keep your whole hand visible and move back if you reach the frame edge. ← → arrows or pointer also work. Gold orbs = 5 points.</div>' : ""}</section><section class="console-panel panel"><div class="panel-title"><span><i class="terminal-icon">›_</i> EXPERIMENT CONSOLE</span><span>WORKSHOP COMMANDS</span></div><details class="code-lab" open><summary>Edit JavaScript settings</summary><p>Change numeric const assignments and apply them to the demo. This editor supports numeric declarations and // comments, not arbitrary JavaScript. Reload settings to discard edits and read current values.</p><label class="sr-only" for="code-input">JavaScript settings</label><textarea id="code-input" spellcheck="false"></textarea><div class="button-row"><button class="button primary" id="apply-code">Apply code</button><button class="button" id="reload-code">Reload settings</button></div><p id="code-status" role="status"></p></details><div class="console-hint">Change a value. Run it. Watch what happens.</div><label class="sr-only" for="commands">Workshop commands</label><div class="editor"><span class="prompt">›</span><textarea id="commands" spellcheck="false" aria-describedby="console-shortcut">${l.example}</textarea></div><div class="console-actions"><button class="button primary" id="run">Run Commands <span>↵</span></button><button class="button" id="copy-example">Copy Example</button></div><small id="console-shortcut">Ctrl / ⌘ + Enter to run · Alt + ↑ / ↓ for history</small><div class="console-output" id="output" role="log" aria-live="polite"></div><div class="utility-row"><button id="help">Help</button><button id="clear-console">Clear Console</button><button id="reset">Reset Lab</button></div><details id="command-help"><summary>Available commands</summary><pre>${escape(commandReference(id).join("\n"))}</pre></details><details open><summary>Current settings</summary><div id="settings" class="settings-grid"></div></details></section></div><section class="challenge-banner"><span class="challenge-icon">✦</span><div><span class="eyebrow">YOUR MISSION</span><h2>${l.challenge}</h2><p>${l.steps}</p></div><span class="challenge-badge" id="challenge-badge">TRY IT OUT ↗</span></section><section class="learn-section"><div class="section-heading"><div><span class="eyebrow">A LITTLE LOGIC GOES A LONG WAY</span><h2>Make a prediction. Then test it.</h2></div></div>${lessonMarkup(l)}<details class="code-exercise"><summary>Level 2 · Explore the JavaScript behind the commands</summary><p>Edit a safe variable below. It updates the same live settings as your console; no arbitrary code is executed.</p><pre>${escape(l.code)}</pre><form id="exercise"><label>${l.exerciseKey.toUpperCase()} = <input type="number" id="exercise-value" value="${l.exerciseValue}" min="${ranges[l.exerciseKey][0]}" max="${ranges[l.exerciseKey][1]}" step="${l.exerciseKey.includes("threshold") || l.exerciseKey === "confidence" ? ".05" : "1"}"></label><button class="button" type="submit">Apply variable</button></form><p>Variables store values. Functions group logic. Comparisons return true or false. <code>&&</code> requires both conditions to be true.</p><p>Level 3 · Fork the repository after the workshop. ${l.advanced} See README for instructions.</p></details></section>`,
    "lab",
  );
  const workspace = document.querySelector(".workspace");
  const metrics = document.createElement("section");
  metrics.className = "metrics-panel panel";
  metrics.setAttribute("aria-label", "Live metrics and model output");
  metrics.innerHTML = '<div class="panel-title">LIVE METRICS & OUTPUT</div>';
  metrics.append($("status"), $("results"), document.querySelector(".data-inspector"));
  const currentSettings = $("settings").parentElement;
  metrics.append(currentSettings);
  workspace.insertBefore(metrics, document.querySelector(".console-panel"));
  $("fullscreen").onclick = async () => {
    const panel = $("vision-panel");
    if (document.fullscreenElement) await document.exitFullscreen();
    else if (panel.classList.contains("expanded")) panel.classList.remove("expanded");
    else {
      try {
        if (!panel.requestFullscreen) throw new Error("Unavailable");
        await panel.requestFullscreen();
      } catch {
        panel.classList.add("expanded");
      }
    }
    syncFullscreen();
  };
  $("code-input").value = starterCode(id, settings[id]);
  $("reload-code").onclick = () => {
    $("code-input").value = starterCode(id, settings[id]);
    $("code-status").textContent = "Editor reloaded from current settings.";
  };
  $("apply-code").onclick = () => {
    try {
      const commands = codeCommands($("code-input").value, id);
      run(commands);
      $("code-status").textContent = "Applied. Compare the live output with your prediction.";
    } catch (error) {
      $("code-status").textContent = error.message + " No code changes applied.";
    }
  };
  $("freeze-output").onclick = () => {
    const button = $("freeze-output");
    const paused = button.getAttribute("aria-pressed") !== "true";
    button.setAttribute("aria-pressed", String(paused));
    button.textContent = paused ? "Resume output" : "Pause output";
  };
  $("copy-output").onclick = () => copy($("live-output").textContent, $("copy-output"));
  $("start-camera").onclick = start;
  $("retry").onclick = () =>
    sample ? loadImage(sample.toDataURL("image/png")) : start();
  $("stop-camera").onclick = stop;
  if (id === "gesture")
    $("energy-toggle").onclick = () =>
      run(`show effects ${settings.gesture.effects ? "off" : "on"}`);
  $("run").onclick = () => run($("commands").value);
  $("copy-example").onclick = () => copy(l.example, $("copy-example"));
  $("help").onclick = () => {
    $("command-help").open = true;
    log(commandReference(id).join("\n"));
  };
  $("clear-console").onclick = () => {
    $("output").replaceChildren();
  };
  $("reset").onclick = () => run("reset");
  $("commands").onkeydown = (e) => {
    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      run(e.currentTarget.value);
    }
    if (e.altKey && ["ArrowUp", "ArrowDown"].includes(e.key)) {
      e.preventDefault();
      const h = histories[id];
      historyIndex = clamp(
        historyIndex + (e.key === "ArrowUp" ? -1 : 1),
        0,
        h.length,
      );
      e.currentTarget.value = h[historyIndex] || "";
    }
  };
  $("exercise").onsubmit = (e) => {
    e.preventDefault();
    run(`set ${l.exerciseKey} ${$("exercise-value").value}`);
  };
  if (id === "object") {
    $("sample").onclick = () =>
      loadImage(import.meta.env.BASE_URL + "samples/cat.jpg");
    $("upload").onchange = (e) => {
      const file = e.target.files[0];
      if (file) {
        if (file.size > 15 * 1024 * 1024) {
          log("Choose an image smaller than 15 MB.", "error");
          return;
        }
        const url = URL.createObjectURL(file);
        loadImage(url).finally(() => URL.revokeObjectURL(url));
      }
    };
  }
  if (id === "arcade") {
    $("stage-empty").hidden = true;
    $("play").onclick = () =>
      run(game.status === "over" ? "restart game" : "start game");
    $("pause").onclick = () => run("pause game");
    $("canvas").onpointermove = (e) => {
      const r = e.currentTarget.getBoundingClientRect();
      game.target = clamp(((e.clientX - r.left) / r.width) * 640, 0, 640);
    };
    $("canvas").onkeydown = (e) => {
      if (["ArrowLeft", "ArrowRight"].includes(e.key)) {
        e.preventDefault();
        game.target = clamp(
          game.target +
            (e.key === "ArrowLeft" ? -50 : 50) * settings.arcade.movement_speed,
          0,
          640,
        );
      }
    };
  }
  renderSettings();
  log("Welcome! This is a safe workshop console. Type help to explore.");
  frame = requestAnimationFrame(tick);
}
function renderSettings() {
  if (!active) return;
  if ($("energy-toggle")) {
    $("energy-toggle").textContent =
      `Effects: ${settings.gesture.effects ? "On" : "Off"}`;
    $("energy-toggle").setAttribute(
      "aria-pressed",
      String(settings.gesture.effects),
    );
  }
  $("settings").innerHTML = Object.entries(settings[active])
    .map(
      ([k, v]) =>
        `<div><code>${k}</code><span>${escape(typeof v === "boolean" ? (v ? "on" : "off") : v)}</span></div>`,
    )
    .join("");
}
function log(text, type = "success") {
  const out = $("output");
  if (!out) return;
  const line = document.createElement("div");
  line.className = "log-line " + type;
  line.textContent = (type === "error" ? "! " : "› ") + text;
  out.append(line);
  while (out.children.length > 80) out.firstChild.remove();
  out.scrollTop = out.scrollHeight;
}
function run(text) {
  if (!active) return;
  histories[active].push(text);
  if (histories[active].length > 50) histories[active].shift();
  historyIndex = histories[active].length;
  text.split("\n").forEach((line, i) => {
    try {
      const c = parseCommand(line, active);
      if (c.type === "skip") return;
      applyCommand(settings[active], c, active);
      if (c.type === "help") {
        log(commandReference(active).join("\n"));
        return;
      }
      if (c.type === "reset") {
        gesture = createGesture();
        scores = null;
        hand = null;
        if (!sample) predictions = [];
        if (active === "object") collected.clear();
        if (active === "arcade") gameAction(game, "reset", settings.arcade);
        $("challenge-badge").textContent = "TRY IT OUT ↗";
      }
      if (
        active === "gesture" &&
        c.type === "set" &&
        c.key === "effects" &&
        !c.value
      )
        resetHandEnergy(gesture.energy);
      if (c.type === "spawn")
        gesture.objects.push({
          shape: c.shape,
          x: 100 + Math.random() * 240,
          y: 100 + Math.random() * 280,
        });
      if (c.type === "clear") {
        gesture.objects = [];
        gesture.grabbed = null;
      }
      if (["start", "pause", "restart"].includes(c.type))
        gameAction(game, c.type, settings.arcade);
      if (active === "arcade" && c.type === "set" && c.key === "lives")
        game.lives = c.value;
      log(
        c.type === "set"
          ? `Success! ${c.key} updated to ${c.value}.`
          : c.type === "reset"
            ? "Lab reset to defaults."
            : `${line.trim()} — done.`,
      );
    } catch (e) {
      log(`Line ${i + 1}: ${e.message}`, "error");
    }
  });
  renderSettings();
  refreshResults();
}
async function copy(text, button) {
  try {
    await navigator.clipboard.writeText(text);
    const old = button.textContent;
    button.textContent = "Copied ✓";
    setTimeout(() => {
      if (button.isConnected) button.textContent = old;
    }, 1600);
  } catch {
    if ($("commands")) {
      $("commands").value = text;
      $("commands").focus();
      log(
        "Clipboard unavailable. Example placed in the editor; select it to copy.",
      );
    } else {
      button.textContent = "Select commands above to copy";
    }
  }
}
function status(text, error = false) {
  if (!$("status")) return;
  $("status").textContent = text;
  $("status").classList.toggle("error", error);
  $("retry").hidden = !error;
}
async function start() {
  if (starting || !active) return;
  busy = false;
  starting = true;
  const token = epoch;
  const revision = ++sourceRevision;
  const video = $("video");
  $("start-camera").disabled = true;
  status("Requesting camera access…");
  try {
    stopCamera(video);
    stream = null;
    sample = null;
    predictions = [];
    scores = null;
    hand = null;
    facePoints = null;
    const s = await startCamera(
      video,
      () => token === epoch && revision === sourceRevision,
    );
    if (token !== epoch || revision !== sourceRevision) {
      s.getTracks().forEach((t) => t.stop());
      return;
    }
    stream = s;
    $("stop-camera").disabled = false;
    $("stage-empty").hidden = true;
    $("camera-dot").classList.add("live");
    $("source-label").textContent = "640 × 480 · mirrored";
    s.getVideoTracks()[0].onended = () => {
      if (token === epoch && revision === sourceRevision) stop();
    };
    const model = await loadModel(
      active === "object" ? "object" : active === "face" ? "face" : "hand",
      (s) => {
        if (token === epoch && revision === sourceRevision) status(s);
      },
    );
    if (token !== epoch || revision !== sourceRevision) return;
    currentModel = model;
    if (!stream) return;
    lastVideo = -1;
    status("Camera live · inference is running locally");
  } catch (e) {
    if (token === epoch && revision === sourceRevision) {
      stopCamera(video);
      stream = null;
      currentModel = null;
      $("stop-camera").disabled = true;
      $("camera-dot").classList.remove("live");
      status(cameraError(e), true);
    }
  } finally {
    if (token === epoch && revision === sourceRevision) {
      starting = false;
      $("start-camera").disabled = false;
    }
  }
}
function stop() {
  busy = false;
  sourceRevision++;
  starting = false;
  $("start-camera").disabled = false;
  if ($("sample")) $("sample").disabled = false;
  stopCamera($("video"));
  stream = null;
  predictions = [];
  hand = null;
  facePoints = null;
  scores = null;
  resetHandEnergy(gesture.energy);
  gesture.cursor = null;
  gesture.pinching = false;
  gesture.grabbed = null;
  $("camera-dot").classList.remove("live");
  $("stop-camera").disabled = true;
  status("Camera stopped.");
  if (active !== "arcade" && !sample) $("stage-empty").hidden = false;
  refreshResults();
}
async function loadImage(url) {
  const token = epoch;
  stop();
  const revision = ++sourceRevision;
  starting = true;
  $("sample").disabled = true;
  status("Loading image and object detector…");
  try {
    const img = new Image();
    img.src = url;
    await img.decode();
    if (token !== epoch || revision !== sourceRevision) return;
    sample = document.createElement("canvas");
    sample.width = 640;
    sample.height = 480;
    const c = sample.getContext("2d");
    c.fillStyle = "#181b23";
    c.fillRect(0, 0, 640, 480);
    const scale = Math.min(640 / img.width, 480 / img.height);
    c.drawImage(
      img,
      (640 - img.width * scale) / 2,
      (480 - img.height * scale) / 2,
      img.width * scale,
      img.height * scale,
    );
    $("source-label").textContent = "640 × 480 · still image";
    $("stage-empty").hidden = true;
    const model = await loadModel("object");
    if (token !== epoch || revision !== sourceRevision) return;
    currentModel = model;
    const inferred = await inferSample();
    if (inferred && token === epoch && revision === sourceRevision)
      status("Real inference on a still image · camera is off");
  } catch (e) {
    if (token === epoch && revision === sourceRevision) status(e.message, true);
  } finally {
    if (token === epoch && revision === sourceRevision) {
      starting = false;
      $("sample").disabled = false;
    }
  }
}
async function inferSample() {
  if (!sample || !currentModel) return;
  const token = epoch;
  const model = currentModel;
  const input = sample;
  const revision = sourceRevision;
  try {
    const p = await model.detect(input, 40, 0.05);
    if (token === epoch && revision === sourceRevision && sample === input) {
      predictions = p;
      refreshResults();
      return true;
    }
  } catch (e) {
    if (token === epoch && revision === sourceRevision) status(e.message, true);
  }
  return false;
}
async function infer(video, now, token) {
  busy = true;
  const revision = sourceRevision;
  const startedAt = performance.now();
  try {
    const result =
      active === "object"
        ? await currentModel.detect(video, 40, 0.05)
        : await currentModel.detectForVideo(video, now);
    if (token !== epoch || revision !== sourceRevision || !stream) return;
    if (active === "object")
      predictions = referenceBoxes(result, video.videoWidth, video.videoHeight);
    else if (active === "face") {
      facePoints = result.faceLandmarks[0] || null;
      scores = smoothScores(
        scores,
        facePoints
          ? blendshapeScores(result.faceBlendshapes[0]?.categories)
          : null,
        settings.face.smoothing,
      );
    } else {
      hand = result.landmarks[0] || null;
      if (active === "gesture")
        observeHandEnergy(
          gesture.energy,
          hand,
          settings.gesture,
          performance.now(),
        );
    }
    status(
      `Camera live · inference is running locally · ${Math.round(performance.now() - startedAt)} ms/frame`,
    );
  } catch (e) {
    if (token === epoch && revision === sourceRevision) {
      stop();
      status(
        `Inference failed: ${e.message}. Retry the camera or use a fallback.`,
        true,
      );
    }
  } finally {
    // A stale result must not clear the busy state of a newer camera session.
    if (token === epoch && revision === sourceRevision) {
      busy = false;
      lastInference = performance.now();
    }
  }
}
function tick(now) {
  if (!active) return;
  const ctx = $("canvas").getContext("2d");
  const dt = Math.min((now - (lastFrame || now)) / 1000, 0.05);
  lastFrame = now;
  ctx.clearRect(0, 0, 640, 480);
  const video = $("video");
  if (sample) ctx.drawImage(sample, 0, 0);
  else if (stream && video.readyState >= 2) {
    ctx.save();
    ctx.translate(640, 0);
    ctx.scale(-1, 1);
    ctx.drawImage(video, 0, 0, 640, 480);
    ctx.restore();
  } else {
    ctx.fillStyle = "#11151d";
    ctx.fillRect(0, 0, 640, 480);
  }
  if (
    stream &&
    currentModel &&
    !busy &&
    now - lastInference > (active === "object" ? 200 : 90) &&
    video.readyState >= 2 &&
    video.currentTime !== lastVideo
  ) {
    lastInference = now;
    lastVideo = video.currentTime;
    infer(video, now, epoch);
  }
  if (active === "object")
    renderObjects(
      ctx,
      predictions,
      settings.object,
      colors[settings.object.color],
      !sample,
    );
  if (active === "face" && settings.face.landmarks)
    renderLandmarks(ctx, facePoints);
  if (active === "gesture") {
    advanceHandEnergy(gesture.energy, dt, settings.gesture, now);
    updateGesture(gesture, hand, settings.gesture);
    if (settings.gesture.landmarks) renderLandmarks(ctx, hand, true);
    renderGesture(
      ctx,
      gesture,
      settings.gesture,
      colors[settings.gesture.color],
    );
    renderHandEnergy(
      ctx,
      gesture.energy,
      settings.gesture,
      colors[settings.gesture.color],
      reducedMotion.matches,
    );
  }
  if (active === "arcade") {
    if (hand) game.target = handPaddleTarget(hand);
    updateGame(game, dt, settings.arcade);
    renderGame(ctx, game, settings.arcade);
    if (settings.arcade.landmarks) renderLandmarks(ctx, hand, true);
    if (stream && video.readyState >= 2) renderHandGuide(ctx, video, hand);
    if (game.high > high) {
      high = game.high;
      try {
        localStorage.setItem("usacs-high", String(high));
      } catch {}
    }
  }
  if (now - lastUI > 200) {
    refreshResults();
    lastUI = now;
  }
  frame = requestAnimationFrame(tick);
}
function refreshResults() {
  if (!active || !$("results")) return;
  let html = "";
  if (active === "object") {
    const found = filterObjects(predictions, settings.object);
    found.forEach((p) => collected.add(p.class));
    html = `<div class="result-heading"><strong>${found.length} objects detected</strong><span>Hunt: ${collected.size} unique classes</span></div><div class="detection-tags">${found.map((p) => `<span>${escape(p.class)} <b>${Math.round(p.score * 100)}%</b></span>`).join("") || "<small>No matching detections. Try more light or a lower threshold.</small>"}</div>`;
    if (found.some((p) => p.class === "bottle"))
      $("challenge-badge").textContent = "BOTTLE FOUND ✓";
  }
  if (active === "face") {
    const expression = classifyExpression(scores, settings.face);
    const [emoji, label] = expressions[expression];
    html = `<div class="expression"><span>${emoji}</span><div><strong>${label}</strong><small>Based on visible facial movements</small></div></div>`;
    if (settings.face.scores)
      html += `<div class="score-list">${["mouthSmileLeft", "mouthSmileRight", "jawOpen", "eyeBlinkLeft", "eyeBlinkRight", "mouthFrownLeft", "mouthFrownRight", "browInnerUp", "browOuterUpLeft", "browOuterUpRight"].map((k) => `<div><code>${k}</code><meter min="0" max="1" value="${scores?.[k] || 0}"></meter><span>${scores ? (scores[k] || 0).toFixed(2) : "—"}</span></div>`).join("")}</div>`;
  }
  if (active === "gesture") {
    html = `<div class="result-heading"><strong>${!hand ? "No hand detected." : gesture.grabbed ? "Shape grabbed · move and release" : gesture.pinching ? "Pinching" : "Hand tracked · point and pinch"}</strong><span>${gesture.objects.length} shapes · ${gesture.energy.pose === "open" ? "Energy charged" : gesture.energy.pose === "fist" ? "Fist" : "Open hand → orb · Fist → poof"}</span></div>`;
    if (gesture.completed)
      $("challenge-badge").textContent = "MISSION COMPLETE ✓";
  }
  if (active === "arcade")
    html = `<div class="result-heading"><strong>${game.status.toUpperCase()} · Score ${game.score}</strong><span>Best ${high} · ${hand ? "Hand controller" : "Keyboard / pointer controller"}</span></div>`;
  $("results").innerHTML = html;
  if ($("freeze-output").getAttribute("aria-pressed") !== "true") {
    let name, data;
    if (active === "object") {
      name = "predictions";
      data = filterObjects(predictions, settings.object);
    } else if (active === "face") {
      name = "faceResult";
      data = { landmarksDetected: facePoints?.length || 0, smoothedScores: scores, expression: classifyExpression(scores, settings.face) };
    } else if (active === "gesture") {
      name = "handResult";
      data = { landmarks: hand, pinchDistance: hand ? pinchDistance(hand) : null, pinching: gesture.pinching, pose: gesture.energy.pose };
    } else {
      name = "arcadeResult";
      data = { indexTip: hand?.[8] || null, controller: hand ? "hand" : "keyboard / pointer", targetX: game.target, paddleX: game.paddleX, score: game.score, lives: game.lives, status: game.status };
    }
    $("live-output").textContent = "const " + name + " = " + JSON.stringify(data, (key, value) => typeof value === "number" ? Math.round(value * 10000) / 10000 : value, 2) + ";";
  }
}
function route() {
  cleanup();
  const path = location.hash.slice(1);
  if (path.startsWith("lab/")) labPage(path.split("/")[1]);
  else if (path === "workshop") workshop();
  else if (path === "check") check();
  else home();
  window.scrollTo(0, 0);
}
window.addEventListener("pageshow", (event) => {
  if (event.persisted) route();
});
window.addEventListener("hashchange", route);
window.addEventListener("pagehide", cleanup);
document.addEventListener("visibilitychange", () => {
  if (document.hidden && active === "arcade")
    gameAction(game, "pause", settings.arcade);
});
route();

function syncFullscreen() {
  const button = $("fullscreen");
  if (!button) return;
  const expanded = !!document.fullscreenElement || $("vision-panel").classList.contains("expanded");
  button.textContent = expanded ? "Exit fullscreen" : "Fullscreen";
  button.setAttribute("aria-pressed", String(expanded));
}
document.addEventListener("fullscreenchange", syncFullscreen);
document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    $("vision-panel")?.classList.remove("expanded");
    syncFullscreen();
  }
});
