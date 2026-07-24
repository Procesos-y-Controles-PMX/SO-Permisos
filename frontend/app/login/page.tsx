"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AlertCircle } from "lucide-react";
import { GridLoadingScreen } from "@promexma/ui";
import { useAuth } from "@/contexts/AuthContext";
import LoginShell from "@/components/login/LoginShell";
import { loginButtonClass, loginInputClass, loginTitleClass } from "@/components/login/loginStyles";

// When the unified portal is configured, /login only forwards there
// (bookmarks keep working); without it the local form still renders.
const PORTAL_URL = process.env.NEXT_PUBLIC_PORTAL_URL;

export default function LoginPage() {
  const { signIn } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (PORTAL_URL) window.location.replace(`${PORTAL_URL}/login?app=permisos`);
  }, []);

  if (PORTAL_URL) {
    return <GridLoadingScreen variant="dark" message="Redirigiendo al portal..." />;
  }

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const { error: signInError } = await signIn(email, password);
      if (signInError) {
        setError(signInError);
        return;
      }
      router.push("/");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Error al iniciar sesión");
    } finally {
      setLoading(false);
    }
  };

  return (
    <LoginShell
      productLabel="SO Permisos"
      heroLine1="Sistema Integral"
      heroLine2="de Permisos"
      heroDescription="Plataforma integral para la administración, control y seguimiento de permisos y licencias de las sucursales CEMEX."
    >
      <div className="mb-6 sm:mb-8">
        <h2 className={loginTitleClass}>Iniciar sesión</h2>
        <p className="mt-2 text-sm sm:text-base text-fg-subtle">
          Ingresa tus credenciales para acceder al sistema.
        </p>
      </div>

      <form onSubmit={onSubmit} className="space-y-5">
        <div>
          <label className="block text-xs font-semibold text-fg-subtle uppercase tracking-wider mb-1.5">
            Correo electrónico
          </label>
          <input
            type="email"
            className={loginInputClass}
            placeholder="usuario@promexma.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
            required
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-fg-subtle uppercase tracking-wider mb-1.5">
            Contraseña
          </label>
          <input
            type="password"
            className={loginInputClass}
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
            required
          />
        </div>

        {error && (
          <div className="flex items-center gap-2.5 px-3.5 py-2.5 bg-red-50 border border-red-100 rounded-lg">
            <AlertCircle size={15} className="text-red-500 shrink-0" />
            <p className="text-xs font-medium text-red-700">{error}</p>
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className={loginButtonClass}
        >
          {loading ? "Verificando..." : "Acceder"}
        </button>
      </form>
    </LoginShell>
  );
}
