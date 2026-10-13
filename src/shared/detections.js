// COCO boxes use intrinsic input pixels; the UI always uses a 640 × 480 reference.
export function referenceBoxes(predictions, width, height) {
  return predictions.map((p) => ({
    ...p,
    bbox: [
      (p.bbox[0] * 640) / width,
      (p.bbox[1] * 480) / height,
      (p.bbox[2] * 640) / width,
      (p.bbox[3] * 480) / height,
    ],
  }));
}
