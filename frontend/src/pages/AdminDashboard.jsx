import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/lib/auth";
import { api, formatApiError } from "@/lib/api";
import { toast } from "sonner";
import { Plus, Edit3, Trash2, Star, LogOut, Package as PackageIcon, X, Save, ExternalLink } from "lucide-react";

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

export default function AdminDashboard() {
  const { admin, checking, logout } = useAuth();
  const nav = useNavigate();
  const [packages, setPackages] = useState([]);
  const [editing, setEditing] = useState(null); // package object or "new"
  const [tab, setTab] = useState("packages");
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!checking && !admin) nav("/admin/login");
  }, [admin, checking, nav]);

  const load = async () => {
    setLoading(true);
    try {
      const [pkgs, bks] = await Promise.all([
        api.get("/packages"),
        api.get("/admin/bookings").catch(() => ({ data: [] })),
      ]);
      setPackages(pkgs.data);
      setBookings(bks.data);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };
  useEffect(() => { if (admin) load(); }, [admin]);

  const del = async (id) => {
    if (!window.confirm("Delete this package permanently?")) return;
    try {
      await api.delete(`/admin/packages/${id}`);
      toast.success("Package deleted");
      load();
    } catch (err) { toast.error(formatApiError(err.response?.data?.detail)); }
  };

  const doLogout = async () => { await logout(); nav("/admin/login"); };

  if (checking || !admin) return null;

  return (
    <div className="min-h-screen bg-softgray pt-24">
      <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 py-10">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
          <div>
            <div className="section-eyebrow">Admin Dashboard</div>
            <h1 className="mt-2 text-3xl md:text-4xl font-playfair font-semibold text-navy">Welcome, {admin.username}</h1>
          </div>
          <div className="flex gap-3">
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
          <div className="bg-white rounded-2xl luxury-shadow overflow-hidden">
            {bookings.length === 0 ? <div className="p-10 text-center text-navy/50 font-poppins" data-testid="admin-bookings-empty">No bookings yet.</div> :
              <table className="w-full text-sm font-poppins">
                <thead className="bg-softgray text-navy/60 text-xs font-montserrat uppercase tracking-wider">
                  <tr>
                    <th className="text-left p-4">Name</th><th className="text-left p-4">Destination</th><th className="text-left p-4">Date</th><th className="text-left p-4">Contact</th><th className="text-left p-4">Pax</th><th className="text-left p-4">Email Sent</th>
                  </tr>
                </thead>
                <tbody>
                  {bookings.map((b) => (
                    <tr key={b.id} data-testid={`admin-booking-${b.id}`} className="border-t border-navy/5 hover:bg-softgray/50">
                      <td className="p-4 text-navy font-medium">{b.full_name}</td>
                      <td className="p-4 text-navy/70">{b.destination}<div className="text-xs text-navy/40">{b.package_name || ""}</div></td>
                      <td className="p-4 text-navy/70">{b.travel_date}</td>
                      <td className="p-4 text-navy/70">{b.email}<div className="text-xs text-navy/40">{b.mobile}</div></td>
                      <td className="p-4 text-navy/70">{b.adults}A · {b.children}C</td>
                      <td className="p-4">{b.email_sent ? <span className="text-green-600 text-xs">✓ Sent</span> : <span className="text-red-500 text-xs">Failed</span>}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            }
          </div>
        )}
      </div>

      {editing && <EditModal pkg={editing} onClose={() => setEditing(null)} onSaved={() => { setEditing(null); load(); }} />}
    </div>
  );
}

function EditModal({ pkg, onClose, onSaved }) {
  const isNew = !pkg.id;
  const [form, setForm] = useState({ ...pkg });
  const [saving, setSaving] = useState(false);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));
  const asList = (str) => str.split("\n").map((s) => s.trim()).filter(Boolean);

  const save = async () => {
    if (!form.name || !form.destination || !form.hero_image) {
      toast.error("Name, destination and hero image are required");
      return;
    }
    setSaving(true);
    try {
      const payload = {
        ...form,
        price: parseFloat(form.price) || 0,
        highlights: Array.isArray(form.highlights) ? form.highlights : asList(form.highlights || ""),
        inclusions: Array.isArray(form.inclusions) ? form.inclusions : asList(form.inclusions || ""),
        exclusions: Array.isArray(form.exclusions) ? form.exclusions : asList(form.exclusions || ""),
        gallery: Array.isArray(form.gallery) ? form.gallery : asList(form.gallery || ""),
        itinerary: (form.itinerary || []).filter((d) => d.title || d.description),
        faqs: (form.faqs || []).filter((f) => f.question),
      };
      if (isNew) {
        await api.post("/admin/packages", payload);
        toast.success("Package created");
      } else {
        await api.put(`/admin/packages/${pkg.id}`, payload);
        toast.success("Package updated");
      }
      onSaved();
    } catch (err) {
      toast.error(formatApiError(err.response?.data?.detail));
    } finally { setSaving(false); }
  };

  const listVal = (arr) => (Array.isArray(arr) ? arr.join("\n") : arr || "");
  const inputCls = "w-full bg-white border border-navy/15 rounded-xl px-4 py-2.5 text-sm font-poppins text-navy focus:outline-none focus:border-gold focus:ring-1 focus:ring-gold/40";

  return (
    <div className="fixed inset-0 z-[70] bg-navy/70 backdrop-blur-sm flex items-start md:items-center justify-center p-4 overflow-y-auto" data-testid="admin-edit-modal">
      <div className="bg-white rounded-2xl w-full max-w-4xl my-8 p-8 luxury-shadow">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-playfair font-semibold text-navy">{isNew ? "New Package" : `Edit: ${pkg.name}`}</h2>
          <button data-testid="admin-modal-close" onClick={onClose} className="text-navy/60 hover:text-navy"><X size={20}/></button>
        </div>

        <div className="grid md:grid-cols-2 gap-5">
          <F label="Name *"><input data-testid="edit-name" value={form.name} onChange={(e) => set("name", e.target.value)} className={inputCls}/></F>
          <F label="Destination *"><input data-testid="edit-destination" value={form.destination} onChange={(e) => set("destination", e.target.value)} className={inputCls}/></F>
          <F label="Duration"><input data-testid="edit-duration" value={form.duration} onChange={(e) => set("duration", e.target.value)} className={inputCls} placeholder="5 Days / 4 Nights"/></F>
          <F label="Starting Price (₹)"><input data-testid="edit-price" type="number" value={form.price} onChange={(e) => set("price", e.target.value)} className={inputCls}/></F>
          <F label="Hero Image URL *" full><input data-testid="edit-hero-image" value={form.hero_image} onChange={(e) => set("hero_image", e.target.value)} className={inputCls}/></F>
          <F label="Short Description" full><textarea data-testid="edit-short-desc" rows={2} value={form.short_description} onChange={(e) => set("short_description", e.target.value)} className={inputCls}/></F>
          <F label="Highlights (one per line)"><textarea data-testid="edit-highlights" rows={4} value={listVal(form.highlights)} onChange={(e) => set("highlights", asList(e.target.value))} className={inputCls}/></F>
          <F label="Gallery Image URLs (one per line)"><textarea data-testid="edit-gallery" rows={4} value={listVal(form.gallery)} onChange={(e) => set("gallery", asList(e.target.value))} className={inputCls}/></F>
          <F label="Inclusions (one per line)"><textarea data-testid="edit-inclusions" rows={4} value={listVal(form.inclusions)} onChange={(e) => set("inclusions", asList(e.target.value))} className={inputCls}/></F>
          <F label="Exclusions (one per line)"><textarea data-testid="edit-exclusions" rows={4} value={listVal(form.exclusions)} onChange={(e) => set("exclusions", asList(e.target.value))} className={inputCls}/></F>
          <F label="Hotel Details" full><textarea data-testid="edit-hotel" rows={2} value={form.hotel_details} onChange={(e) => set("hotel_details", e.target.value)} className={inputCls}/></F>
          <F label="Meals"><input data-testid="edit-meals" value={form.meals} onChange={(e) => set("meals", e.target.value)} className={inputCls}/></F>
          <F label="Transportation"><input data-testid="edit-transport" value={form.transportation} onChange={(e) => set("transportation", e.target.value)} className={inputCls}/></F>
        </div>

        <div className="mt-6">
          <div className="text-[10px] font-montserrat uppercase tracking-[0.2em] text-navy/60 mb-2">Itinerary</div>
          {(form.itinerary || []).map((d, i) => (
            <div key={i} className="grid grid-cols-12 gap-2 mb-2">
              <input type="number" value={d.day} onChange={(e) => { const it = [...form.itinerary]; it[i] = { ...it[i], day: parseInt(e.target.value) || i+1 }; set("itinerary", it); }} className={`${inputCls} col-span-1`} />
              <input placeholder="Title" value={d.title} onChange={(e) => { const it = [...form.itinerary]; it[i] = { ...it[i], title: e.target.value }; set("itinerary", it); }} className={`${inputCls} col-span-4`} />
              <input placeholder="Description" value={d.description} onChange={(e) => { const it = [...form.itinerary]; it[i] = { ...it[i], description: e.target.value }; set("itinerary", it); }} className={`${inputCls} col-span-6`} />
              <button onClick={() => set("itinerary", form.itinerary.filter((_, j) => j !== i))} className="col-span-1 text-red-500 hover:text-red-700"><Trash2 size={16}/></button>
            </div>
          ))}
          <button data-testid="edit-add-day" onClick={() => set("itinerary", [...(form.itinerary || []), { day: (form.itinerary?.length || 0) + 1, title: "", description: "" }])} className="text-xs text-gold font-montserrat uppercase tracking-wider">+ Add Day</button>
        </div>

        <div className="mt-6">
          <div className="text-[10px] font-montserrat uppercase tracking-[0.2em] text-navy/60 mb-2">FAQs</div>
          {(form.faqs || []).map((f, i) => (
            <div key={i} className="grid grid-cols-12 gap-2 mb-2">
              <input placeholder="Question" value={f.question} onChange={(e) => { const fs = [...form.faqs]; fs[i] = { ...fs[i], question: e.target.value }; set("faqs", fs); }} className={`${inputCls} col-span-5`} />
              <input placeholder="Answer" value={f.answer} onChange={(e) => { const fs = [...form.faqs]; fs[i] = { ...fs[i], answer: e.target.value }; set("faqs", fs); }} className={`${inputCls} col-span-6`} />
              <button onClick={() => set("faqs", form.faqs.filter((_, j) => j !== i))} className="col-span-1 text-red-500"><Trash2 size={16}/></button>
            </div>
          ))}
          <button data-testid="edit-add-faq" onClick={() => set("faqs", [...(form.faqs || []), { question: "", answer: "" }])} className="text-xs text-gold font-montserrat uppercase tracking-wider">+ Add FAQ</button>
        </div>

        <label className="mt-6 flex items-center gap-3 cursor-pointer" data-testid="edit-featured-label">
          <input data-testid="edit-featured" type="checkbox" checked={!!form.featured} onChange={(e) => set("featured", e.target.checked)} className="w-4 h-4 accent-gold" />
          <span className="text-sm font-poppins text-navy">Mark as Featured (shows on homepage)</span>
        </label>

        {form.hero_image && (
          <div className="mt-6">
            <div className="text-[10px] font-montserrat uppercase tracking-[0.2em] text-navy/60 mb-2">Preview</div>
            <img src={form.hero_image} alt="Preview" className="w-full h-48 object-cover rounded-xl" />
          </div>
        )}

        <div className="mt-8 flex justify-end gap-3">
          <button onClick={onClose} className="px-6 py-2.5 rounded-full border border-navy/15 text-navy text-sm font-montserrat uppercase tracking-wider">Cancel</button>
          <button data-testid="admin-save-btn" onClick={save} disabled={saving} className="btn-gold !py-3 !px-6 text-xs disabled:opacity-60">{saving ? "Saving…" : (<><Save size={14}/> Save Package</>)}</button>
        </div>
      </div>
    </div>
  );
}

function F({ label, children, full }) {
  return (
    <label className={`block ${full ? "md:col-span-2" : ""}`}>
      <span className="block text-[10px] font-montserrat uppercase tracking-[0.2em] text-navy/60 mb-1.5">{label}</span>
      {children}
    </label>
  );
}
