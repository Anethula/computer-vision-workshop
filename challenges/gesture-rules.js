// Level 3: adjust the hysteresis margin; use this in coordinates.js when ready.
export function shouldGrab(distance, threshold, alreadyGrabbing) {
  return distance < threshold * (alreadyGrabbing ? 1.3 : 1);
}
