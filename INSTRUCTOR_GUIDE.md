# Instructor guide — 90 minutes

## Before students arrive

Share GETTING_STARTED.md. Students on Mac/Windows joining the deployed website need a compatible browser, webcam, internet and camera permission; development-tool installation and cloning are unnecessary. Students editing the source locally need Node.js 22+ and optionally Git. No Python or API keys are required.

Deploy to HTTPS and open `#check` on the room projector, your laptop, and a representative student device. Initialize all models on the campus network. Test lighting, camera permission, a bottle, a smile, a pinch drag, and a full arcade round. Bring an object photo as a fallback. Share the deployed URL or a QR code on your opening slide. Students install nothing.

The website complements your PowerPoint: put one prediction and 3–5 copyable commands on each slide. Keep the site's Workshop guide open beside your slides. Explain that the website console is a small custom language; students should not paste commands into their operating-system terminal.

## Revised timing

Aim to finish the guided workshop at minute 75, leaving the final 15 minutes free for optional questions, individual help, or exploration. The schedule includes 10 minutes of debugging/catch-up before closing. Keep minute 80 as an absolute latest finish so students still have at least 10 minutes left.

| Minutes | Activity |
| --- | --- |
| 0–5 | Welcome and device check: website, camera permission, model loading. |
| 5–20 | Essential concepts: pixels, training vs inference, model outputs, confidence, landmarks. |
| 20–30 | Object Hunter: detect an object, compare thresholds, track a bottle. |
| 30–33 | Debugging and catch-up. |
| 33–42 | Expression Analyzer: inspect scores and compare smile thresholds. |
| 42–45 | Debugging and catch-up. |
| 45–59 | Gesture Controller: pinch/drag and open-hand orb/fist poof. |
| 59–63 | Debugging and catch-up. |
| 63–72 | Gesture Arcade: one short round and one difficulty change. |
| 72–75 | Recap, feedback, and closing. |
| 75–90 | Optional exploration, questions, and individual help. Guided content is finished. |

### Presentation pacing

Use about 6–8 introductory concept slides rather than a 45-minute lecture. Cover what computer vision does, pixels/video, training vs inference, the models and their outputs, confidence thresholds, and landmarks. Revisit the relevant idea during each demo. Teach smoothing, pinch/release margins, gesture state, and collision detection alongside the corresponding activity.

Each lab needs one baseline command block, one parameter experiment, and a brief checkpoint. Keep commands visible while students try them. Start model downloads during arrival whenever possible; permission and network problems can exceed the planned five-minute setup.

During catch-up, check whether students selected the correct lab, whether the camera/model loaded, and whether the console reported an error. Give students who are already ready an optional experiment rather than starting the next required activity early. If nobody needs help, continue ahead of schedule and preserve the early finish.

Protect the closing and final free time. If behind schedule, skip extra expression categories, repeated smoothing comparisons, extra shape customization, and additional arcade rounds. Keep the baseline activity in every lab and the energy demonstration. Move source-code exercises and extended challenges to the optional period or after class. Avoid debugging a single laptop in front of the whole room for more than a couple of minutes: use the documented image/arcade fallback or arrange individual help.

## Lab 1 — Object Hunter

Objective: distinguish a bounding box, class label, and confidence score.

Prediction: “What happens when we raise the confidence threshold?”

```text
track all
set confidence 0.3
set color blue
show boxes on
show labels on
```

Experiment: hold a bottle, then run `set confidence 0.9`. Compare the number of boxes. Try `track bottle` and `show labels off`. If no camera works, select Sample image (a cat) or upload a local photo; the same model performs actual inference.

Explain: the threshold filters existing predictions. It is not a percentage certainty that the model is correct. COCO-SSD recognizes a fixed set of classes; it cannot recognize arbitrary new objects. Lighting, framing, clutter, and training data affect performance.

Optional: count distinct genuinely detected classes in the scavenger counter.

## Lab 2 — Facial Expression Analyzer

Objective: relate measurable visible movement to a conditional rule.

Prediction: “Will lowering a threshold make a smile detector more sensitive?”

```text
show scores on
set smile_threshold 0.45
show landmarks on
set smoothing 5
```

Experiment: smile and return to neutral. Try smile thresholds 0.2 and 0.8. Inspect `mouthSmileLeft` and `mouthSmileRight`. Try smoothing 1 and 10. Open your mouth or raise your eyebrows to compare signals. No face means no fabricated label.

Explain: the smile rule averages left/right blendshapes and compares against a threshold. Smoothing reduces flicker but delays reactions. Several movements may occur together; rule priority chooses one description. Faces do not reliably disclose internal emotions, and a smile does not prove someone is happy.

Optional: change the smile emoji in the source after class.

## Lab 3 — Gesture Controller

Objective: map normalized coordinates and use distance plus hysteresis for a stable gesture.

Prediction: “What if the pinch threshold is much too large?”

```text
show landmarks on
set pinch_distance 40
set object_size 80
set smoothing 4
spawn square
```

Experiment: move index fingertip to a shape, pinch thumb and index, move into the green target, and release. Try pinch distances 25 and 75. Try movement speeds 0.7 and 1.5. Spawn another circle. Change size to 40 and 100.

Explain: landmarks 4 and 8 define a distance in a 640 × 480 reference. The display is mirrored to match natural hand movement. The release threshold is larger than the grab threshold so tiny changes do not cause flicker. Smoothing trades responsiveness for stability. Large objects may not fit into the target.

Energy experiment: have students face their palm to the camera, extend all four fingers, and hold briefly to charge an orb. Close into a fist to poof, then open again to recharge. Try `set energy_size 80`, `set color blue`, and `show effects off`. Explain palm-relative distances, bend angles, and confirmation across fresh frames. A fist alone must not generate repeated bursts. Pinch-and-drag remains available; effects can be disabled on slower devices. Reduced-motion preferences simplify the graphics. Include this activity within Lab 3’s 14-minute slot, keeping repeated customization trials optional.

## Lab 4 — Gesture Arcade

Objective: combine model output with a regular delta-time game loop and collisions.

Prediction: “Which changes the game more: ball speed or paddle width?”

```text
set difficulty easy
set ball_speed 4
set paddle_width 120
set lives 5
start game
```

Experiment: play with your index finger. If tracking fails, move the pointer over the game or focus the canvas and press left/right arrows. Pause and change paddle width to 60, then restart. Green orbs score 1, gold orbs score 5. Falling objects become faster and more frequent with score.

Explain: vision provides a target x-coordinate; the game loop handles interpolation, collision, score, and lives. Delta time keeps speed independent of frame rate. Difficulty presets update speed and width; commands after the preset override them. `start game` resumes; `restart game` begins a fresh run; `reset` restores defaults.

Optional: add custom bonus scoring from `challenges/arcade-rules.js` in a fork.

## Three participation levels

1. Commands: change a value and explain its effect.
2. Safe variables: open the Level 2 section, change its numeric variable, and read the associated JavaScript rule. Discuss variables, comparisons, boolean expressions, and functions. This editor never executes arbitrary JavaScript.
3. After class: fork, install organizer tooling, edit the pure challenge functions, integrate one into its named source module, add a test, and share the result.

## Wrap-up prompts

Ask each student for one prediction that was wrong, one setting they would choose for a real application, and one limitation of the model. Invite them to explain how thresholds and smoothing balance competing goals. Share the repository for optional advanced work.
