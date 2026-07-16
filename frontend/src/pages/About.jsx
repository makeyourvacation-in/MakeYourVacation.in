import { Link } from "react-router-dom";
import { Award, Users, MapPin, Sparkles } from "lucide-react";

const STATS = [
  { value: "10+", label: "Years of Expertise" },
  { value: "5,000+", label: "Happy Travellers" },
  { value: "25+", label: "Destinations" },
  { value: "4.9★", label: "Average Rating" },
];

export default function About() {
  return (
    <div>
      <section className="relative pt-32 pb-20 bg-navy text-white overflow-hidden">
        <div className="absolute inset-0 opacity-25">
          <img src="https://images.unsplash.com/photo-1549294413-26f195200c16?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NTY2Njd8MHwxfHNlYXJjaHw0fHxsdXh1cnklMjB2YWNhdGlvbnxlbnwwfHx8fDE3ODQyMjk0NTV8MA&ixlib=rb-4.1.0&q=85" alt="" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-navy/70" />
        </div>
        <div className="relative max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 text-center">
          <div className="section-eyebrow">Our Story</div>
          <h1 className="mt-3 text-5xl md:text-6xl font-playfair font-semibold">About MakeYourVacation</h1>
          <p className="mt-5 max-w-2xl mx-auto text-white/75 font-poppins">Crafting exceptional Indian travel experiences with elegance, expertise, and heartfelt service.</p>
        </div>
      </section>

      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 grid md:grid-cols-2 gap-16 items-center">
          <div className="grid grid-cols-2 gap-4">
            <img src="https://images.unsplash.com/photo-1666545381732-b1cc6785ce3c?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NDk1Nzh8MHwxfHNlYXJjaHw0fHxrYXNobWlyJTIwbW91bnRhaW5zJTIwZGFsJTIwbGFrZXxlbnwwfHx8fDE3ODQyMjk0Mzd8MA&ixlib=rb-4.1.0&q=85" alt="" className="rounded-2xl h-64 w-full object-cover luxury-shadow" />
            <img src="https://images.unsplash.com/photo-1642516864726-a243f416fc00?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NTY2Nzd8MHwxfHNlYXJjaHw0fHxnb2ElMjBiZWFjaCUyMGx1eHVyeXxlbnwwfHx8fDE3ODQyMjk0NDh8MA&ixlib=rb-4.1.0&q=85" alt="" className="rounded-2xl h-64 w-full object-cover luxury-shadow mt-8" />
            <img src="https://images.unsplash.com/photo-1609828913552-f9138ed9e42d?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NDk1NzZ8MHwxfHNlYXJjaHwxfHxrZXJhbGElMjBiYWNrd2F0ZXJzJTIwbHV4dXJ5JTIwYm9hdHxlbnwwfHx8fDE3ODQyMjk0Mzd8MA&ixlib=rb-4.1.0&q=85" alt="" className="rounded-2xl h-64 w-full object-cover luxury-shadow -mt-4" />
            <img src="https://images.unsplash.com/photo-1633259422382-5ead30efb697?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NDQ2NDF8MHwxfHNlYXJjaHw0fHxsZWglMjBsYWRha2glMjBsYW5kc2NhcGV8ZW58MHx8fHwxNzg0MjI5NDQ4fDA&ixlib=rb-4.1.0&q=85" alt="" className="rounded-2xl h-64 w-full object-cover luxury-shadow" />
          </div>
          <div>
            <div className="section-eyebrow">Who We Are</div>
            <h2 className="mt-3 text-4xl md:text-5xl font-playfair font-semibold text-navy leading-tight">A Trusted Partner in <span className="italic text-gold">Extraordinary Escapes</span></h2>
            <p className="mt-6 font-poppins text-navy/70 leading-relaxed">MakeYourVacation.in is a boutique luxury travel company dedicated to designing unforgettable holidays across India. From the snow-kissed valleys of Kashmir to the palm-fringed beaches of Kerala, we curate every detail so you may simply savour the moment.</p>
            <p className="mt-4 font-poppins text-navy/70 leading-relaxed">Our team combines local expertise with global service standards to deliver journeys that feel personal, seamless, and utterly premium — all at exceptional value.</p>
            <Link to="/packages" data-testid="about-explore-btn" className="btn-gold mt-8">Explore Our Packages</Link>
          </div>
        </div>
      </section>

      <section className="py-20 bg-softgray">
        <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 grid grid-cols-2 md:grid-cols-4 gap-8">
          {STATS.map((s, i) => (
            <div key={i} data-testid={`stat-${i}`} className="text-center">
              <div className="text-4xl md:text-5xl font-playfair font-semibold text-gold">{s.value}</div>
              <div className="mt-2 text-xs md:text-sm font-montserrat uppercase tracking-[0.2em] text-navy/70">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12">
          <div className="text-center mb-14">
            <div className="section-eyebrow">Our Values</div>
            <h2 className="mt-3 text-4xl md:text-5xl font-playfair font-semibold text-navy">What Guides Us</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {[
              { icon: Sparkles, title: "Craftsmanship", desc: "Every itinerary is designed with care and character." },
              { icon: Award, title: "Excellence", desc: "Uncompromising standards, always." },
              { icon: Users, title: "Warmth", desc: "Genuine, thoughtful service at every step." },
              { icon: MapPin, title: "Discovery", desc: "Immersive experiences beyond the obvious." },
            ].map((v, i) => (
              <div key={i} className="border border-navy/10 rounded-2xl p-8 hover:border-gold transition-colors">
                <v.icon className="text-gold" size={28} />
                <h3 className="mt-5 font-playfair text-xl text-navy">{v.title}</h3>
                <p className="mt-2 text-sm font-poppins text-navy/60">{v.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
