import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

// DEV auth: gerçek Cognito gelene kadar oturumu localStorage'da tutar.
// x-dev-sub header'ı (lib/api) buradaki sub ile backend'e gider.
// Cognito'ya geçince: login/signup Cognito Hosted UI / SDK ile, sub = JWT sub.
interface User { sub: string; email: string; }
interface AuthCtx {
  user: User | null;
  signUp: (email: string) => void;
  login: (email: string) => void;
  logout: () => void;
}

const Ctx = createContext<AuthCtx | null>(null);

function slug(email: string): string {
  return "dev-" + email.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    try {
      const sub = localStorage.getItem("ty_dev_sub");
      const email = localStorage.getItem("ty_email");
      if (sub && email) setUser({ sub, email });
    } catch { /* ignore */ }
  }, []);

  const set = (email: string) => {
    const sub = slug(email);
    try {
      localStorage.setItem("ty_dev_sub", sub);
      localStorage.setItem("ty_email", email);
    } catch { /* ignore */ }
    setUser({ sub, email });
  };

  const logout = () => {
    try {
      localStorage.removeItem("ty_dev_sub");
      localStorage.removeItem("ty_email");
    } catch { /* ignore */ }
    setUser(null);
  };

  return <Ctx.Provider value={{ user, signUp: set, login: set, logout }}>{children}</Ctx.Provider>;
}

export function useAuth(): AuthCtx {
  const c = useContext(Ctx);
  if (!c) throw new Error("useAuth must be used within AuthProvider");
  return c;
}
