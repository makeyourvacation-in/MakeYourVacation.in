import { Link } from "react-router-dom";
import { Clock, MapPin, ArrowRight, Star } from "lucide-react";

export default function PackageCard({ pkg, index = 0 }) {
  return (
    <article
      data-testid={`package-card-${pkg.id}`}
      className="group bg-white rounded-2xl overflow-hidden luxury-shadow luxury-shadow-hover transition-shadow duration-500 flex flex-col animate-fade-up"
      style={{ animationDelay: `${index * 80}ms` }}
    >
      <div className="relative aspect-[4/3] overflow-hidden zoom-hover">
        <img src={pkg.hero_image} alt={pkg.name} loading="lazy" className="w-full h-full object-cover" />
        {pkg.featured && (
          <div className="absolute top-4 left-4 bg-gold text-navy text-[10px] font-montserrat uppercase tracking-[0.2em] font-semibold px-3 py-1 rounded-full flex items-center gap-1">
            <Star size={10} className="fill-current" /> Featured
          </div>
        )}
        <div className="absolute top-4 right-4 glass px-3 py-1 rounded-full flex items-center gap-1.5 text-navy text-xs font-poppins font-medium">
          <Clock size={12} /> {pkg.duration}
        </div>
      </div>

      <div className="p-6 flex flex-col flex-1">
        <div className="flex items-center gap-1.5 text-gold text-xs font-montserrat uppercase tracking-[0.18em]">
          <MapPin size={12} /> {pkg.destination}
        </div>
        <h3 className="mt-2 text-2xl font-playfair font-semibold text-navy leading-snug">{pkg.name}</h3>
        <p className="mt-3 text-sm text-navy/60 font-poppins line-clamp-2">{pkg.short_description}</p>

        {pkg.highlights?.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-1.5">
            {pkg.highlights.slice(0, 3).map((h, i) => (
              <span key={i} className="text-[11px] font-poppins bg-softgray text-navy/80 px-2.5 py-1 rounded-full">
                {h}
              </span>
            ))}
          </div>
        )}

        <div className="mt-6 pt-5 border-t border-navy/10 flex items-center justify-between">
          <div>
            <div className="text-[10px] font-montserrat uppercase tracking-[0.18em] text-navy/50">Starting from</div>
            <div className="text-2xl font-playfair font-semibold text-navy">₹{pkg.price.toLocaleString('en-IN')}</div>
          </div>
          <Link
            to={`/packages/${pkg.id}`}
            data-testid={`package-card-book-btn-${pkg.id}`}
            className="btn-navy !py-2.5 !px-5 text-xs"
          >
            View <ArrowRight size={14} />
          </Link>
        </div>
      </div>
    </article>
  );
}
