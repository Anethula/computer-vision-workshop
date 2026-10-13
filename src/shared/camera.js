export function cameraError(error) {
  return (
    {
      NotAllowedError:
        "Camera permission denied. Allow camera access in your browser’s address bar, then retry.",
      NotFoundError:
        "No camera found. Connect a webcam, or use a sample image or arcade keyboard controls.",
      NotReadableError:
        "Camera is busy. Close other camera apps or tabs, then retry.",
      OverconstrainedError:
        "Camera settings are unavailable. Try another webcam.",
    }[error.name] ||
    error.message ||
    "Unable to start camera. Please retry."
  );
}
export async function startCamera(video, isCurrent = () => true) {
  if (!window.isSecureContext)
    throw Error(
      "Camera access needs HTTPS or localhost. Open the secure workshop URL.",
    );
  if (!navigator.mediaDevices?.getUserMedia)
    throw Error(
      "Camera API unavailable. Use a current Chrome or Edge browser.",
    );
  const stream = await navigator.mediaDevices.getUserMedia({
    video: {
      width: { ideal: 640 },
      height: { ideal: 480 },
      facingMode: "user",
    },
    audio: false,
  });
  try {
    if (!isCurrent())
      throw new DOMException("Camera request cancelled", "AbortError");
    video.srcObject = stream;
    await video.play();
    return stream;
  } catch (e) {
    stream.getTracks().forEach((t) => t.stop());
    throw e;
  }
}
export function stopCamera(video) {
  video?.srcObject?.getTracks().forEach((t) => t.stop());
  if (video) video.srcObject = null;
}
