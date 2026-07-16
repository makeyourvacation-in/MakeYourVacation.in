import { useState } from "react";
import { Plus, Trash2, Star, ChevronUp, ChevronDown, ImagePlus, UploadCloud } from "lucide-react";
import { toast } from "sonner";

/**
 * ImageManager — modular image list manager.
 *
 * Data model:
 *   `images`: string[] — ordered array of image URLs. Index 0 is the cover.
 *
 * Props:
 *   - value: string[]        — controlled list of image URLs
 *   - onChange: (arr) => void
 *   - uploader?: (file: File) => Promise<string>  — OPTIONAL. Wire this to Cloudinary
 *     (or any object storage). When present, the "Upload from device" button becomes active.
 *     The function must upload the file and return the hosted URL.
 *
 * Future Cloudinary integration:
 *   1. Create an unsigned upload preset in Cloudinary.
 *   2. Provide `uploader` prop that POSTs to
 *      `https://api.cloudinary.com/v1_1/<cloud_name>/image/upload`
 *      with `file` + `upload_preset`, returning `data.secure_url`.
 *   No other change is required in this file or the calling admin dashboard.
 */
export default function ImageManager({ value = [], onChange, uploader = null, testIdPrefix = "img" }) {
  const [url, setUrl] = useState("");
  const [uploading, setUploading] = useState(false);

  const setImages = (arr) => onChange(arr);

  const addUrl = () => {
    const trimmed = url.trim();
    if (!trimmed) return;
    if (!/^https?:\/\//i.test(trimmed)) {
      toast.error("Please enter a valid http(s) URL.");
      return;
    }
    if (value.includes(trimmed)) {
      toast.info("Image already added.");
      return;
    }
    setImages([...value, trimmed]);
    setUrl("");
  };

  const remove = (idx) => setImages(value.filter((_, i) => i !== idx));
  const move = (idx, dir) => {
    const j = idx + dir;
    if (j < 0 || j >= value.length) return;
    const arr = [...value];
    [arr[idx], arr[j]] = [arr[j], arr[idx]];
    setImages(arr);
  };
  const setCover = (idx) => {
    if (idx === 0) return;
    const arr = [...value];
    const [item] = arr.splice(idx, 1);
    arr.unshift(item);
    setImages(arr);
  };

  const onUpload = async (files) => {
    if (!uploader) {
      toast.info("Direct upload will be enabled once Cloudinary is connected. For now, please paste an image URL.");
      return;
    }
    setUploading(true);
    try {
      const uploaded = [];
      for (const f of files) {
        try {
          const url = await uploader(f);
          if (url) uploaded.push(url);
        } catch (e) {
          console.error(e);
          toast.error(`Upload failed for ${f.name}`);
        }
      }
      if (uploaded.length) {
        setImages([...value, ...uploaded]);
        toast.success(`Uploaded ${uploaded.length} image${uploaded.length > 1 ? "s" : ""}`);
      }
    } finally {
      setUploading(false);
    }
  };

  return (
    <div data-testid={`${testIdPrefix}-manager`} className="space-y-3">
      {/* URL input */}
      <div className="flex gap-2">
        <input
          data-testid={`${testIdPrefix}-url-input`}
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addUrl())}
          placeholder="Paste an image URL (https://…)"
          className="flex-1 bg-white border border-navy/15 rounded-xl px-4 py-2.5 text-sm font-poppins text-navy focus:outline-none focus:border-gold focus:ring-1 focus:ring-gold/40"
        />
        <button
          type="button"
          data-testid={`${testIdPrefix}-add-url-btn`}
          onClick={addUrl}
          className="px-4 py-2 rounded-xl bg-navy text-white text-xs font-montserrat uppercase tracking-wider flex items-center gap-2 hover:bg-navy-light transition-colors"
        >
          <Plus size={14}/> Add URL
        </button>
      </div>

      {/* Upload placeholder (Cloudinary-ready) */}
      <label
        data-testid={`${testIdPrefix}-upload-label`}
        className={`flex items-center justify-center gap-3 border-2 border-dashed rounded-xl py-5 text-sm font-poppins transition-colors ${
          uploader ? "border-gold/60 text-navy hover:bg-gold/5 cursor-pointer" : "border-navy/15 text-navy/50 bg-softgray/50 cursor-not-allowed"
        }`}
        title={uploader ? "Upload one or more images" : "Cloudinary not connected yet — paste an image URL above."}
      >
        <input
          data-testid={`${testIdPrefix}-upload-input`}
          type="file"
          accept="image/*"
          multiple
          disabled={!uploader || uploading}
          className="hidden"
          onChange={(e) => e.target.files && onUpload(Array.from(e.target.files))}
        />
        {uploader ? <UploadCloud size={18} className="text-gold" /> : <ImagePlus size={18} />}
        <span>
          {uploading ? "Uploading…" : uploader ? "Click to upload images from device" : "Direct upload (Cloudinary) — coming soon. Paste URLs for now."}
        </span>
      </label>

      {/* Image list */}
      {value.length === 0 ? (
        <div data-testid={`${testIdPrefix}-empty`} className="text-center py-6 text-xs text-navy/40 font-poppins border border-navy/10 rounded-xl">
          No images added yet. The first image will be the cover.
        </div>
      ) : (
        <ul className="grid grid-cols-2 md:grid-cols-3 gap-3" data-testid={`${testIdPrefix}-list`}>
          {value.map((src, i) => (
            <li key={`${src}-${i}`} data-testid={`${testIdPrefix}-item-${i}`} className={`relative group rounded-xl overflow-hidden border ${i === 0 ? "border-gold ring-2 ring-gold/30" : "border-navy/10"}`}>
              <div className="aspect-[4/3] bg-softgray">
                <img src={src} alt="" className="w-full h-full object-cover" loading="lazy" onError={(e) => { e.currentTarget.style.opacity = 0.3; }} />
              </div>
              {i === 0 && (
                <div className="absolute top-2 left-2 bg-gold text-navy text-[9px] font-montserrat uppercase tracking-widest font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                  <Star size={9} className="fill-current" /> Cover
                </div>
              )}
              <div className="absolute inset-x-0 bottom-0 p-2 flex justify-between items-center gap-1 bg-gradient-to-t from-navy/95 to-navy/0 opacity-0 group-hover:opacity-100 transition-opacity">
                <div className="flex gap-1">
                  <button type="button" title="Move up" data-testid={`${testIdPrefix}-up-${i}`} onClick={() => move(i, -1)} disabled={i === 0} className="p-1 rounded bg-white/90 text-navy disabled:opacity-40"><ChevronUp size={14}/></button>
                  <button type="button" title="Move down" data-testid={`${testIdPrefix}-down-${i}`} onClick={() => move(i, 1)} disabled={i === value.length - 1} className="p-1 rounded bg-white/90 text-navy disabled:opacity-40"><ChevronDown size={14}/></button>
                </div>
                <div className="flex gap-1">
                  {i !== 0 && <button type="button" title="Set as cover" data-testid={`${testIdPrefix}-cover-${i}`} onClick={() => setCover(i)} className="p-1 rounded bg-gold text-navy"><Star size={14}/></button>}
                  <button type="button" title="Remove" data-testid={`${testIdPrefix}-remove-${i}`} onClick={() => remove(i)} className="p-1 rounded bg-red-500 text-white"><Trash2 size={14}/></button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}

      <p className="text-[11px] text-navy/50 font-poppins">
        Tip: the first image is used as the cover on package cards and hero banner. Drag order via the arrow controls; click the star to promote an image to cover.
      </p>
    </div>
  );
}
