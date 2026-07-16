import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { api, formatApiError } from "@/lib/api";
import { toast } from "sonner";
import { Mail, Phone, MapPin, Send } from "lucide-react";

export default function Contact() {
  const [params] = useSearchParams();
  const [packages, setPackages] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    full_name: "",
    mobile: "",
    email: "",
    destination: params.get("destination") || "",
    travel_date: "",
    adults: 2,
    children: 0,
    package_name: params.get("package") || "",
    message: "",
  });

  useEffect(() => {
    (async () => {
      try {
        const { data } = await api.get("/packages");
        setPackages(data);
      } catch (e) { console.error(e); }
    })();
  }, []);

  const update = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    if (!form.full_name || !form.mobile || !form.email || !form.destination || !form.travel_date) {
      toast.error("Please fill all required fields.");
      return;
    }
    setSubmitting(true);
    try {
      const payload = {
        ...form,
        adults: parseInt(form.adults) || 1,
        children: parseInt(form.children) || 0,
      };
      const { data } = await api.post("/bookings", payload);
      toast.success(data.message || "Booking inquiry received!");
      setForm({ full_name: "", mobile: "", email: "", destination: "", travel_date: "", adults: 2, children: 0, package_name: "", message: "" });
    } catch (err) {
      toast.error(formatApiError(err.response?.data?.detail) || err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      <section className="relative pt-32 pb-20 bg-navy text-white overflow-hidden">
        <div className="absolute inset-0 opacity-25">
          <img src="https://images.pexels.com/photos/7974839/pexels-photo-7974839.jpeg" alt="" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-navy/70" />
        </div>
        <div className="relative max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 text-center">
          <div className="section-eyebrow">Reach Out</div>
          <h1 className="mt-3 text-5xl md:text-6xl font-playfair font-semibold">Let's Plan Your Journey</h1>
          <p className="mt-5 max-w-2xl mx-auto text-white/75 font-poppins">Tell us about your dream trip and our concierge will design a bespoke itinerary for you.</p>
        </div>
      </section>

      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 grid lg:grid-cols-5 gap-12">
          {/* Info */}
          <div className="lg:col-span-2 space-y-6">
            <div className="section-eyebrow">Get In Touch</div>
            <h2 className="text-3xl md:text-4xl font-playfair font-semibold text-navy leading-tight">We'd Love to Hear From You</h2>
            <p className="font-poppins text-navy/65">Whether it's a quiet honeymoon in the mountains or a family beach getaway, we're here to make it exceptional.</p>

            <div className="space-y-4 mt-8">
              {[
                { icon: Mail, label: "Email", value: "makeyourvacation.in@gmail.com", href: "mailto:makeyourvacation.in@gmail.com" },
                { icon: Phone, label: "Phone", value: "+91 7569805416", href: "tel:+917569805416" },
                { icon: MapPin, label: "Location", value: "India", href: "#" },
              ].map((c, i) => (
                <a key={i} href={c.href} data-testid={`contact-info-${c.label.toLowerCase()}`} className="flex items-center gap-4 p-5 rounded-2xl border border-navy/10 hover:border-gold transition-colors">
                  <div className="w-11 h-11 rounded-full bg-navy text-gold flex items-center justify-center"><c.icon size={18}/></div>
                  <div>
                    <div className="text-[10px] font-montserrat uppercase tracking-[0.2em] text-navy/50">{c.label}</div>
                    <div className="font-poppins text-navy font-medium">{c.value}</div>
                  </div>
                </a>
              ))}
            </div>

            <div className="mt-6 rounded-2xl overflow-hidden luxury-shadow border border-navy/10">
              <iframe
                title="Google Maps"
                src="https://www.google.com/maps/embed?pb=!1m14!1m12!1m3!1d3560000!2d78.9629!3d20.5937!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!5e0!3m2!1sen!2sin!4v1700000000000"
                width="100%" height="240" style={{ border: 0 }} loading="lazy" allowFullScreen
              />
            </div>
          </div>

          {/* Booking form */}
          <div className="lg:col-span-3">
            <form data-testid="booking-form" onSubmit={submit} className="glass rounded-2xl p-8 md:p-10 luxury-shadow space-y-5 border border-navy/10">
              <div className="section-eyebrow">Booking Inquiry</div>
              <h3 className="text-3xl font-playfair font-semibold text-navy">Tell Us Your Dream</h3>

              <div className="grid md:grid-cols-2 gap-4">
                <Field label="Full Name *"><input data-testid="booking-full-name" required value={form.full_name} onChange={update("full_name")} className={inputCls}/></Field>
                <Field label="Mobile Number *"><input data-testid="booking-mobile" required type="tel" value={form.mobile} onChange={update("mobile")} className={inputCls}/></Field>
                <Field label="Email *"><input data-testid="booking-email" required type="email" value={form.email} onChange={update("email")} className={inputCls}/></Field>
                <Field label="Destination *"><input data-testid="booking-destination" required value={form.destination} onChange={update("destination")} className={inputCls} placeholder="e.g. Kashmir, Goa"/></Field>
                <Field label="Travel Date *"><input data-testid="booking-travel-date" required type="date" value={form.travel_date} onChange={update("travel_date")} className={inputCls}/></Field>
                <Field label="Package">
                  <select data-testid="booking-package" value={form.package_name} onChange={update("package_name")} className={inputCls}>
                    <option value="">-- Optional --</option>
                    {packages.map((p) => <option key={p.id} value={p.name}>{p.name}</option>)}
                  </select>
                </Field>
                <Field label="Adults *"><input data-testid="booking-adults" required type="number" min="1" value={form.adults} onChange={update("adults")} className={inputCls}/></Field>
                <Field label="Children"><input data-testid="booking-children" type="number" min="0" value={form.children} onChange={update("children")} className={inputCls}/></Field>
              </div>
              <Field label="Message">
                <textarea data-testid="booking-message" rows={4} value={form.message} onChange={update("message")} className={inputCls} placeholder="Anything special you'd like us to know?"/>
              </Field>

              <button data-testid="booking-submit-btn" disabled={submitting} className="btn-gold w-full justify-center !py-4 disabled:opacity-60">
                {submitting ? "Sending…" : (<>Submit Inquiry <Send size={16}/></>)}
              </button>
              <p className="text-xs text-navy/50 font-poppins text-center">By submitting, you agree to be contacted by our team via email/phone.</p>
            </form>
          </div>
        </div>
      </section>
    </div>
  );
}

const inputCls = "w-full bg-white border border-navy/15 rounded-xl px-4 py-3 text-sm font-poppins text-navy placeholder:text-navy/40 focus:outline-none focus:border-gold focus:ring-1 focus:ring-gold/40 transition-colors";

function Field({ label, children }) {
  return (
    <label className="block">
      <span className="block text-[10px] font-montserrat uppercase tracking-[0.2em] text-navy/60 mb-1.5">{label}</span>
      {children}
    </label>
  );
}
