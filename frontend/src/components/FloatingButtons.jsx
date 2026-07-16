import { useEffect, useState } from "react";
import { ArrowUp } from "lucide-react";

export default function FloatingButtons() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 500);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <>
      <a
        href="https://wa.me/917569805416?text=Hi%20MakeYourVacation%2C%20I%27d%20like%20to%20plan%20a%20trip."
        target="_blank"
        rel="noopener noreferrer"
        data-testid="floating-whatsapp-btn"
        className="fixed bottom-6 right-6 z-40 bg-[#25D366] text-white rounded-full p-4 shadow-[0_10px_30px_rgba(37,211,102,0.4)] hover:scale-110 transition-transform"
        aria-label="Chat on WhatsApp"
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
          <path d="M20.52 3.48A11.86 11.86 0 0012 0C5.37 0 .05 5.32.05 11.95a11.87 11.87 0 001.64 6.06L0 24l6.15-1.62a11.9 11.9 0 005.85 1.5h.01c6.63 0 11.95-5.32 11.95-11.95a11.86 11.86 0 00-3.44-8.45zM12 21.75h-.01a9.8 9.8 0 01-5-1.36l-.36-.22-3.65.96.98-3.56-.24-.37a9.8 9.8 0 01-1.5-5.25c0-5.42 4.42-9.84 9.85-9.84 2.63 0 5.1 1.02 6.96 2.88a9.77 9.77 0 012.87 6.96c-.01 5.43-4.43 9.8-9.9 9.8zm5.4-7.34c-.3-.15-1.75-.86-2.02-.96-.27-.1-.47-.15-.66.15-.2.3-.76.96-.93 1.16-.17.2-.34.22-.63.07-.3-.15-1.25-.46-2.38-1.47a8.98 8.98 0 01-1.66-2.06c-.17-.3-.02-.46.13-.6.13-.13.3-.34.44-.51.15-.17.2-.3.3-.49.1-.2.05-.37-.02-.52-.07-.15-.66-1.6-.9-2.19-.24-.57-.48-.49-.66-.5H8.5c-.2 0-.51.07-.78.37-.27.3-1.02.99-1.02 2.41 0 1.42 1.04 2.79 1.19 2.98.15.2 2.05 3.14 4.97 4.4.7.3 1.24.48 1.66.62.7.22 1.33.19 1.83.11.56-.08 1.75-.71 2-1.4.25-.68.25-1.27.17-1.4-.07-.13-.27-.2-.57-.35z"/>
        </svg>
      </a>

      <button
        data-testid="floating-back-to-top-btn"
        onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
        className={`fixed bottom-6 left-6 z-40 bg-navy text-gold rounded-full p-3 shadow-[0_10px_30px_rgba(7,30,61,0.35)] transition-all duration-300 ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4 pointer-events-none"}`}
        aria-label="Back to top"
      >
        <ArrowUp size={22} />
      </button>
    </>
  );
}
