import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "@/lib/api";
import PackageCard from "@/components/PackageCard";
import { Award, Headphones, ShieldCheck, Sparkles, Wallet, Users, Star, ArrowRight } from "lucide-react";

const HERO_IMG = "https://images.unsplash.com/photo-1602002418816-5c0aeef426aa?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NTY2Njd8MHwxfHNlYXJjaHwxfHxsdXh1cnklMjB2YWNhdGlvbnxlbnwwfHx8fDE3ODQyMjk0NTV8MA&ixlib=rb-4.1.0&q=85";

const WHY = [
  { icon: Wallet, title: "Best Price Guarantee", desc: "Unbeatable value on curated luxury travel." },
  { icon: Award, title: "Trusted Travel Experts", desc: "A decade of crafting unforgettable journeys." },
  { icon: Headphones, title: "24×7 Customer Support", desc: "Concierge care from booking to homecoming." },
  { icon: Sparkles, title: "Customized Tours", desc: "Itineraries tailored precisely to your dream." },
  { icon: ShieldCheck, title: "Secure Booking", desc: "Encrypted payments and transparent policies." },
  { icon: Users, title: "Thousands of Happy Travelers", desc: "A world of stories, all written with us." },
];

const GALLERY = [
  "https://images.unsplash.com/photo-1642516864726-a243f416fc00?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NTY2Nzd8MHwxfHNlYXJjaHw0fHxnb2ElMjBiZWFjaCUyMGx1eHVyeXxlbnwwfHx8fDE3ODQyMjk0NDh8MA&ixlib=rb-4.1.0&q=85",
  "https://images.unsplash.com/photo-1609828913552-f9138ed9e42d?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NDk1NzZ8MHwxfHNlYXJjaHwxfHxrZXJhbGElMjBiYWNrd2F0ZXJzJTIwbHV4dXJ5JTIwYm9hdHxlbnwwfHx8fDE3ODQyMjk0Mzd8MA&ixlib=rb-4.1.0&q=85",
  "https://images.unsplash.com/photo-1666545381732-b1cc6785ce3c?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NDk1Nzh8MHwxfHNlYXJjaHw0fHxrYXNobWlyJTIwbW91bnRhaW5zJTIwZGFsJTIwbGFrZXxlbnwwfHx8fDE3ODQyMjk0Mzd8MA&ixlib=rb-4.1.0&q=85",
  "https://images.unsplash.com/photo-1633259422382-5ead30efb697?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NDQ2NDF8MHwxfHNlYXJjaHw0fHxsZWglMjBsYWRha2glMjBsYW5kc2NhcGV8ZW58MHx8fHwxNzg0MjI5NDQ4fDA&ixlib=rb-4.1.0&q=85",
  "https://images.pexels.com/photos/15490065/pexels-photo-15490065.jpeg",
  "https://images.unsplash.com/photo-1658051161493-1d311c4c7b4d?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjAzNTl8MHwxfHNlYXJjaHwzfHx0ZWElMjBnYXJkZW4lMjBtdW5uYXJ8ZW58MHx8fHwxNzg0MjI5NDU0fDA&ixlib=rb-4.1.0&q=85",
];

