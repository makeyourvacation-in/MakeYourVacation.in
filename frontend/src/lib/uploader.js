import { API } from "@/lib/api";

/**
 * Cloudinary-backed image uploader (via our FastAPI backend).
 *
 * Returns an async function that:
 *   - accepts a File
 *   - POSTs it as multipart/form-data to /api/admin/upload
 *   - reports progress via onProgress callback (0..100)
 *   - resolves with the secure Cloudinary URL
 *
 * Usage (in ImageManager):
 *   const uploader = createUploader();
 *   await uploader(file, (percent) => setProgress(percent));
 */
export function createUploader() {
  return (file, onProgress) =>
    new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open("POST", `${API}/admin/upload`, true);
      xhr.withCredentials = true;

      if (onProgress) {
        xhr.upload.onprogress = (e) => {
          if (e.lengthComputable) {
            const pct = Math.round((e.loaded / e.total) * 100);
            onProgress(pct);
          }
        };
      }

      xhr.onload = () => {
        try {
          const data = JSON.parse(xhr.responseText || "{}");
          if (xhr.status >= 200 && xhr.status < 300 && data.url) {
            resolve({ url: data.url, public_id: data.public_id });
          } else {
            reject(new Error(data.detail || `Upload failed (HTTP ${xhr.status})`));
          }
        } catch (e) {
          reject(new Error(`Upload failed (HTTP ${xhr.status})`));
        }
      };
      xhr.onerror = () => reject(new Error("Network error while uploading"));
      xhr.onabort = () => reject(new Error("Upload aborted"));

      const fd = new FormData();
      fd.append("file", file);
      xhr.send(fd);
    });
}
