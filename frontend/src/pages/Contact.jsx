import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { api, formatApiError } from "@/lib/api";
import { toast } from "sonner";
import { Mail, Phone, MapPin, Send, CalendarIcon, Check } from "lucide-react";
import { format } from "date-fns";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

export default function Contact() {
  const [params] = useSearchParams();
  const [packages, setPackages] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [dateOpen, setDateOpen] = useState(false);
  const [successRef, setSuccessRef] = useState(null);
  const [form, setForm] = useState({
    full_name: "",
    mobile: "",
    email: "",
    destination: params.get("destination") || "",
    travel_date: null,
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
      toast.error("Please fill all required fields, including your travel date.");
      return;
    }
    setSubmitting(true);
    try {
      const payload = {
        ...form,
        travel_date: format(form.travel_date, "yyyy-MM-dd"),
        adults: parseInt(form.adults) || 1,
        children: parseInt(form.children) || 0,
      };
      const { data } = await api.post("/bookings", payload);
      setSuccessRef(data.reference);
      toast.success(data.message || "Booking inquiry received!");
      setForm({ full_name: "", mobile: "", email: "", destination: "", travel_date: null, adults: 2, children: 0, package_name: "", message: "" });
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
                { icon: Phone, label: "Phone / WhatsApp", value: "+91 7569508416", href: "tel:+917569508416" },
                { icon: MapPin, label: "Location", value: "India", href: "#" },
              ].map((c, i) => (
                <a key={i} href={c.href} data-testid={`contact-info-${c.label.toLowerCase().replace(/[^a-z]+/g, '-')}`} className="flex items-center gap-4 p-5 rounded-2xl border border-navy/10 hover:border-gold transition-colors">
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
            {successRef ? (
              <div data-testid="booking-success-card" className="glass rounded-2xl p-10 luxury-shadow border border-gold/30 text-center">
                <div className="w-16 h-16 rounded-full bg-gold/15 text-gold flex items-center justify-center mx-auto"><Check size={32} strokeWidth={2.5}/></div>
                <h3 className="mt-6 text-3xl font-playfair font-semibold text-navy">Inquiry Received</h3>
                <p className="mt-3 font-poppins text-navy/70">Our concierge will reach out within 24 hours to craft your bespoke itinerary.</p>
                <div className="mt-6 inline-block bg-navy text-gold px-6 py-3 rounded-full">
                  <div className="text-[10px] font-montserrat uppercase tracking-[0.2em]">Your Reference</div>
                  <div className="text-lg font-playfair font-semibold" data-testid="booking-reference-display">{successRef}</div>
                </div>
                <p className="mt-4 text-sm font-poppins text-navy/60">A confirmation email has been sent to your inbox.</p>
                <button data-testid="booking-new-btn" onClick={() => setSuccessRef(null)} className="btn-outline-gold !text-navy !border-navy hover:!bg-navy hover:!text-white mt-6">Submit Another Inquiry</button>
              </div>
            ) : (
              <form data-testid="booking-form" onSubmit={submit} className="glass rounded-2xl p-8 md:p-10 luxury-shadow space-y-5 border border-navy/10">
                <div className="section-eyebrow">Booking Inquiry</div>
                <h3 className="text-3xl font-playfair font-semibold text-navy">Tell Us Your Dream</h3>

                <div className="grid md:grid-cols-2 gap-4">
                  <Field label="Full Name *"><input data-testid="booking-full-name" required value={form.full_name} onChange={update("full_name")} className={inputCls}/></Field>
                  <Field label="Mobile Number *"><input data-testid="booking-mobile" required type="tel" value={form.mobile} onChange={update("mobile")} className={inputCls}/></Field>
                  <Field label="Email *"><input data-testid="booking-email" required type="email" value={form.email} onChange={update("email")} className={inputCls}/></Field>
                  <Field label="Destination *"><input data-testid="booking-destination" required value={form.destination} onChange={update("destination")} className={inputCls} placeholder="e.g. Kashmir, Goa"/></Field>

                  <Field label="Travel Date *">
                    <Popover open={dateOpen} onOpenChange={setDateOpen}>
                      <PopoverTrigger asChild>
                        <button
                          type="button"
                          data-testid="booking-travel-date-trigger"
                          className={`${inputCls} text-left flex items-center justify-between ${!form.travel_date ? "text-navy/40" : ""}`}
                        >
                          <span>{form.travel_date ? format(form.travel_date, "PPP") : "Select your travel date"}</span>
                          <CalendarIcon size={16} className="text-gold" />
                        </button>
                      </PopoverTrigger>
                      <PopoverContent align="start" className="w-auto p-0" data-testid="booking-travel-date-popover">
                        <Calendar
                          mode="single"
                          selected={form.travel_date}
                          onSelect={(d) => { setForm({ ...form, travel_date: d }); setDateOpen(false); }}
                          disabled={(d) => d < new Date(new Date().toDateString())}
                          initialFocus
                          classNames={{
                            day_selected: "bg-navy text-gold hover:bg-navy hover:text-gold focus:bg-navy focus:text-gold",
                            day_today: "bg-gold/20 text-navy font-semibold",
                          }}
                        />
                      </PopoverContent>
                    </Popover>
                  </Field>

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
            )}
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