const TESTIMONIALS = [
  { name: "Priya & Arjun Sharma", trip: "Kashmir Honeymoon", quote: "Every detail — from the shikara to the sunset dinner — felt like it was crafted just for us. The team truly listens.", avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w4NjAzMjV8MHwxfHNlYXJjaHwyfHxwb3J0cmFpdCUyMHdvbWFufGVufDB8fHx8MTY4NDIyOTQzOHww&ixlib=rb-4.0.3&q=80&w=200" },
  { name: "Rahul Menon", trip: "Ladakh Expedition", quote: "The most seamless mountain trip I've ever taken. Premium hotels, thoughtful guides, and zero surprises.", avatar: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w4NjAzMjV8MHwxfHNlYXJjaHwyfHxwb3J0cmFpdCUyMG1hbnxlbnwwfHx8fDE2ODQyMjk0Mzh8MA&ixlib=rb-4.0.3&q=80&w=200" },
  { name: "Neha Kapoor", trip: "Kerala Backwaters", quote: "A truly royal experience. The houseboat, the food, the sunsets — I felt like a queen for a week.", avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w4NjAzMjV8MHwxfHNlYXJjaHwyfHxwb3J0cmFpdCUyMHdvbWFufGVufDB8fHx8MTY4NDIyOTQzOHww&ixlib=rb-4.0.3&q=80&w=200" },
];

export default function Home() {
  const [packages, setPackages] = useState([]);
  const [lightbox, setLightbox] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const { data } = await api.get("/packages", { params: { featured: true } });
        setPackages(data);
      } catch (e) { console.error(e); }
    })();
  }, []);

  return (
    <div className="pt-0">
      {/* Hero */}
      <section data-testid="hero-section" className="relative h-[100vh] w-full overflow-hidden">
        <img src={HERO_IMG} alt="Luxury travel" className="absolute inset-0 w-full h-full object-cover" />
        <div className="absolute inset-0 hero-overlay" />
        <div className="relative z-10 h-full flex flex-col justify-center max-w-7xl mx-auto px-6 sm:px-8 lg:px-12">
          <div className="max-w-3xl">
            <div className="section-eyebrow !text-gold mb-6 animate-fade-up" style={{ animationDelay: "0.1s" }}>Curated Luxury Journeys</div>
            <h1 className="text-white font-playfair font-semibold text-5xl sm:text-6xl lg:text-7xl leading-[1.05] animate-fade-up" style={{ animationDelay: "0.25s" }}>
              Luxury Journeys<br />
              <span className="italic text-gold">Begin Here</span>
            </h1>
            <p className="mt-7 text-white/85 font-poppins text-lg max-w-xl animate-fade-up" style={{ animationDelay: "0.4s" }}>
              Explore India's finest destinations with premium travel experiences — designed for the discerning traveller.
            </p>
            <div className="mt-10 flex flex-wrap gap-4 animate-fade-up" style={{ animationDelay: "0.55s" }}>
              <Link to="/packages" data-testid="hero-explore-btn" className="btn-gold">Explore Packages <ArrowRight size={16} /></Link>
              <Link to="/contact" data-testid="hero-book-btn" className="btn-outline-gold">Book Your Trip</Link>
            </div>
          </div>
        </div>
        <div className="absolute bottom-8 inset-x-0 z-10 flex justify-center">
          <div className="text-white/70 text-xs font-montserrat uppercase tracking-[0.3em] animate-fade-in">Scroll to Discover</div>
        </div>
      </section>

      {/* Popular Packages */}
      <section data-testid="popular-packages-section" className="py-24 md:py-32 bg-white">
        <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-14">
            <div>
              <div className="section-eyebrow">Handpicked</div>
              <h2 className="mt-3 text-4xl md:text-5xl font-playfair font-semibold text-navy">Popular Packages</h2>
              <p className="mt-3 text-navy/60 max-w-lg font-poppins">Our most-loved journeys — thoughtfully assembled for connoisseurs of comfort and wonder.</p>
            </div>
            <Link to="/packages" data-testid="view-all-packages-link" className="text-navy font-montserrat uppercase text-xs tracking-[0.22em] gold-underline">View All Packages →</Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {packages.map((p, i) => <PackageCard key={p.id} pkg={p} index={i} />)}
          </div>
        </div>
      </section>

      {/* Why Choose Us */}
      <section data-testid="why-us-section" className="py-24 md:py-32 bg-softgray relative overflow-hidden grain">
        <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 relative">
          <div className="max-w-2xl mb-14">
            <div className="section-eyebrow">Why Travel With Us</div>
            <h2 className="mt-3 text-4xl md:text-5xl font-playfair font-semibold text-navy">The MakeYourVacation Promise</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {WHY.map((w, i) => (
              <div key={i} data-testid={`why-card-${i}`} className="glass rounded-2xl p-8 luxury-shadow transition-transform duration-500 hover:-translate-y-1">
                <div className="w-12 h-12 rounded-full bg-navy flex items-center justify-center text-gold">
                  <w.icon size={22} />
                </div>
                <h3 className="mt-6 text-xl font-playfair font-semibold text-navy">{w.title}</h3>
                <p className="mt-2 text-sm font-poppins text-navy/65">{w.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Gallery */}
      <section data-testid="gallery-section" className="py-24 md:py-32 bg-white">
        <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12">
          <div className="text-center mb-14">
            <div className="section-eyebrow">Moments</div>
            <h2 className="mt-3 text-4xl md:text-5xl font-playfair font-semibold text-navy">A Glimpse of Our Journeys</h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {GALLERY.map((src, i) => (
              <button key={i} data-testid={`gallery-item-${i}`} onClick={() => setLightbox(src)} className={`relative overflow-hidden rounded-2xl zoom-hover ${i === 0 || i === 3 ? "md:row-span-2 aspect-square md:aspect-auto" : "aspect-square"}`}>
                <img src={src} alt="" loading="lazy" className="w-full h-full object-cover" />
              </button>
            ))}
          </div>
        </div>
        {lightbox && (
          <div data-testid="gallery-lightbox" onClick={() => setLightbox(null)} className="fixed inset-0 z-[60] bg-navy/90 flex items-center justify-center p-6 animate-fade-in cursor-zoom-out">
            <img src={lightbox} alt="" className="max-h-[85vh] max-w-full rounded-2xl luxury-shadow" />
          </div>
        )}
      </section>

      {/* Testimonials */}
      <section data-testid="testimonials-section" className="py-24 md:py-32 bg-navy text-white relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12">
          <div className="text-center mb-14">
            <div className="section-eyebrow">Testimonials</div>
            <h2 className="mt-3 text-4xl md:text-5xl font-playfair font-semibold text-white">Voices of Our Travellers</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {TESTIMONIALS.map((t, i) => (
              <div key={i} data-testid={`testimonial-${i}`} className="glass-dark rounded-2xl p-8">
                <div className="flex gap-1 text-gold mb-4">
                  {[...Array(5)].map((_, s) => <Star key={s} size={14} className="fill-current" />)}
                </div>
                <p className="font-playfair italic text-lg leading-relaxed text-white/90">"{t.quote}"</p>
                <div className="mt-6 flex items-center gap-3">
                  <img src={t.avatar} alt={t.name} className="w-11 h-11 rounded-full object-cover border-2 border-gold/50" />
                  <div>
                    <div className="font-poppins text-sm font-semibold">{t.name}</div>
                    <div className="text-xs text-gold/80 font-montserrat uppercase tracking-wider">{t.trip}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-white">
        <div className="max-w-5xl mx-auto text-center px-6">
          <h2 className="text-4xl md:text-5xl font-playfair font-semibold text-navy">Your Extraordinary Journey Awaits</h2>
          <p className="mt-5 font-poppins text-navy/60 max-w-2xl mx-auto">Speak with our concierge and let us craft the perfect escape.</p>
          <Link to="/contact" data-testid="cta-plan-trip-btn" className="btn-gold mt-8">Plan My Trip <ArrowRight size={16} /></Link>
        </div>
      </section>
    </div>
  );
}
