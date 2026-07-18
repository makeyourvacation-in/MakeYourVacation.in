import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/lib/auth";
import { formatApiError } from "@/lib/api";
import { toast } from "sonner";
import { Lock, User, ArrowRight } from "lucide-react";
import { LogoMark } from "@/components/Logo";
import useDocumentTitle from "@/hooks/useDocumentTitle";

export default function AdminLogin() {
  useDocumentTitle("MakeYourVacation.in | Admin Login");
  const { login } = useAuth();
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login(username.trim().toLowerCase(), password);
      toast.success("Welcome back, Admin.");
      navigate("/admin/dashboard");
    } catch (err) {
      toast.error(formatApiError(err.response?.data?.detail, "Invalid credentials") || err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-navy relative overflow-hidden px-6">
      <img src="https://images.unsplash.com/photo-1549294413-26f195200c16?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NTY2Njd8MHwxfHNlYXJjaHw0fHxsdXh1cnklMjB2YWNhdGlvbnxlbnwwfHx8fDE3ODQyMjk0NTV8MA&ixlib=rb-4.1.0&q=85" alt="" className="absolute inset-0 w-full h-full object-cover opacity-30"/>
      <div className="absolute inset-0 bg-navy/70" />
      <form onSubmit={submit} data-testid="admin-login-form" className="relative z-10 glass-dark rounded-3xl p-10 md:p-12 w-full max-w-md text-white">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4"><LogoMark size={64} /></div>
          <div className="section-eyebrow !text-gold">MakeYourVacation.in</div>
          <h1 className="mt-2 text-3xl md:text-4xl font-playfair font-semibold">Admin Sign In</h1>
          <p className="mt-2 text-white/60 text-sm font-poppins">Manage packages, bookings and content.</p>
        </div>

        <label className="block mb-4">
          <span className="block text-[10px] font-montserrat uppercase tracking-[0.2em] text-white/70 mb-2">Username</span>
          <div className="relative">
            <User size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gold" />
            <input data-testid="admin-login-username" required value={username} onChange={(e) => setUsername(e.target.value)} className="w-full bg-white/10 border border-white/20 rounded-xl pl-11 pr-4 py-3 text-sm font-poppins text-white placeholder:text-white/40 focus:outline-none focus:border-gold" placeholder="admin"/>
          </div>
        </label>

        <label className="block mb-6">
          <span className="block text-[10px] font-montserrat uppercase tracking-[0.2em] text-white/70 mb-2">Password</span>
          <div className="relative">
            <Lock size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gold" />
            <input data-testid="admin-login-password" required type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full bg-white/10 border border-white/20 rounded-xl pl-11 pr-4 py-3 text-sm font-poppins text-white placeholder:text-white/40 focus:outline-none focus:border-gold" placeholder="••••••••"/>
          </div>
        </label>

        <button data-testid="admin-login-submit-btn" disabled={loading} className="btn-gold w-full justify-center !py-4 disabled:opacity-60">
          {loading ? "Signing in…" : (<>Sign In <ArrowRight size={16}/></>)}
        </button>
      </form>
    </div>
  );
}
