import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import API_URL from "../services/api";
import Logo from "../components/Logo";

export default function ProtectedRoute({
  children,
}: {
  children: React.ReactNode;
}) {
  const [loading, setLoading] = useState(true);
  const [authenticated, setAuthenticated] = useState(false);

  useEffect(() => {
    fetch(`${API_URL}/me`, {
      credentials: "include",
    })
      .then((res) => {
        setAuthenticated(res.ok);
      })
      .catch(() => {
        setAuthenticated(false);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div
        role="status"
        aria-label="Carregando"
        className="flex min-h-screen flex-col items-center justify-center gap-5 bg-ink-50"
      >
        <Logo size="lg" />
        <span className="h-1 w-40 overflow-hidden rounded-full bg-ink-200">
          <span className="block h-full w-1/3 animate-shimmer rounded-full bg-brand-gradient" />
        </span>
      </div>
    );
  }

  if (!authenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}
