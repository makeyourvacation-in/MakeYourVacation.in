import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { MapPin, ArrowRight } from "lucide-react";

export default function Destinations() {
  const [packages, setPackages] = useState([]);
  useEffect(() => {
    (async () => {
      try {
        const { data } = await api.get("/packages");
        setPackages(data);
      } catch (e) { console.error(e); }
    })();
  }, []);

  // group by destination
  const grouped = packages.reduce((acc, p) => {
    (acc[p.destination] ||= []).push(p);
    return acc;
  }, {});
  const destList = Object.entries(grouped);

  return (
    <div>
      <section className="relative pt-32 pb-20 bg-navy text-white overflow-hidden">
        <div className="absolute inset-0 opacity-25">
          <img src="https://images.unsplash.com/photo-1633259422382-5ead30efb697?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NDQ2NDF8MHwxfHNlYXJjaHw0fHxsZWglMjBsYWRha2glMjBsYW5kc2NhcGV8ZW58MHx8fHwxNzg0MjI5NDQ4fDA&ixlib=rb-4.1.0&q=85" alt="" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-navy/70" />
        </div>
        <div className="relative max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 text-center">
          <div className="section-eyebrow">Where Dreams Unfold</div>
          <h1 className="mt-3 text-5xl md:text-6xl font-playfair font-semibold">Destinations</h1>
          <p className="mt-5 max-w-2xl mx-auto text-white/75 font-poppins">From alpine valleys to tropical shores — discover India's most magnificent escapes.</p>
        </div>
      </section>

      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {destList.map(([dest, pkgs], i) => (
            <Link key={dest} data-testid={`destination-card-${dest.toLowerCase().replace(/\s/g,'-')}`} to={`/packages`} className="group relative rounded-2xl overflow-hidden aspect-[4/5] zoom-hover luxury-shadow luxury-shadow-hover animate-fade-up" style={{ animationDelay: `${i*70}ms` }}>
              <img src={pkgs[0].hero_image} alt={dest} loading="lazy" className="absolute inset-0 w-full h-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-navy/95 via-navy/25 to-transparent" />
              <div className="absolute inset-x-0 bottom-0 p-7 text-white">
                <div className="section-eyebrow !text-gold flex items-center gap-1"><MapPin size={12}/> India</div>
                <h3 className="mt-2 text-3xl font-playfair font-semibold">{dest}</h3>
                <p className="mt-1 text-white/70 text-sm font-poppins">{pkgs.length} package{pkgs.length > 1 ? "s" : ""}</p>
                <div className="mt-4 inline-flex items-center gap-2 text-gold text-xs font-montserrat uppercase tracking-[0.22em] group-hover:gap-3 transition-all">Explore <ArrowRight size={14} /></div>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
