# Your vision playground cheatsheet

**New to this?** See GETTING_STARTED.md. On Mac or Windows, joining the deployed workshop requires only Chrome/Edge, a webcam, internet, and camera permission. No cloning, installs, account, or terminal is needed.

Open the workshop URL in Chrome or Edge. Visit Device check. Select a lab, click Start Camera, and allow access. Your images stay on your device.

Paste into the website's console, then click Run Commands (Ctrl/⌘+Enter). Change one thing at a time. Use `help`, `reset`, and Alt+Up/Down for command history. Each command is a separate line. These are workshop commands, not system terminal commands.

## Object Hunter

```text
set confidence 0.5
set color blue
show boxes on
show labels off
track bottle
track all
```

Mission: recognize your bottle. A higher confidence threshold shows fewer uncertain predictions. Sample image and local upload work without a camera. The model can only detect its 80 supported COCO classes.

## Facial Expression Analyzer

```text
set smile_threshold 0.45
set surprise_threshold 0.5
set blink_threshold 0.6
show landmarks on
show scores on
set smoothing 5
```

Mission: compare smile thresholds 0.2 and 0.8. Raw blendshape values measure visible facial movements, not feelings. Smoothing reduces flicker but can miss brief movements.

## Gesture Controller

```text
set pinch_distance 40
set object_size 80
set movement_speed 1.2
set smoothing 4
set color purple
show effects on
set energy_size 55
spawn circle
spawn square
clear objects
```

Bonus: extend all four fingers with your palm facing the camera to charge an energy orb; close your fist to make it poof. Hold each pose briefly. Open again to recharge. Use the Effects button or `show effects off` to disable animations. Energy size is 20–100; color follows `set color`.

Mission: move a shape into the green target using a pinch. Index tip controls the cursor. Pinch thumb/index to grab; release to drop. Distances and sizes use a fixed 640 × 480 canvas, scaled to your screen.

## Gesture Arcade

```text
set difficulty easy
set ball_speed 4
set lives 5
set paddle_width 120
set movement_speed 1.0
start game
pause game
restart game
```

Mission: invent your own difficulty. Catch green orbs for 1 point or gold for 5. Use your index finger, pointer, or focus the game and press ← →. Start resumes; restart resets your run. Difficulty presets update speed and paddle width, so put custom overrides afterward.

## Remember

`reset` restores the lab. `show` accepts `on` or `off`. Colors: green, red, blue, purple, orange, white, yellow. Smoothing: integer 1–20. Better light and a steady camera help. Stop Camera turns off the stream; leaving a lab does too.

Level 2 lets you safely edit a variable in the lab page. Level 3 lets you fork the repository after the workshop and extend functions in `challenges/`. Make a prediction, experiment, then explain what changed.
