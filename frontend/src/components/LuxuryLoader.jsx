import { useEffect, useState } from "react";

export default function LuxuryLoader() {
  const [hidden, setHidden] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setHidden(true), 900);
    return () => clearTimeout(t);
  }, []);
  return (
    <div data-testid="luxury-loader" className={`luxury-loader ${hidden ? "hide" : ""}`}>
      <div className="flex flex-col items-center gap-6">
        <div className="ring" />
        <div className="font-playfair text-gold text-xl tracking-widest">MakeYourVacation</div>
      </div>
    </div>
  );
}
