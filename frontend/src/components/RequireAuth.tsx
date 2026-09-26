import { Navigate } from "react-router-dom";
import { useAuth } from "@/lib/auth";

export function RequireAuth({ children }: { children: React.ReactNode }) {
  const { user, ready } = useAuth();
  // Wait for the stored Cognito session to be restored before deciding.
  if (!ready) {
    return <div className="mx-auto max-w-md px-6 py-20 text-center text-sm text-ink-500">Yükleniyor…</div>;
  }
  if (!user) return <Navigate to="/giris" replace />;
  return <>{children}</>;
}
