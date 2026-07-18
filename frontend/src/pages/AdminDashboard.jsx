import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/lib/auth";
import { api, API, formatApiError } from "@/lib/api";
import { toast } from "sonner";
import { Plus, Edit3, Trash2, Star, LogOut, X, Save, ExternalLink, Search, Download, Mail, Phone, Copy, MailCheck } from "lucide-react";
import ImageManager from "@/components/ImageManager";
import { LogoMark } from "@/components/Logo";
import useDocumentTitle from "@/hooks/useDocumentTitle";
import { createUploader } from "@/lib/uploader";

const STATUSES = ["All", "New", "Contacted", "Confirmed", "Cancelled", "Completed"];
const STATUS_COLORS = {
  New: "bg-blue-50 text-blue-700 border-blue-200",
  Contacted: "bg-amber-50 text-amber-700 border-amber-200",
  Confirmed: "bg-green-50 text-green-700 border-green-200",
  Cancelled: "bg-red-50 text-red-700 border-red-200",
  Completed: "bg-navy/5 text-navy border-navy/20",
};

const EMPTY = {
  name: "",
  destination: "",
  duration: "5 Days / 4 Nights",
  price: 19999,
  hero_image: "",
  gallery: [],
  short_description: "",
  highlights: [],
  itinerary: [{ day: 1, title: "", description: "" }],
  inclusions: [],
  exclusions: [],
  hotel_details: "",
  meals: "",
  transportation: "",
  faqs: [],
  featured: false,
};

const uploader = createUploader(); // null until Cloudinary is wired

