import imageCompression from "browser-image-compression";

/**
 * Compress an image file before sending to OCR.
 * Targets ~1MP which is plenty for Tesseract to read text clearly.
 */
export async function compressForOcr(file: File): Promise<File> {
  return imageCompression(file, {
    maxSizeMB: 1.5,
    maxWidthOrHeight: 1600,
    useWebWorker: true,
    fileType: "image/jpeg",
  });
}

/** Convert a File to a base64 data URL (for storing in session state) */
export function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
