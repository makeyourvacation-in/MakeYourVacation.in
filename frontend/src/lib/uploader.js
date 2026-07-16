/**
 * Uploader stub — return null to indicate no direct upload is wired.
 *
 * When Cloudinary credentials are available, replace `createUploader()`
 * with a real implementation, for example:
 *
 *   export function createUploader() {
 *     const CLOUD_NAME = process.env.REACT_APP_CLOUDINARY_CLOUD_NAME;
 *     const PRESET = process.env.REACT_APP_CLOUDINARY_UPLOAD_PRESET;
 *     if (!CLOUD_NAME || !PRESET) return null;
 *     return async (file) => {
 *       const fd = new FormData();
 *       fd.append("file", file);
 *       fd.append("upload_preset", PRESET);
 *       const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`, {
 *         method: "POST", body: fd,
 *       });
 *       if (!res.ok) throw new Error("Upload failed");
 *       const data = await res.json();
 *       return data.secure_url;
 *     };
 *   }
 *
 * The <ImageManager /> component consumes this uploader via its `uploader` prop.
 * No other code changes are required to enable direct uploads.
 */
export function createUploader() {
  // Cloudinary not connected yet — direct upload disabled, URL-based flow used instead.
  return null;
}
