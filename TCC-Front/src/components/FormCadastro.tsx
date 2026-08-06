import { useNavigate } from "react-router-dom";
import { useMemo, useState } from "react";
import {
  MdPerson,
  MdEmail,
  MdLock,
  MdVisibility,
  MdVisibilityOff,
  MdErrorOutline,
  MdCheck,
} from "react-icons/md";
import API_URL from "../services/api";
import { useToast } from "./toast-context";
import { errorMessage } from "../utils/errors";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const STRENGTH_LEVELS = [
  { label: "Muito curta", bar: "w-1/4 bg-rose-500", text: "text-rose-600" },
  { label: "Fraca", bar: "w-2/4 bg-amber-500", text: "text-amber-600" },
  { label: "Boa", bar: "w-3/4 bg-emerald-500", text: "text-emerald-600" },
  { label: "Forte", bar: "w-full bg-emerald-600", text: "text-emerald-700" },
];

/** Força da senha: comprimento, letras, números e símbolos. Só orienta — não bloqueia. */
function passwordStrength(password: string) {
  let score = 0;
  if (password.length >= 6) score++;
  if (password.length >= 10) score++;
  if (/[a-zA-Z]/.test(password) && /\d/.test(password)) score++;
  if (/[^a-zA-Z0-9]/.test(password)) score++;

  return STRENGTH_LEVELS[Math.max(0, Math.min(score, STRENGTH_LEVELS.length) - 1)];
}

const FormCadastro = () => {
  const navigate = useNavigate();
  const toast = useToast();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const strength = useMemo(() => passwordStrength(password), [password]);

  // Validações em tempo real: o usuário descobre o problema enquanto digita,
  // e não só depois de clicar em "Criar conta".
  const emailInvalid = email.length > 0 && !EMAIL_REGEX.test(email);
  const passwordShort = password.length > 0 && password.length < 6;
  const passwordsMatch = confirmPassword.length > 0 && password === confirmPassword;
  const passwordsDiffer = confirmPassword.length > 0 && password !== confirmPassword;

  const canSubmit =
    name.trim().length > 0 &&
    EMAIL_REGEX.test(email) &&
    password.length >= 6 &&
    password === confirmPassword;

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!canSubmit) {
      setError("Revise os campos destacados antes de continuar.");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(`${API_URL}/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), email: email.trim(), password }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => null);
        throw new Error(data?.message || "Não foi possível criar a conta.");
      }

      toast.success("Conta criada. Entre com seu e-mail e senha.");
      navigate("/login");
    } catch (err) {
      setError(errorMessage(err, "Não foi possível criar a conta."));
    } finally {
      setLoading(false);
    }
  };

  return (
    <form
      onSubmit={handleRegister}
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
        <label htmlFor="name" className="field-label">
          Nome
        </label>
        <div className="relative">
          <MdPerson aria-hidden className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-400" />
          <input
            id="name"
            type="text"
            autoComplete="name"
            placeholder="Como podemos te chamar?"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            className="field pl-11"
          />
        </div>
      </div>

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
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            aria-invalid={emailInvalid}
            className={`field pl-11 ${emailInvalid ? "border-rose-300 focus:border-rose-500 focus:ring-rose-500/15" : ""}`}
          />
        </div>
        {emailInvalid && <p className="mt-1.5 text-xs text-rose-600">Formato de e-mail inválido.</p>}
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
            autoComplete="new-password"
            placeholder="Pelo menos 6 caracteres"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            aria-invalid={passwordShort}
            className={`field pl-11 pr-11 ${passwordShort ? "border-rose-300 focus:border-rose-500 focus:ring-rose-500/15" : ""}`}
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

        {password && (
          <div className="mt-2 flex items-center gap-2.5">
            <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-ink-100">
              <span className={`block h-full rounded-full transition-all duration-300 ${strength.bar}`} />
            </span>
            <span className={`shrink-0 text-xs font-semibold ${strength.text}`}>{strength.label}</span>
          </div>
        )}
      </div>

      <div>
        <label htmlFor="confirmPassword" className="field-label">
          Repetir senha
        </label>
        <div className="relative">
          <MdLock aria-hidden className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-400" />
          <input
            id="confirmPassword"
            type={showPassword ? "text" : "password"}
            autoComplete="new-password"
            placeholder="Digite a senha de novo"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            aria-invalid={passwordsDiffer}
            className={`field pl-11 pr-11 ${
              passwordsDiffer ? "border-rose-300 focus:border-rose-500 focus:ring-rose-500/15" : ""
            } ${passwordsMatch ? "border-emerald-300" : ""}`}
          />
          {passwordsMatch && (
            <MdCheck aria-hidden className="absolute right-3.5 top-1/2 -translate-y-1/2 text-emerald-600" />
          )}
        </div>
        {passwordsDiffer && <p className="mt-1.5 text-xs text-rose-600">As senhas não são iguais.</p>}
      </div>

      <button type="submit" disabled={loading} className="btn-primary mt-1 py-3">
        {loading ? "Criando conta…" : "Criar minha conta"}
      </button>

      <p className="mt-1 text-center text-sm text-ink-500">
        Já tem conta?{" "}
        <button
          type="button"
          onClick={() => navigate("/login")}
          className="font-semibold text-emerald-700 underline-offset-4 transition hover:text-emerald-800 hover:underline"
        >
          Entrar
        </button>
      </p>
    </form>
  );
};

export default FormCadastro;
