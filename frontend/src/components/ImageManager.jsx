import { useState } from "react";
import { Plus, Trash2, Star, ChevronUp, ChevronDown, ImagePlus, UploadCloud, GripVertical } from "lucide-react";
import { toast } from "sonner";

/**
 * ImageManager — modular image list manager with drag-and-drop reordering.
 *
 * Data model:
 *   `images`: string[] — ordered array of image URLs. Index 0 is the cover / hero.
 *
 * Props:
 *   - value: string[]        — controlled list of image URLs
 *   - onChange: (arr) => void
 *   - uploader?: (file: File) => Promise<string>  — OPTIONAL. Wire this to Cloudinary
 *     (or any object storage). When present, the "Upload from device" button becomes active.
 *     The function must upload the file and return the hosted URL.
 *   - maxImages?: number     — hard cap, defaults to 5
 *   - testIdPrefix?: string  — prefix for data-testids
 *
 * Reorder methods available:
 *   - Native HTML5 drag & drop (grab the card / handle and drop onto another card)
 *   - Up/Down arrows (touch/keyboard friendly)
 *   - "Set as cover" star button (promotes to index 0)
 *
 * Future Cloudinary integration:
 *   1. Create an unsigned upload preset in Cloudinary.
 *   2. Provide `uploader` prop that POSTs to
 *      `https://api.cloudinary.com/v1_1/<cloud_name>/image/upload`
 *      with `file` + `upload_preset`, returning `data.secure_url`.
 *   No other change is required in this file or the calling admin dashboard.
 */
