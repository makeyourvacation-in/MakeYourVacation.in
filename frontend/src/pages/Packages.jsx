import { useEffect, useMemo, useState } from "react";
import { api } from "@/lib/api";
import PackageCard from "@/components/PackageCard";
import { Search } from "lucide-react";

export default function Packages() {
  const [packages, setPackages] = useState([]);
  const [q, setQ] = useState("");
  const [dest, setDest] = useState("All");

  useEffect(() => {
    (async () => {
      try {
        const { data } = await api.get("/packages");
        setPackages(data);
      } catch (e) { console.error(e); }
    })();
  }, []);

  const destinations = useMemo(() => ["All", ...Array.from(new Set(packages.map((p) => p.destination)))], [packages]);
  const filtered = packages.filter((p) =>
    (dest === "All" || p.destination === dest) &&
    (p.name.toLowerCase().includes(q.toLowerCase()) || p.destination.toLowerCase().includes(q.toLowerCase()))
  );

  return (
    <div>
      <section className="relative pt-32 pb-20 bg-navy text-white overflow-hidden">
        <div className="absolute inset-0 opacity-30">
          <img src="https://images.unsplash.com/photo-1549294413-26f195200c16?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NTY2Njd8MHwxfHNlYXJjaHw0fHxsdXh1cnklMjB2YWNhdGlvbnxlbnwwfHx8fDE3ODQyMjk0NTV8MA&ixlib=rb-4.1.0&q=85" alt="" className="w-full h-full object-cover"/>
          <div className="absolute inset-0 bg-navy/70" />
        </div>
        <div className="relative max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 text-center">
          <div className="section-eyebrow">Our Collection</div>
          <h1 className="mt-3 text-5xl md:text-6xl font-playfair font-semibold">Travel Packages</h1>
          <p className="mt-5 max-w-2xl mx-auto text-white/75 font-poppins">Curated journeys that turn everyday holidays into stories worth telling for a lifetime.</p>
        </div>
      </section>

      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12">
          <div className="flex flex-col md:flex-row gap-4 mb-10">
            <div className="flex-1 relative">
              <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-navy/40" />
              <input data-testid="packages-search-input" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search destinations, packages…" className="w-full pl-11 pr-4 py-3 rounded-full border border-navy/15 focus:outline-none focus:border-gold font-poppins text-sm bg-softgray" />
            </div>
            <div className="flex flex-wrap gap-2">
              {destinations.map((d) => (
                <button
                  key={d}
                  data-testid={`filter-${d.toLowerCase().replace(/\s/g,'-')}`}
                  onClick={() => setDest(d)}
                  className={`px-4 py-2 rounded-full text-xs font-montserrat uppercase tracking-[0.15em] border transition-colors ${
                    dest === d ? "bg-navy text-gold border-navy" : "border-navy/20 text-navy/70 hover:border-navy"
                  }`}
                >
                  {d}
                </button>
              ))}
            </div>
          </div>

          {filtered.length === 0 ? (
            <div className="text-center py-16 text-navy/50 font-poppins" data-testid="packages-empty-state">No packages match your search.</div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
              {filtered.map((p, i) => <PackageCard key={p.id} pkg={p} index={i} />)}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
