import { Link } from "react-router-dom";
import { Mail, Phone, MapPin, Instagram, Facebook, Twitter } from "lucide-react";

export default function Footer() {
  return (
    <footer data-testid="site-footer" className="bg-navy text-white relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 py-20 grid grid-cols-1 md:grid-cols-4 gap-12">
        <div>
          <div className="text-2xl font-playfair font-semibold">
            MakeYour<span className="text-gold">Vacation</span>
          </div>
          <p className="mt-4 text-sm text-white/70 leading-relaxed font-poppins">
            Curated luxury journeys across India's most enchanting destinations.
          </p>
          <div className="flex gap-3 mt-6">
            {[Instagram, Facebook, Twitter].map((Icon, i) => (
              <a
                key={i}
                href="#"
                data-testid={`footer-social-${i}`}
                className="w-9 h-9 rounded-full border border-gold/40 flex items-center justify-center hover:bg-gold hover:text-navy transition-colors"
              >
                <Icon size={16} />
              </a>
            ))}
          </div>
        </div>

        <div>
          <h4 className="section-eyebrow !text-white/60">Quick Links</h4>
          <ul className="mt-5 space-y-3 font-poppins text-sm">
            {[["/", "Home"], ["/packages", "Packages"], ["/destinations", "Destinations"], ["/about", "About Us"], ["/contact", "Contact"]].map(([to, label]) => (
              <li key={to}>
                <Link data-testid={`footer-link-${label.toLowerCase().replace(/\s/g,'-')}`} to={to} className="text-white/80 hover:text-gold transition-colors">{label}</Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h4 className="section-eyebrow !text-white/60">Contact</h4>
          <ul className="mt-5 space-y-3 font-poppins text-sm text-white/80">
            <li className="flex items-start gap-3"><Mail size={16} className="text-gold mt-0.5" /> makeyourvacation.in@gmail.com</li>
            <li className="flex items-start gap-3"><Phone size={16} className="text-gold mt-0.5" /> +91 7569805416</li>
            <li className="flex items-start gap-3"><MapPin size={16} className="text-gold mt-0.5" /> India</li>
          </ul>
        </div>

        <div>
          <h4 className="section-eyebrow !text-white/60">Newsletter</h4>
          <p className="mt-5 text-sm text-white/70 font-poppins">Receive our finest itineraries curated monthly.</p>
          <form onSubmit={(e) => e.preventDefault()} className="mt-4 flex">
            <input data-testid="footer-newsletter-email" type="email" placeholder="Your email" className="flex-1 bg-white/10 border border-white/20 rounded-l-full px-4 py-2 text-sm text-white placeholder:text-white/50 focus:outline-none focus:border-gold" />
            <button data-testid="footer-newsletter-btn" className="bg-gold text-navy px-5 rounded-r-full font-montserrat font-semibold text-xs uppercase tracking-wider hover:bg-gold-dark transition-colors">Join</button>
          </form>
        </div>
      </div>
      <div className="border-t border-white/10">
        <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 py-6 flex flex-col md:flex-row justify-between gap-3 text-xs text-white/60 font-poppins">
          <div data-testid="footer-copyright">© 2026 MakeYourVacation.in — All rights reserved.</div>
          <div className="flex gap-6">
            <a href="#" className="hover:text-gold">Privacy Policy</a>
            <a href="#" className="hover:text-gold">Terms & Conditions</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
