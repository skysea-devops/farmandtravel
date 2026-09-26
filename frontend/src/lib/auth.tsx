import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import * as cognito from "@/lib/cognito";

// Cognito-backed auth. `ready` is false until the stored session is restored on
// first load, so guards don't bounce a signed-in user to /giris on refresh.
interface User { sub: string; email: string; }
interface AuthCtx {
  user: User | null;
  ready: boolean;
  signUp: (email: string, password: string) => Promise<void>;
  confirmSignUp: (email: string, code: string) => Promise<void>;
  resendCode: (email: string) => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

const Ctx = createContext<AuthCtx | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    cognito.currentSession()
      .then((session) => { if (session) setUser(cognito.userInfo(session)); })
      .catch((e) => console.error(e))
      .finally(() => setReady(true));
  }, []);

  const signUp = (email: string, password: string) => cognito.signUp(email, password);
  const confirmSignUp = (email: string, code: string) => cognito.confirmSignUp(email, code);
  const resendCode = (email: string) => cognito.resendCode(email);

  const login = async (email: string, password: string) => {
    const session = await cognito.signIn(email, password);
    setUser(cognito.userInfo(session));
  };

  const logout = () => {
    cognito.signOut();
    setUser(null);
  };

  return (
    <Ctx.Provider value={{ user, ready, signUp, confirmSignUp, resendCode, login, logout }}>
      {children}
    </Ctx.Provider>
  );
}

export function useAuth(): AuthCtx {
  const c = useContext(Ctx);
  if (!c) throw new Error("useAuth must be used within AuthProvider");
  return c;
}
