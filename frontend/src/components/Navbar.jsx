import { useEffect, useState } from "react";
import { Link, NavLink, useLocation } from "react-router-dom";
import { Menu, X } from "lucide-react";
import { LogoMark } from "@/components/Logo";

const NAV = [
  { to: "/", label: "Home" },
  { to: "/packages", label: "Packages" },
  { to: "/destinations", label: "Destinations" },
  { to: "/about", label: "About" },
  { to: "/contact", label: "Contact" },
];

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => { setOpen(false); }, [location.pathname]);

  const solid = scrolled || open;

  return (
    <header
      data-testid="site-navbar"
      className={`fixed top-0 inset-x-0 z-50 transition-colors duration-500 ${
        solid ? "bg-white/95 backdrop-blur-md shadow-[0_2px_20px_rgba(7,30,61,0.08)]" : "bg-transparent"
      }`}
    >
      <div className="max-w-7xl mx-auto px-5 sm:px-8 lg:px-12">
        <div className="flex items-center justify-between h-20">
          <Link to="/" data-testid="nav-logo" className="flex items-center gap-3 group">
            <LogoMark size={40} />
            <div className={`text-xl md:text-2xl font-playfair font-semibold tracking-tight ${solid ? "text-navy" : "text-white"}`}>
              MakeYour<span className="text-gold">Vacation</span>
            </div>
          </Link>

          <nav className="hidden lg:flex items-center gap-10">
            {NAV.map((n) => (
              <NavLink
                key={n.to}
                to={n.to}
                data-testid={`nav-link-${n.label.toLowerCase()}`}
                className={({ isActive }) =>
                  `font-montserrat text-[13px] uppercase tracking-[0.22em] gold-underline ${
                    solid ? "text-navy" : "text-white/95"
                  } ${isActive ? "!text-gold" : ""}`
                }
                end={n.to === "/"}
              >
                {n.label}
              </NavLink>
            ))}
            <Link to="/contact" data-testid="nav-book-btn" className="btn-gold !py-3 !px-6 text-xs">
              Book Now
            </Link>
          </nav>

          <button
            data-testid="nav-mobile-toggle"
            onClick={() => setOpen((v) => !v)}
            className={`lg:hidden p-2 rounded-full ${solid ? "text-navy" : "text-white"}`}
            aria-label="Toggle menu"
          >
            {open ? <X size={26} /> : <Menu size={26} />}
          </button>
        </div>

        {open && (
          <div className="lg:hidden pb-6 space-y-3 animate-fade-in" data-testid="nav-mobile-menu">
            {NAV.map((n) => (
              <NavLink
                key={n.to}
                to={n.to}
                data-testid={`nav-mobile-link-${n.label.toLowerCase()}`}
                className={({ isActive }) =>
                  `block py-2 font-montserrat text-sm uppercase tracking-[0.2em] ${isActive ? "text-gold" : "text-navy"}`
                }
                end={n.to === "/"}
              >
                {n.label}
              </NavLink>
            ))}
            <Link to="/contact" data-testid="nav-mobile-book-btn" className="btn-gold w-full justify-center mt-3">
              Book Now
            </Link>
          </div>
        )}
      </div>
    </header>
  );
}
