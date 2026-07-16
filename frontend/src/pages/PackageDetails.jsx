import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { api } from "@/lib/api";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Check, X, Clock, MapPin, Bed, Utensils, Car, ArrowRight, Star } from "lucide-react";

export default function PackageDetails() {
  const { id } = useParams();
  const [pkg, setPkg] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("itinerary");

  useEffect(() => {
    (async () => {
      try {
        const { data } = await api.get(`/packages/${id}`);
        setPkg(data);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  if (loading) return <div className="min-h-screen flex items-center justify-center pt-24 font-poppins text-navy/60">Loading…</div>;
  if (!pkg) return <div className="min-h-screen flex flex-col items-center justify-center pt-24 gap-4"><p className="font-playfair text-2xl text-navy">Package not found</p><Link to="/packages" className="btn-gold">Browse Packages</Link></div>;

  const tabs = [
    { key: "itinerary", label: "Itinerary" },
    { key: "inclusions", label: "Inclusions" },
    { key: "hotel", label: "Hotel & Meals" },
    { key: "faq", label: "FAQ" },
  ];

  return (
    <div>
      {/* Hero */}
      <section data-testid="package-hero" className="relative h-[80vh] w-full overflow-hidden">
        <img src={pkg.hero_image} alt={pkg.name} className="absolute inset-0 w-full h-full object-cover" />
        <div className="absolute inset-0 hero-overlay" />
        <div className="relative z-10 h-full flex flex-col justify-end max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 pb-16">
          <div className="section-eyebrow !text-gold mb-4 flex items-center gap-2"><MapPin size={14}/> {pkg.destination}</div>
          <h1 className="text-white text-5xl md:text-7xl font-playfair font-semibold leading-tight max-w-4xl">{pkg.name}</h1>
          <div className="mt-6 flex flex-wrap gap-4 items-center text-white/85 font-poppins">
            <span className="glass px-4 py-1.5 rounded-full text-sm text-navy flex items-center gap-1.5"><Clock size={14}/> {pkg.duration}</span>
            <span className="glass px-4 py-1.5 rounded-full text-sm text-navy flex items-center gap-1"><Star size={14} className="fill-gold text-gold"/> Premium Experience</span>
          </div>
        </div>
      </section>

      {/* Overview + Book */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 grid lg:grid-cols-3 gap-12">
          <div className="lg:col-span-2">
            <div className="section-eyebrow">Overview</div>
            <p className="mt-4 text-lg font-poppins text-navy/75 leading-relaxed">{pkg.short_description}</p>

            {pkg.highlights?.length > 0 && (
              <div className="mt-10">
                <div className="section-eyebrow">Highlights</div>
                <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {pkg.highlights.map((h, i) => (
                    <div key={i} className="flex items-start gap-3">
                      <div className="w-6 h-6 rounded-full bg-gold/15 flex items-center justify-center flex-shrink-0"><Check size={14} className="text-gold" /></div>
                      <span className="font-poppins text-navy/80">{h}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Tabs */}
            <div className="mt-14 border-b border-navy/10 flex flex-wrap gap-6">
              {tabs.map((t) => (
                <button
                  key={t.key}
                  data-testid={`tab-${t.key}`}
                  onClick={() => setTab(t.key)}
                  className={`py-3 font-montserrat text-xs uppercase tracking-[0.2em] border-b-2 -mb-px transition-colors ${
                    tab === t.key ? "border-gold text-navy" : "border-transparent text-navy/50 hover:text-navy"
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>

            <div className="mt-8">
              {tab === "itinerary" && (
                <div className="space-y-4">
                  {pkg.itinerary.map((d) => (
                    <div key={d.day} data-testid={`itinerary-day-${d.day}`} className="flex gap-5">
                      <div className="flex flex-col items-center">
                        <div className="w-12 h-12 rounded-full bg-navy text-gold flex items-center justify-center font-playfair text-lg">{d.day}</div>
                        <div className="flex-1 w-px bg-navy/10 mt-2" />
                      </div>
                      <div className="pb-6 flex-1">
                        <div className="text-[10px] font-montserrat uppercase tracking-[0.2em] text-gold">Day {d.day}</div>
                        <h4 className="text-xl font-playfair font-semibold text-navy mt-1">{d.title}</h4>
                        <p className="mt-2 font-poppins text-sm text-navy/65">{d.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {tab === "inclusions" && (
                <div className="grid md:grid-cols-2 gap-8">
                  <div>
                    <h4 className="font-playfair text-xl text-navy mb-4">What's Included</h4>
                    <ul className="space-y-2">
                      {pkg.inclusions.map((x, i) => (
                        <li key={i} className="flex items-start gap-2 font-poppins text-sm text-navy/80"><Check size={16} className="text-gold mt-0.5" /> {x}</li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-playfair text-xl text-navy mb-4">What's Not Included</h4>
                    <ul className="space-y-2">
                      {pkg.exclusions.map((x, i) => (
                        <li key={i} className="flex items-start gap-2 font-poppins text-sm text-navy/60"><X size={16} className="text-navy/40 mt-0.5" /> {x}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}

              {tab === "hotel" && (
                <div className="space-y-6">
                  <div className="flex gap-4"><div className="w-10 h-10 rounded-full bg-gold/15 text-gold flex items-center justify-center flex-shrink-0"><Bed size={18}/></div><div><h4 className="font-playfair text-lg text-navy">Hotel Details</h4><p className="mt-1 text-sm font-poppins text-navy/70">{pkg.hotel_details}</p></div></div>
                  <div className="flex gap-4"><div className="w-10 h-10 rounded-full bg-gold/15 text-gold flex items-center justify-center flex-shrink-0"><Utensils size={18}/></div><div><h4 className="font-playfair text-lg text-navy">Meals</h4><p className="mt-1 text-sm font-poppins text-navy/70">{pkg.meals}</p></div></div>
                  <div className="flex gap-4"><div className="w-10 h-10 rounded-full bg-gold/15 text-gold flex items-center justify-center flex-shrink-0"><Car size={18}/></div><div><h4 className="font-playfair text-lg text-navy">Transportation</h4><p className="mt-1 text-sm font-poppins text-navy/70">{pkg.transportation}</p></div></div>
                </div>
              )}

              {tab === "faq" && (
                <Accordion type="single" collapsible className="w-full">
                  {pkg.faqs.map((f, i) => (
                    <AccordionItem key={i} value={`f${i}`} data-testid={`faq-item-${i}`}>
                      <AccordionTrigger className="font-playfair text-navy text-lg text-left">{f.question}</AccordionTrigger>
                      <AccordionContent className="font-poppins text-navy/70">{f.answer}</AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              )}
            </div>

            {pkg.gallery?.length > 0 && (
              <div className="mt-16">
                <div className="section-eyebrow">Gallery</div>
                <div className="mt-4 grid grid-cols-2 md:grid-cols-3 gap-4">
                  {pkg.gallery.map((g, i) => (
                    <div key={i} className="aspect-square rounded-2xl overflow-hidden zoom-hover">
                      <img src={g} alt="" className="w-full h-full object-cover" loading="lazy" />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Booking sidebar */}
          <aside className="lg:sticky lg:top-28 h-fit">
            <div className="glass rounded-2xl p-8 luxury-shadow border border-gold/20">
              <div className="text-[10px] font-montserrat uppercase tracking-[0.2em] text-navy/50">Starting from</div>
              <div className="text-4xl font-playfair font-semibold text-navy mt-1">₹{pkg.price.toLocaleString('en-IN')}</div>
              <div className="text-xs text-navy/50 font-poppins">per person on twin sharing</div>

              <Link to={`/contact?package=${encodeURIComponent(pkg.name)}&destination=${encodeURIComponent(pkg.destination)}`} data-testid="package-book-now-btn" className="btn-gold w-full justify-center mt-6">Book Now <ArrowRight size={16}/></Link>
              <a href="https://wa.me/917569508416" target="_blank" rel="noopener noreferrer" data-testid="package-whatsapp-btn" className="btn-navy w-full justify-center mt-3">Chat on WhatsApp</a>

              <div className="mt-6 pt-6 border-t border-navy/10 space-y-2 text-sm font-poppins text-navy/70">
                <div className="flex justify-between"><span>Duration</span><span className="font-medium text-navy">{pkg.duration}</span></div>
                <div className="flex justify-between"><span>Destination</span><span className="font-medium text-navy">{pkg.destination}</span></div>
              </div>
            </div>
          </aside>
        </div>
      </section>
    </div>
  );
}