export default function ImageManager({
  value = [],
  onChange,
  uploader = null,
  maxImages = 5,
  testIdPrefix = "img",
}) {
  const [url, setUrl] = useState("");
  const [uploading, setUploading] = useState(false);
  const [dragIndex, setDragIndex] = useState(null);
  const [overIndex, setOverIndex] = useState(null);

  const setImages = (arr) => onChange(arr);
  const atMax = value.length >= maxImages;
  const remaining = Math.max(0, maxImages - value.length);

  const addUrl = () => {
    if (atMax) {
      toast.error(`Maximum ${maxImages} images per package.`);
      return;
    }
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

  // ---------- Drag & Drop ----------
  const onDragStart = (idx) => (e) => {
    setDragIndex(idx);
    e.dataTransfer.effectAllowed = "move";
    try { e.dataTransfer.setData("text/plain", String(idx)); } catch (_) {}
  };
  const onDragOver = (idx) => (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    if (overIndex !== idx) setOverIndex(idx);
  };
  const onDragLeave = () => setOverIndex(null);
  const onDrop = (idx) => (e) => {
    e.preventDefault();
    const from = dragIndex ?? parseInt(e.dataTransfer.getData("text/plain"));
    setDragIndex(null);
    setOverIndex(null);
    if (from === null || Number.isNaN(from) || from === idx) return;
    const arr = [...value];
    const [item] = arr.splice(from, 1);
    arr.splice(idx, 0, item);
    setImages(arr);
  };
  const onDragEnd = () => { setDragIndex(null); setOverIndex(null); };

  // ---------- File uploads (optional) ----------
  const onUpload = async (files) => {
    if (!uploader) {
      toast.info("Direct upload will be enabled once Cloudinary is connected. For now, please paste an image URL.");
      return;
    }
    const slots = maxImages - value.length;
    if (slots <= 0) {
      toast.error(`Maximum ${maxImages} images per package.`);
      return;
    }
    const list = Array.from(files).slice(0, slots);
    if (files.length > list.length) {
      toast.info(`Only the first ${slots} image${slots > 1 ? "s" : ""} were uploaded (max ${maxImages} per package).`);
    }
    setUploading(true);
    try {
      const uploaded = [];
      for (const f of list) {
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
    <div data-testid={`${testIdPrefix}-manager`} className="space-y-4">
      {/* Header row: count + hint */}
      <div className="flex items-center justify-between text-xs font-poppins">
        <span className="text-navy/60">
          <b className="text-navy">{value.length}</b> / {maxImages} images
          {value.length > 0 && <span className="ml-2 text-gold">· First image is the cover</span>}
        </span>
        {remaining > 0 && (
          <span className="text-navy/50">You can add {remaining} more</span>
        )}
      </div>

      {/* URL input */}
      <div className="flex gap-2">
        <input
          data-testid={`${testIdPrefix}-url-input`}
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addUrl())}
          disabled={atMax}
          placeholder={atMax ? `Maximum ${maxImages} images reached` : "Paste an image URL (https://…)"}
          className="flex-1 bg-white border border-navy/15 rounded-xl px-4 py-2.5 text-sm font-poppins text-navy focus:outline-none focus:border-gold focus:ring-1 focus:ring-gold/40 disabled:bg-softgray/60 disabled:text-navy/40 disabled:cursor-not-allowed"
        />
        <button
          type="button"
          data-testid={`${testIdPrefix}-add-url-btn`}
          onClick={addUrl}
          disabled={atMax}
          className="px-4 py-2 rounded-xl bg-navy text-white text-xs font-montserrat uppercase tracking-wider flex items-center gap-2 hover:bg-navy-light transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <Plus size={14}/> Add
        </button>
      </div>

      {/* Upload placeholder (Cloudinary-ready) */}
      <label
        data-testid={`${testIdPrefix}-upload-label`}
        className={`flex items-center justify-center gap-3 border-2 border-dashed rounded-xl py-5 text-sm font-poppins transition-colors ${
          uploader && !atMax ? "border-gold/60 text-navy hover:bg-gold/5 cursor-pointer" : "border-navy/15 text-navy/50 bg-softgray/50 cursor-not-allowed"
        }`}
        title={uploader ? (atMax ? `Maximum ${maxImages} images reached` : "Upload one or more images") : "Cloudinary not connected yet — paste an image URL above."}
      >
        <input
          data-testid={`${testIdPrefix}-upload-input`}
          type="file"
          accept="image/*"
          multiple
          disabled={!uploader || uploading || atMax}
          className="hidden"
          onChange={(e) => e.target.files && onUpload(Array.from(e.target.files))}
        />
        {uploader ? <UploadCloud size={18} className="text-gold" /> : <ImagePlus size={18} />}
        <span>
          {uploading ? "Uploading…" : atMax ? `Maximum ${maxImages} images reached` : uploader ? "Click to upload images from device" : "Direct upload (Cloudinary) — coming soon. Paste URLs for now."}
        </span>
      </label>

      {/* Image list */}
      {value.length === 0 ? (
        <div data-testid={`${testIdPrefix}-empty`} className="text-center py-8 text-xs text-navy/40 font-poppins border border-dashed border-navy/15 rounded-xl">
          No images added yet. The first image becomes the cover / hero.
        </div>
      ) : (
        <ul
          className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3"
          data-testid={`${testIdPrefix}-list`}
        >
          {value.map((src, i) => {
            const isDragging = dragIndex === i;
            const isOver = overIndex === i && dragIndex !== null && dragIndex !== i;
            return (
              <li
                key={`${src}-${i}`}
                data-testid={`${testIdPrefix}-item-${i}`}
                draggable
                onDragStart={onDragStart(i)}
                onDragOver={onDragOver(i)}
                onDragLeave={onDragLeave}
                onDrop={onDrop(i)}
                onDragEnd={onDragEnd}
                className={`relative group rounded-xl overflow-hidden border transition-all ${
                  i === 0 ? "border-gold ring-2 ring-gold/30" : "border-navy/10"
                } ${isDragging ? "opacity-40 scale-95" : ""} ${isOver ? "ring-2 ring-navy scale-[1.03]" : ""} cursor-grab active:cursor-grabbing`}
              >
                <div className="aspect-[4/3] bg-softgray">
                  <img
                    src={src}
                    alt=""
                    className="w-full h-full object-cover pointer-events-none select-none"
                    loading="lazy"
                    onError={(e) => { e.currentTarget.style.opacity = 0.3; }}
                    draggable={false}
                  />
                </div>

                {/* Cover badge */}
                {i === 0 && (
                  <div className="absolute top-2 left-2 bg-gold text-navy text-[9px] font-montserrat uppercase tracking-widest font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                    <Star size={9} className="fill-current" /> Cover
                  </div>
                )}

                {/* Drag handle indicator */}
                <div className="absolute top-2 right-2 bg-white/85 text-navy/70 rounded p-1 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                  <GripVertical size={12} />
                </div>

                {/* Overlay controls */}
                <div className="absolute inset-x-0 bottom-0 p-2 flex justify-between items-center gap-1 bg-gradient-to-t from-navy/95 to-navy/0 opacity-0 group-hover:opacity-100 transition-opacity">
                  <div className="flex gap-1">
                    <button
                      type="button"
                      title="Move left"
                      data-testid={`${testIdPrefix}-up-${i}`}
                      onClick={() => move(i, -1)}
                      disabled={i === 0}
                      className="p-1 rounded bg-white/90 text-navy disabled:opacity-40"
                    >
                      <ChevronUp size={14} className="-rotate-90"/>
                    </button>
                    <button
                      type="button"
                      title="Move right"
                      data-testid={`${testIdPrefix}-down-${i}`}
                      onClick={() => move(i, 1)}
                      disabled={i === value.length - 1}
                      className="p-1 rounded bg-white/90 text-navy disabled:opacity-40"
                    >
                      <ChevronDown size={14} className="-rotate-90"/>
                    </button>
                  </div>
                  <div className="flex gap-1">
                    {i !== 0 && (
                      <button
                        type="button"
                        title="Set as cover"
                        data-testid={`${testIdPrefix}-cover-${i}`}
                        onClick={() => setCover(i)}
                        className="p-1 rounded bg-gold text-navy"
                      >
                        <Star size={14}/>
                      </button>
                    )}
                    <button
                      type="button"
                      title="Remove"
                      data-testid={`${testIdPrefix}-remove-${i}`}
                      onClick={() => remove(i)}
                      className="p-1 rounded bg-red-500 text-white"
                    >
                      <Trash2 size={14}/>
                    </button>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      <p className="text-[11px] text-navy/50 font-poppins leading-relaxed">
        Drag any image to reorder · The <span className="text-gold font-semibold">first image</span> is used as the hero on package cards & details page · Click the ★ to promote a gallery image to cover.
      </p>
    </div>
  );
}