export default function AdminDashboard() {
  useDocumentTitle("MakeYourVacation.in | Admin Dashboard");
  const { admin, checking, logout } = useAuth();
  const nav = useNavigate();
  const [packages, setPackages] = useState([]);
  const [editing, setEditing] = useState(null);
  const [tab, setTab] = useState("packages");
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  // booking filters
  const [statusFilter, setStatusFilter] = useState("All");
  const [q, setQ] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  useEffect(() => {
    if (!checking && !admin) nav("/admin/login");
  }, [admin, checking, nav]);

  const loadPackages = async () => {
    try {
      const { data } = await api.get("/packages");
      setPackages(data);
    } catch (e) { console.error(e); }
  };

  const loadBookings = async () => {
    try {
      const params = {};
      if (statusFilter && statusFilter !== "All") params.status = statusFilter;
      if (q) params.q = q;
      if (fromDate) params.from = fromDate;
      if (toDate) params.to = toDate;
      const { data } = await api.get("/admin/bookings", { params });
      setBookings(data);
    } catch (e) { console.error(e); }
  };

  useEffect(() => {
    if (!admin) return;
    (async () => {
      setLoading(true);
      await Promise.all([loadPackages(), loadBookings()]);
      setLoading(false);
    })();
     // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [admin]);

  // reload bookings on filter change (debounced by short delay)
  useEffect(() => {
    if (!admin) return;
    const t = setTimeout(loadBookings, 200);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter, q, fromDate, toDate]);

  const stats = useMemo(() => {
    const s = { total: bookings.length };
    STATUSES.filter((x) => x !== "All").forEach((k) => { s[k] = bookings.filter((b) => b.status === k).length; });
    return s;
  }, [bookings]);

  const del = async (id) => {
    if (!window.confirm("Delete this package permanently?")) return;
    try {
      await api.delete(`/admin/packages/${id}`);
      toast.success("Package deleted");
      loadPackages();
    } catch (err) { toast.error(formatApiError(err.response?.data?.detail)); }
  };

  const changeStatus = async (id, next) => {
    try {
      await api.patch(`/admin/bookings/${id}`, { status: next });
      toast.success(`Marked as ${next}`);
      loadBookings();
    } catch (err) { toast.error(formatApiError(err.response?.data?.detail)); }
  };

  const exportCsv = () => {
    // trigger download via full URL (browser handles cookie)
    const url = `${API}/admin/bookings/export.csv`;
    window.open(url, "_blank");
  };

  const doLogout = async () => { await logout(); nav("/admin/login"); };
  const copyRef = (r) => { navigator.clipboard.writeText(r); toast.success("Reference copied"); };
  const sendTestEmail = async () => {
    const t = toast.loading("Sending test email…");
    try {
      const { data } = await api.post("/admin/test-email", {});
      toast.success(data.message || "Test email sent", { id: t });
    } catch (err) {
      toast.error(formatApiError(err.response?.data?.detail) || err.message, { id: t });
    }
  };

  if (checking || !admin) return null;

  return (
    <div className="min-h-screen bg-softgray">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-12 py-8 md:py-10">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
          <div className="flex items-center gap-4">
            <LogoMark size={52} />
            <div>
              <div className="section-eyebrow">Admin Dashboard</div>
              <h1 className="mt-2 text-2xl md:text-3xl font-playfair font-semibold text-navy">Welcome, {admin.username}</h1>
            </div>
          </div>
          <div className="flex flex-wrap gap-3">
            <button data-testid="admin-test-email-btn" onClick={sendTestEmail} className="border border-navy/15 rounded-full px-4 py-2.5 text-xs font-montserrat uppercase tracking-wider flex items-center gap-2 hover:border-gold hover:text-gold transition-colors">
              <MailCheck size={14}/> Test Email
            </button>
            <button data-testid="admin-new-package-btn" onClick={() => setEditing({ ...EMPTY })} className="btn-gold !py-3 !px-5 text-xs"><Plus size={14}/> New Package</button>
            <button data-testid="admin-logout-btn" onClick={doLogout} className="btn-navy !py-3 !px-5 text-xs"><LogOut size={14}/> Logout</button>
          </div>
        </div>

        <div className="border-b border-navy/10 flex gap-6 mb-8">
          {[["packages", `Packages (${packages.length})`], ["bookings", `Bookings (${bookings.length})`]].map(([k, label]) => (
            <button key={k} data-testid={`admin-tab-${k}`} onClick={() => setTab(k)} className={`py-3 font-montserrat text-xs uppercase tracking-[0.2em] border-b-2 -mb-px transition-colors ${tab === k ? "border-gold text-navy" : "border-transparent text-navy/50 hover:text-navy"}`}>{label}</button>
          ))}
        </div>

        {tab === "packages" && (
          loading ? <div className="text-center py-16 font-poppins text-navy/50">Loading…</div> :
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {packages.map((p) => (
              <div key={p.id} data-testid={`admin-package-${p.id}`} className="bg-white rounded-2xl overflow-hidden luxury-shadow">
                <div className="relative aspect-[16/10] overflow-hidden">
                  <img src={p.hero_image} alt={p.name} className="w-full h-full object-cover" />
                  {p.featured && <div className="absolute top-3 left-3 bg-gold text-navy text-[10px] font-montserrat uppercase tracking-[0.2em] font-semibold px-3 py-1 rounded-full flex items-center gap-1"><Star size={10} className="fill-current"/> Featured</div>}
                  {p.gallery?.length > 0 && <div className="absolute bottom-3 right-3 bg-navy/70 text-white text-[10px] font-montserrat px-2 py-1 rounded-full">{1 + p.gallery.length} images</div>}
                </div>
                <div className="p-5">
                  <div className="text-xs text-gold font-montserrat uppercase tracking-[0.18em]">{p.destination}</div>
                  <h3 className="mt-1 font-playfair text-xl text-navy">{p.name}</h3>
                  <div className="mt-2 text-sm text-navy/60 font-poppins">{p.duration} · ₹{p.price.toLocaleString('en-IN')}</div>
                  <div className="mt-4 flex gap-2">
                    <button data-testid={`admin-edit-${p.id}`} onClick={() => setEditing(p)} className="flex-1 flex items-center justify-center gap-2 border border-navy/15 rounded-full py-2 text-xs font-montserrat uppercase tracking-wider hover:border-gold hover:text-gold transition-colors"><Edit3 size={12}/> Edit</button>
                    <button data-testid={`admin-delete-${p.id}`} onClick={() => del(p.id)} className="flex items-center justify-center gap-1 border border-red-200 text-red-600 rounded-full py-2 px-3 text-xs hover:bg-red-50 transition-colors"><Trash2 size={12}/></button>
                    <a href={`/packages/${p.id}`} target="_blank" rel="noreferrer" className="flex items-center justify-center border border-navy/15 rounded-full py-2 px-3 text-xs hover:border-navy transition-colors"><ExternalLink size={12}/></a>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {tab === "bookings" && (
          <div className="space-y-6">
            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
              <StatBox label="Total" value={stats.total} onClick={() => setStatusFilter("All")} active={statusFilter === "All"} />
              {STATUSES.filter((s) => s !== "All").map((s) => (
                <StatBox key={s} label={s} value={stats[s] || 0} onClick={() => setStatusFilter(s)} active={statusFilter === s} />
              ))}
            </div>

            {/* Filters */}
            <div className="bg-white rounded-2xl luxury-shadow p-4 flex flex-wrap gap-3 items-center">
              <div className="flex-1 min-w-[220px] relative">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-navy/40" />
                <input data-testid="admin-bookings-search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search reference, name, email, destination…" className="w-full pl-9 pr-3 py-2 rounded-full border border-navy/15 text-sm font-poppins focus:outline-none focus:border-gold" />
              </div>
              <label className="text-xs font-montserrat uppercase tracking-wider text-navy/60 flex items-center gap-2">From
                <input data-testid="admin-bookings-from" type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} className="border border-navy/15 rounded-full px-3 py-1.5 text-xs" />
              </label>
              <label className="text-xs font-montserrat uppercase tracking-wider text-navy/60 flex items-center gap-2">To
                <input data-testid="admin-bookings-to" type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} className="border border-navy/15 rounded-full px-3 py-1.5 text-xs" />
              </label>
              <button data-testid="admin-bookings-clear" onClick={() => { setQ(""); setFromDate(""); setToDate(""); setStatusFilter("All"); }} className="text-xs font-montserrat uppercase tracking-wider text-navy/60 hover:text-navy px-3">Clear</button>
              <button data-testid="admin-bookings-export-csv" onClick={exportCsv} className="btn-navy !py-2 !px-4 text-xs"><Download size={12}/> Export CSV</button>
            </div>

            {/* Table */}
            <div className="bg-white rounded-2xl luxury-shadow overflow-hidden">
              {bookings.length === 0 ? (
                <div className="p-10 text-center text-navy/50 font-poppins" data-testid="admin-bookings-empty">No bookings match your filters.</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm font-poppins">
                    <thead className="bg-softgray text-navy/60 text-[10px] font-montserrat uppercase tracking-wider">
                      <tr>
                        <th className="text-left p-4">Reference</th>
                        <th className="text-left p-4">Customer</th>
                        <th className="text-left p-4">Trip</th>
                        <th className="text-left p-4">Travel Date</th>
                        <th className="text-left p-4">Pax</th>
                        <th className="text-left p-4">Status</th>
                        <th className="text-left p-4">Email</th>
                      </tr>
                    </thead>
                    <tbody>
                      {bookings.map((b) => (
                        <tr key={b.id} data-testid={`admin-booking-${b.id}`} className="border-t border-navy/5 hover:bg-softgray/50 align-top">
                          <td className="p-4">
                            <button onClick={() => copyRef(b.reference)} className="flex items-center gap-1.5 text-navy font-semibold text-xs font-montserrat hover:text-gold transition-colors">
                              {b.reference || "—"} <Copy size={11} className="opacity-40"/>
                            </button>
                            <div className="text-[10px] text-navy/40 mt-1">{b.created_at ? new Date(b.created_at).toLocaleString() : ""}</div>
                          </td>
                          <td className="p-4">
                            <div className="text-navy font-medium">{b.full_name}</div>
                            <a href={`mailto:${b.email}`} className="text-xs text-navy/60 hover:text-gold flex items-center gap-1 mt-0.5"><Mail size={10}/> {b.email}</a>
                            <a href={`tel:${b.mobile}`} className="text-xs text-navy/60 hover:text-gold flex items-center gap-1"><Phone size={10}/> {b.mobile}</a>
                          </td>
                          <td className="p-4">
                            <div className="text-navy">{b.destination}</div>
                            <div className="text-xs text-navy/50">{b.package_name || "—"}</div>
                          </td>
                          <td className="p-4 text-navy/80 whitespace-nowrap">{b.travel_date}</td>
                          <td className="p-4 text-navy/70 whitespace-nowrap">{b.adults}A · {b.children || 0}C</td>
                          <td className="p-4">
                            <select
                              data-testid={`admin-booking-status-${b.id}`}
                              value={b.status || "New"}
                              onChange={(e) => changeStatus(b.id, e.target.value)}
                              className={`text-xs font-montserrat font-semibold px-2.5 py-1.5 rounded-full border cursor-pointer focus:outline-none ${STATUS_COLORS[b.status || "New"]}`}
                            >
                              {STATUSES.filter((s) => s !== "All").map((s) => <option key={s} value={s}>{s}</option>)}
                            </select>
                          </td>
                          <td className="p-4 text-xs">
                            <div className={b.admin_email_sent ? "text-green-600" : "text-red-500"}>Admin: {b.admin_email_sent ? "✓" : "✕"}</div>
                            <div className={b.customer_email_sent ? "text-green-600" : "text-red-500"}>Guest: {b.customer_email_sent ? "✓" : "✕"}</div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {editing && <EditModal pkg={editing} onClose={() => setEditing(null)} onSaved={() => { setEditing(null); loadPackages(); }} />}
    </div>
  );
}

function StatBox({ label, value, onClick, active }) {
  return (
    <button
      data-testid={`admin-stat-${label.toLowerCase()}`}
      onClick={onClick}
      className={`rounded-2xl p-4 text-left transition-all ${active ? "bg-navy text-white shadow-lg" : "bg-white hover:shadow-md"}`}
    >
      <div className={`text-[10px] font-montserrat uppercase tracking-[0.18em] ${active ? "text-gold" : "text-navy/50"}`}>{label}</div>
      <div className={`text-3xl font-playfair font-semibold mt-1 ${active ? "text-white" : "text-navy"}`}>{value}</div>
    </button>
  );
}

function EditModal({ pkg, onClose, onSaved }) {
  const isNew = !pkg.id;
  // combine hero_image + gallery into single ordered images[] for the manager
  const initialImages = pkg.hero_image ? [pkg.hero_image, ...(pkg.gallery || []).filter((g) => g !== pkg.hero_image)] : [];
  const [form, setForm] = useState({ ...pkg, images: initialImages });
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});

  const set = (k, v) => {
    setForm((f) => ({ ...f, [k]: v }));
    if (errors[k]) setErrors((prev) => { const n = { ...prev }; delete n[k]; return n; });
  };
  const asList = (str) => str.split("\n").map((s) => s.trim()).filter(Boolean);

  const validate = () => {
    const e = {};
    if (!form.name?.trim()) e.name = "Name is required";
    if (!form.destination?.trim()) e.destination = "Destination is required";
    if (!form.duration?.trim()) e.duration = "Duration is required";
    if (form.price === "" || form.price === null || isNaN(parseFloat(form.price)) || parseFloat(form.price) < 0) e.price = "Enter a valid price";
    if (!form.images || form.images.length === 0) e.images = "Add at least one image (max 5)";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const save = async () => {
    if (!validate()) {
      toast.error("Please fix the highlighted fields");
      return;
    }
    setSaving(true);
    try {
      const [cover, ...rest] = form.images;
      const payload = {
        name: form.name.trim(),
        destination: form.destination.trim(),
        duration: form.duration.trim(),
        price: parseFloat(form.price) || 0,
        hero_image: cover,
        gallery: rest,
        short_description: form.short_description || "",
        highlights: Array.isArray(form.highlights) ? form.highlights : asList(form.highlights || ""),
        inclusions: Array.isArray(form.inclusions) ? form.inclusions : asList(form.inclusions || ""),
        exclusions: Array.isArray(form.exclusions) ? form.exclusions : asList(form.exclusions || ""),
        hotel_details: form.hotel_details || "",
        meals: form.meals || "",
        transportation: form.transportation || "",
        itinerary: (form.itinerary || []).filter((d) => d.title || d.description),
        faqs: (form.faqs || []).filter((f) => f.question),
        featured: !!form.featured,
        seo_title: form.seo_title || "",
        seo_description: form.seo_description || "",
      };
      if (isNew) {
        await api.post("/admin/packages", payload);
        toast.success("Package created successfully");
      } else {
        await api.put(`/admin/packages/${pkg.id}`, payload);
        toast.success("Package updated successfully");
      }
      onSaved();
    } catch (err) {
      toast.error(formatApiError(err.response?.data?.detail));
    } finally { setSaving(false); }
  };

  const listVal = (arr) => (Array.isArray(arr) ? arr.join("\n") : arr || "");
  const inputCls = "w-full bg-white border border-navy/15 rounded-xl px-4 py-2.5 text-sm font-poppins text-navy focus:outline-none focus:border-gold focus:ring-1 focus:ring-gold/40 transition-colors";
  const inputErr = "!border-red-400 focus:!border-red-500 focus:!ring-red-100";

  return (
    <div
      className="fixed inset-0 z-[70] bg-navy/70 backdrop-blur-sm overflow-y-auto overscroll-contain"
      data-testid="admin-edit-modal"
      onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="min-h-full py-6 md:py-10 px-3 md:px-6 flex justify-center">
        <div className="bg-white rounded-2xl w-full max-w-5xl luxury-shadow h-fit overflow-hidden">
          {/* Sticky mini-header inside card */}
          <div className="sticky top-0 z-10 bg-white/95 backdrop-blur border-b border-navy/10 px-6 md:px-10 py-4 flex items-center justify-between">
            <div>
              <div className="section-eyebrow">{isNew ? "New" : "Edit"} Package</div>
              <h2 className="text-xl md:text-2xl font-playfair font-semibold text-navy mt-1">
                {isNew ? "Create a new travel package" : pkg.name}
              </h2>
            </div>
            <button
              data-testid="admin-modal-close"
              onClick={onClose}
              className="w-10 h-10 rounded-full border border-navy/15 flex items-center justify-center text-navy/60 hover:text-navy hover:border-navy transition-colors"
              aria-label="Close"
            >
              <X size={18}/>
            </button>
          </div>

          <div className="px-6 md:px-10 py-8 space-y-10">
            {/* 1. Basic Information */}
            <Section title="Basic Information" subtitle="Essential details about this package.">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <F label="Package Name *" error={errors.name}>
                  <input data-testid="edit-name" value={form.name} onChange={(e) => set("name", e.target.value)} className={`${inputCls} ${errors.name ? inputErr : ""}`} placeholder="Enchanting Kashmir"/>
                </F>
                <F label="Destination *" error={errors.destination}>
                  <input data-testid="edit-destination" value={form.destination} onChange={(e) => set("destination", e.target.value)} className={`${inputCls} ${errors.destination ? inputErr : ""}`} placeholder="Kashmir"/>
                </F>
                <F label="Duration *" error={errors.duration}>
                  <input data-testid="edit-duration" value={form.duration} onChange={(e) => set("duration", e.target.value)} className={`${inputCls} ${errors.duration ? inputErr : ""}`} placeholder="6 Days / 5 Nights"/>
                </F>
                <label className="flex items-center gap-3 cursor-pointer self-end pb-2" data-testid="edit-featured-label">
                  <input data-testid="edit-featured" type="checkbox" checked={!!form.featured} onChange={(e) => set("featured", e.target.checked)} className="w-4 h-4 accent-gold" />
                  <span className="text-sm font-poppins text-navy">Mark as <b className="text-gold">Featured</b> (shows on homepage)</span>
                </label>
                <F label="Short Description" full>
                  <textarea data-testid="edit-short-desc" rows={3} value={form.short_description || ""} onChange={(e) => set("short_description", e.target.value)} className={inputCls} placeholder="A one- or two-sentence teaser shown on cards and the top of the details page."/>
                </F>
              </div>
            </Section>

            {/* 2. Images */}
            <Section
              title="Images"
              subtitle="Up to 5 images per package. Drag to reorder — the first image becomes the cover / hero."
              error={errors.images}
            >
              <ImageManager
                value={form.images || []}
                onChange={(arr) => set("images", arr)}
                uploader={uploader}
                maxImages={5}
                testIdPrefix="pkg-img"
              />
            </Section>

            {/* 3. Pricing */}
            <Section title="Pricing" subtitle="Starting price shown on cards and the details sidebar.">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <F label="Starting Price (₹) *" error={errors.price}>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-navy/50 font-poppins text-sm">₹</span>
                    <input data-testid="edit-price" type="number" min="0" step="1" value={form.price} onChange={(e) => set("price", e.target.value)} className={`${inputCls} pl-9 ${errors.price ? inputErr : ""}`} placeholder="19999"/>
                  </div>
                  <p className="text-[11px] text-navy/50 font-poppins mt-1">Per person on twin sharing.</p>
                </F>
              </div>
            </Section>

            {/* 4. Itinerary */}
            <Section title="Itinerary" subtitle="Day-by-day plan for the traveller.">
              <div className="space-y-2">
                {(form.itinerary || []).map((d, i) => (
                  <div key={i} className="grid grid-cols-1 md:grid-cols-12 gap-2">
                    <input type="number" min="1" value={d.day} onChange={(e) => { const it = [...form.itinerary]; it[i] = { ...it[i], day: parseInt(e.target.value) || i+1 }; set("itinerary", it); }} className={`${inputCls} md:col-span-1`} placeholder="Day"/>
                    <input placeholder="Title" value={d.title} onChange={(e) => { const it = [...form.itinerary]; it[i] = { ...it[i], title: e.target.value }; set("itinerary", it); }} className={`${inputCls} md:col-span-4`} />
                    <input placeholder="Description" value={d.description} onChange={(e) => { const it = [...form.itinerary]; it[i] = { ...it[i], description: e.target.value }; set("itinerary", it); }} className={`${inputCls} md:col-span-6`} />
                    <button type="button" onClick={() => set("itinerary", form.itinerary.filter((_, j) => j !== i))} className="md:col-span-1 flex items-center justify-center rounded-xl border border-red-100 text-red-500 hover:bg-red-50 py-2.5" title="Remove day"><Trash2 size={16}/></button>
                  </div>
                ))}
              </div>
              <button
                type="button"
                data-testid="edit-add-day"
                onClick={() => set("itinerary", [...(form.itinerary || []), { day: (form.itinerary?.length || 0) + 1, title: "", description: "" }])}
                className="mt-3 text-xs text-gold font-montserrat uppercase tracking-wider flex items-center gap-1 hover:text-gold-dark"
              >
                <Plus size={12}/> Add Day
              </button>
            </Section>

            {/* 5. Highlights */}
            <Section title="Highlights" subtitle="Bullet-style key attractions. One highlight per line.">
              <F>
                <textarea data-testid="edit-highlights" rows={5} value={listVal(form.highlights)} onChange={(e) => set("highlights", asList(e.target.value))} className={inputCls} placeholder={"Deluxe Houseboat Stay\nGulmarg Gondola Ride\nSonamarg Excursion"}/>
              </F>
            </Section>

            {/* 6. Inclusions */}
            <Section title="Inclusions" subtitle="What is included in the package. One item per line.">
              <F>
                <textarea data-testid="edit-inclusions" rows={5} value={listVal(form.inclusions)} onChange={(e) => set("inclusions", asList(e.target.value))} className={inputCls} placeholder={"Premium hotel accommodation\nDaily breakfast & dinner\nPrivate A/C transport"}/>
              </F>
            </Section>

            {/* 7. Exclusions */}
            <Section title="Exclusions" subtitle="What is not included. One item per line.">
              <F>
                <textarea data-testid="edit-exclusions" rows={5} value={listVal(form.exclusions)} onChange={(e) => set("exclusions", asList(e.target.value))} className={inputCls} placeholder={"Airfare / train fare\nPersonal expenses\nTravel insurance"}/>
              </F>
            </Section>

            {/* 8. Hotel & Logistics */}
            <Section title="Hotel & Logistics" subtitle="Accommodation, meals and transportation details.">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <F label="Hotel Details" full>
                  <textarea data-testid="edit-hotel" rows={3} value={form.hotel_details || ""} onChange={(e) => set("hotel_details", e.target.value)} className={inputCls}/>
                </F>
                <F label="Meals">
                  <input data-testid="edit-meals" value={form.meals || ""} onChange={(e) => set("meals", e.target.value)} className={inputCls}/>
                </F>
                <F label="Transportation">
                  <input data-testid="edit-transport" value={form.transportation || ""} onChange={(e) => set("transportation", e.target.value)} className={inputCls}/>
                </F>
              </div>
            </Section>

            {/* 9. FAQs */}
            <Section title="FAQs" subtitle="Common questions travellers ask about this package.">
              <div className="space-y-2">
                {(form.faqs || []).map((f, i) => (
                  <div key={i} className="grid grid-cols-1 md:grid-cols-12 gap-2">
                    <input placeholder="Question" value={f.question} onChange={(e) => { const fs = [...form.faqs]; fs[i] = { ...fs[i], question: e.target.value }; set("faqs", fs); }} className={`${inputCls} md:col-span-5`} />
                    <input placeholder="Answer" value={f.answer} onChange={(e) => { const fs = [...form.faqs]; fs[i] = { ...fs[i], answer: e.target.value }; set("faqs", fs); }} className={`${inputCls} md:col-span-6`} />
                    <button type="button" onClick={() => set("faqs", form.faqs.filter((_, j) => j !== i))} className="md:col-span-1 flex items-center justify-center rounded-xl border border-red-100 text-red-500 hover:bg-red-50 py-2.5" title="Remove FAQ"><Trash2 size={16}/></button>
                  </div>
                ))}
              </div>
              <button
                type="button"
                data-testid="edit-add-faq"
                onClick={() => set("faqs", [...(form.faqs || []), { question: "", answer: "" }])}
                className="mt-3 text-xs text-gold font-montserrat uppercase tracking-wider flex items-center gap-1 hover:text-gold-dark"
              >
                <Plus size={12}/> Add FAQ
              </button>
            </Section>

            {/* 10. SEO (optional) */}
            <Section title="SEO (Optional)" subtitle="Custom title and description used by search engines and social share previews.">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <F label="Meta Title" full>
                  <input data-testid="edit-seo-title" value={form.seo_title || ""} onChange={(e) => set("seo_title", e.target.value)} className={inputCls} placeholder="Luxury Kashmir Tour Package — 6 Days / 5 Nights"/>
                  <p className="text-[11px] text-navy/50 font-poppins mt-1">{(form.seo_title || "").length} / 60 recommended</p>
                </F>
                <F label="Meta Description" full>
                  <textarea data-testid="edit-seo-desc" rows={3} value={form.seo_description || ""} onChange={(e) => set("seo_description", e.target.value)} className={inputCls} placeholder="Short summary shown in Google results and link previews."/>
                  <p className="text-[11px] text-navy/50 font-poppins mt-1">{(form.seo_description || "").length} / 160 recommended</p>
                </F>
              </div>
            </Section>
          </div>

          {/* Sticky footer actions */}
          <div className="sticky bottom-0 z-10 bg-white/95 backdrop-blur border-t border-navy/10 px-6 md:px-10 py-4 flex flex-col md:flex-row items-center justify-between gap-3">
            <div className="text-xs font-poppins text-navy/50">
              {isNew ? "New package will be published immediately." : "Changes are visible on the site as soon as you save."}
            </div>
            <div className="flex gap-3 w-full md:w-auto">
              <button
                type="button"
                onClick={onClose}
                disabled={saving}
                className="flex-1 md:flex-none px-6 py-2.5 rounded-full border border-navy/15 text-navy text-xs font-montserrat uppercase tracking-wider hover:border-navy transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                data-testid="admin-save-btn"
                onClick={save}
                disabled={saving}
                className="btn-gold !py-3 !px-6 text-xs disabled:opacity-60 flex-1 md:flex-none justify-center"
              >
                {saving ? (
                  <>
                    <span className="w-4 h-4 rounded-full border-2 border-navy border-t-transparent animate-spin" />
                    Saving…
                  </>
                ) : (
                  <><Save size={14}/> {isNew ? "Create Package" : "Save Changes"}</>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Section({ title, subtitle, error, children }) {
  return (
    <section className="scroll-mt-24">
      <div className="border-l-2 border-gold pl-4 mb-5">
        <h3 className="font-playfair text-xl md:text-2xl text-navy font-semibold">{title}</h3>
        {subtitle && <p className="text-xs md:text-sm text-navy/55 font-poppins mt-1">{subtitle}</p>}
        {error && <p className="text-xs text-red-500 font-poppins mt-1.5" data-testid="section-error">{error}</p>}
      </div>
      {children}
    </section>
  );
}

function F({ label, children, full, error }) {
  return (
    <label className={`block ${full ? "md:col-span-2" : ""}`}>
      {label && <span className="block text-[10px] font-montserrat uppercase tracking-[0.2em] text-navy/60 mb-1.5">{label}</span>}
      {children}
      {error && <span className="block text-[11px] text-red-500 font-poppins mt-1">{error}</span>}
    </label>
  );
}
