import { createContext, useContext, useEffect, useState } from "react";
import { api } from "@/lib/api";

const AuthContext = createContext({ admin: null, checking: true, login: async () => {}, logout: async () => {} });

export function AuthProvider({ children }) {
  const [admin, setAdmin] = useState(null);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const { data } = await api.get("/auth/me");
        setAdmin(data);
      } catch {
        setAdmin(null);
      } finally {
        setChecking(false);
      }
    })();
  }, []);

  const login = async (username, password) => {
    const { data } = await api.post("/auth/login", { username, password });
    setAdmin({ username: data.username });
    return data;
  };

  const logout = async () => {
    try { await api.post("/auth/logout"); } catch {}
    setAdmin(null);
  };

  return <AuthContext.Provider value={{ admin, checking, login, logout }}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);
