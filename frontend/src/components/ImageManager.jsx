import { useEffect, useRef, useState } from "react";
import { Trash2, Star, ChevronUp, ChevronDown, UploadCloud, GripVertical, Loader2 } from "lucide-react";
import { toast } from "sonner";

/**
 * ImageManager — direct file uploads (via backend → Cloudinary).
 *
 * Data model:
 *   `images`: string[] — ordered array of hosted image URLs. Index 0 is the cover / hero.
 *
 * Props:
 *   - value: string[]           — controlled list of image URLs
 *   - onChange: (arr) => void
 *   - uploader: (file, onProgress) => Promise<{ url, public_id }>  — REQUIRED. Wired to backend.
 *   - maxImages?: number        — hard cap, defaults to 5
 *   - testIdPrefix?: string     — prefix for data-testids
 *
 * Reorder methods available:
 *   - Native HTML5 drag & drop (grab the card and drop onto another card)
 *   - Left/Right arrows (touch/keyboard friendly)
 *   - "Set as cover" star button (promotes to index 0)
 */

const ALLOWED_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
const ALLOWED_EXT = ".jpg,.jpeg,.png,.webp";
const MAX_BYTES = 8 * 1024 * 1024;

export default function ImageManager({
  value = [],
  onChange,
  uploader,
  maxImages = 5,
  testIdPrefix = "img",
}) {
  const inputRef = useRef(null);
  const valueRef = useRef(value);
  useEffect(() => { valueRef.current = value; }, [value]);
  const [uploads, setUploads] = useState({});   // { tempId: { name, percent, error } }
  const [dragIndex, setDragIndex] = useState(null);
  const [overIndex, setOverIndex] = useState(null);

  const setImages = (arr) => onChange(arr);
  const atMax = value.length >= maxImages;
  const remaining = Math.max(0, maxImages - value.length);
  const currentlyUploading = Object.values(uploads).filter((u) => !u.done && !u.error).length;

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

  // ---------- Drag & Drop reordering ----------
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

  // ---------- File uploads ----------
  const onFilesPicked = async (files) => {
    if (!uploader) {
      toast.error("Upload is not configured. Please contact the site admin.");
      return;
    }
    let list = Array.from(files);

    // Validate types
    const valid = [];
    for (const f of list) {
      if (!ALLOWED_TYPES.includes((f.type || "").toLowerCase())) {
        toast.error(`${f.name}: unsupported type. Allowed: JPG, PNG, WEBP.`);
        continue;
      }
      if (f.size > MAX_BYTES) {
        toast.error(`${f.name}: too large. Max 8 MB per image.`);
        continue;
      }
      valid.push(f);
    }

    // Trim to remaining slots
    const slots = maxImages - value.length - currentlyUploading;
    if (slots <= 0) {
      toast.error(`Maximum ${maxImages} images per package.`);
      return;
    }
    if (valid.length > slots) {
      toast.info(`Only the first ${slots} image${slots > 1 ? "s" : ""} will be uploaded (max ${maxImages}).`);
      valid.splice(slots);
    }

    // Upload sequentially (Cloudinary is fine with parallel too, sequential is safer for progress UX)
    for (const file of valid) {
      const tempId = `${file.name}-${Date.now()}-${Math.random().toString(16).slice(2, 6)}`;
      setUploads((u) => ({ ...u, [tempId]: { name: file.name, percent: 0 } }));
      try {
        const { url } = await uploader(file, (p) =>
          setUploads((u) => (u[tempId] ? { ...u, [tempId]: { ...u[tempId], percent: p } } : u))
        );
        setUploads((u) => ({ ...u, [tempId]: { ...u[tempId], percent: 100, done: true } }));
        // Append using latest value from ref (avoids stale-closure with sequential uploads)
        const next = [...valueRef.current, url];
        valueRef.current = next;
        onChange(next);
        setTimeout(() => setUploads((u) => { const n = { ...u }; delete n[tempId]; return n; }), 800);
      } catch (err) {
        setUploads((u) => ({ ...u, [tempId]: { ...u[tempId], error: err.message } }));
        toast.error(`${file.name}: ${err.message}`);
        setTimeout(() => setUploads((u) => { const n = { ...u }; delete n[tempId]; return n; }), 4000);
      }
    }

    if (inputRef.current) inputRef.current.value = "";
  };

  return (
    <div data-testid={`${testIdPrefix}-manager`} className="space-y-4">
      {/* Header row: count */}
      <div className="flex items-center justify-between text-xs font-poppins">
        <span className="text-navy/60">
          <b className="text-navy">{value.length}</b> / {maxImages} images
          {value.length > 0 && <span className="ml-2 text-gold">· First image is the cover</span>}
        </span>
        {remaining > 0 && (
          <span className="text-navy/50">You can add {remaining} more</span>
        )}
      </div>

      {/* Upload zone */}
      <input
        ref={inputRef}
        data-testid={`${testIdPrefix}-file-input`}
        type="file"
        accept={ALLOWED_EXT}
        multiple
        className="hidden"
        onChange={(e) => e.target.files && onFilesPicked(e.target.files)}
      />
      <button
        type="button"
        data-testid={`${testIdPrefix}-upload-btn`}
        onClick={() => inputRef.current?.click()}
        disabled={atMax}
        className={`w-full flex flex-col sm:flex-row items-center justify-center gap-3 border-2 border-dashed rounded-xl py-6 text-sm font-poppins transition-colors ${
          atMax ? "border-navy/15 text-navy/40 bg-softgray/50 cursor-not-allowed" : "border-gold/60 text-navy hover:bg-gold/5 cursor-pointer"
        }`}
      >
        <UploadCloud size={22} className={atMax ? "text-navy/30" : "text-gold"} />
        <span className="text-center">
          {atMax ? (
            `Maximum ${maxImages} images reached`
          ) : (
            <>
              <span className="font-semibold">Click to upload images</span>
              <span className="hidden sm:inline text-navy/60"> · JPG · PNG · WEBP · max 8 MB each</span>
            </>
          )}
        </span>
      </button>

      {/* Upload progress list */}
      {Object.entries(uploads).length > 0 && (
        <ul data-testid={`${testIdPrefix}-progress-list`} className="space-y-2">
          {Object.entries(uploads).map(([tid, u]) => (
            <li key={tid} data-testid={`${testIdPrefix}-progress-${tid}`} className="bg-softgray rounded-xl px-4 py-2.5">
              <div className="flex items-center gap-3">
                {u.error ? (
                  <span className="text-red-500 text-xs font-montserrat uppercase">Failed</span>
                ) : u.done ? (
                  <span className="text-green-600 text-xs font-montserrat uppercase">Done</span>
                ) : (
                  <Loader2 size={14} className="text-gold animate-spin" />
                )}
                <span className="text-sm text-navy truncate flex-1 font-poppins">{u.name}</span>
                <span className="text-xs text-navy/60 font-poppins tabular-nums">{u.error ? "!" : `${u.percent}%`}</span>
              </div>
              <div className="mt-2 h-1 bg-white rounded overflow-hidden">
                <div
                  className={`h-full transition-all ${u.error ? "bg-red-400" : u.done ? "bg-green-500" : "bg-gold"}`}
                  style={{ width: `${u.percent || 0}%` }}
                />
              </div>
              {u.error && <div className="mt-1 text-[11px] text-red-500 font-poppins">{u.error}</div>}
            </li>
          ))}
        </ul>
      )}

      {/* Image list */}
      {value.length === 0 ? (
        <div data-testid={`${testIdPrefix}-empty`} className="text-center py-8 text-xs text-navy/40 font-poppins border border-dashed border-navy/15 rounded-xl">
          No images uploaded yet. The first image you add becomes the cover / hero.
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
        Drag any image to reorder · The <span className="text-gold font-semibold">first image</span> is used as the hero on package cards & the details page · Click the ★ to promote a gallery image to cover.
      </p>
    </div>
  );
}
