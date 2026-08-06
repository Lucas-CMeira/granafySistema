import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { MdEmail, MdLock, MdVisibility, MdVisibilityOff, MdErrorOutline } from "react-icons/md";
import API_URL from "../services/api";
import { errorMessage } from "../utils/errors";

const Form = () => {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await fetch(`${API_URL}/login`, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          password,
        }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => null);
        throw new Error(data?.message || "E-mail ou senha não conferem.");
      }

      navigate("/");
    } catch (err) {
      // Falha de rede não é credencial errada — dizer isso poupa o usuário de
      // tentar a senha várias vezes achando que errou.
      setError(errorMessage(err, "E-mail ou senha não conferem."));
    } finally {
      setLoading(false);
    }
  };

  return (
    <form
      onSubmit={handleLogin}
      noValidate
      className="flex w-full flex-col gap-4 rounded-3xl border border-ink-100 bg-white p-6 shadow-card sm:p-7"
    >
      {error && (
        <div
          role="alert"
          className="flex animate-fade-in items-start gap-2.5 rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800"
        >
          <MdErrorOutline className="mt-0.5 shrink-0 text-base" />
          <span>{error}</span>
        </div>
      )}

      <div>
        <label htmlFor="email" className="field-label">
          E-mail
        </label>
        <div className="relative">
          <MdEmail aria-hidden className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-400" />
          <input
            id="email"
            type="email"
            autoComplete="email"
            placeholder="voce@email.com"
            className="field pl-11"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
      </div>

      <div>
        <label htmlFor="senha" className="field-label">
          Senha
        </label>
        <div className="relative">
          <MdLock aria-hidden className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-400" />
          <input
            id="senha"
            type={showPassword ? "text" : "password"}
            autoComplete="current-password"
            placeholder="Digite sua senha"
            className="field pl-11 pr-11"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <button
            type="button"
            onClick={() => setShowPassword((visible) => !visible)}
            aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
            className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg p-1.5 text-ink-400 transition hover:bg-ink-50 hover:text-ink-700"
          >
            {showPassword ? <MdVisibilityOff /> : <MdVisibility />}
          </button>
        </div>
      </div>

      <button type="submit" disabled={loading} className="btn-primary mt-1 py-3">
        {loading ? "Entrando…" : "Entrar"}
      </button>

      <p className="mt-1 text-center text-sm text-ink-500">
        Ainda não tem conta?{" "}
        <button
          type="button"
          onClick={() => navigate("/cadastro")}
          className="font-semibold text-emerald-700 underline-offset-4 transition hover:text-emerald-800 hover:underline"
        >
          Criar uma agora
        </button>
      </p>
    </form>
  );
};

export default Form;
