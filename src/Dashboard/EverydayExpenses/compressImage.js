const MAX_SIDE = 1600;
const QUALITY = 0.8;
const SKIP_UNDER_BYTES = 300 * 1024;

/**
 * Shrinks a phone photo before upload (saves mobile data and S3 space). PDFs, small images and
 * formats the browser cannot decode (for example HEIC) are returned unchanged.
 */
export const compressImage = async (file) => {
  const type = file.type;
  if (!["image/jpeg", "image/png", "image/webp"].includes(type) || file.size <= SKIP_UNDER_BYTES) return file;
  try {
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(1, MAX_SIDE / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(bitmap.width * scale);
    canvas.height = Math.round(bitmap.height * scale);
    const ctx = canvas.getContext("2d");
    ctx.fillStyle = "#fff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    bitmap.close?.();
    const blob = await new Promise((resolve) => canvas.toBlob(resolve, "image/jpeg", QUALITY));
    if (!blob || blob.size >= file.size) return file;
    return new File([blob], file.name.replace(/\.[^.]+$/, "") + ".jpg", { type: "image/jpeg" });
  } catch {
    return file;
  }
};
