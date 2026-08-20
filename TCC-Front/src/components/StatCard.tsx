// Cartão de indicador — o "placar" que abre as telas de resumo. (receita, despesa, saldo do periodo, saldo disponivel)

import type { ReactNode } from "react";

type Tone = "in" | "out" | "balance" | "plan" | "neutral";

const TONES: Record<Tone, { value: string; icon: string; accent: string }> = {
  in: {
    value: "text-emerald-600",
    icon: "bg-emerald-50 text-emerald-600 ring-emerald-100",
    accent: "from-emerald-400 to-emerald-200",
  },
  out: {
    value: "text-rose-600",
    icon: "bg-rose-50 text-rose-600 ring-rose-100",
    accent: "from-rose-400 to-rose-200",
  },
  balance: {
    value: "text-ink-900",
    icon: "bg-ink-100 text-ink-700 ring-ink-200",
    accent: "from-ink-400 to-ink-200",
  },
  plan: {
    value: "text-ocean-700",
    icon: "bg-ocean-50 text-ocean-600 ring-ocean-100",
    accent: "from-ocean-400 to-ocean-200",
  },
  neutral: {
    value: "text-ink-700",
    icon: "bg-ink-50 text-ink-500 ring-ink-100",
    accent: "from-ink-300 to-ink-100",
  },
};

type StatCardProps = {
  label: string;
  value: ReactNode;
  tone?: Tone;
  icon?: ReactNode;
  hint?: ReactNode;
  featured?: boolean;
};

export default function StatCard({
  label,
  value,
  tone = "neutral",
  icon,
  hint,
  featured = false,
}: StatCardProps) {
  const style = TONES[tone];

  if (featured) {
    return (
      <div className="relative overflow-hidden rounded-2xl bg-ink-900 p-5 shadow-card-lg">
        <span
          aria-hidden
          className="absolute -right-16 -top-20 h-52 w-52 rounded-full bg-emerald-500/25 blur-3xl"
        />
        <span
          aria-hidden
          className="absolute -bottom-24 -left-10 h-48 w-48 rounded-full bg-ocean-500/20 blur-3xl"
        />

        <div className="relative flex items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-emerald-300/90">
              {label}
            </p>
            <p className="tnum mt-2 font-display text-[1.75rem] font-bold leading-none text-white">
              {value}
            </p>
            {hint && <p className="mt-2.5 text-xs text-ink-200">{hint}</p>}
          </div>
          {icon && (
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white/10 text-xl text-white ring-1 ring-white/15">
              {icon}
            </span>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="group relative overflow-hidden rounded-2xl border border-ink-100 bg-white p-5 shadow-card transition hover:-translate-y-0.5 hover:shadow-card-lg">
      <span
        aria-hidden
        className={`absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r ${style.accent}`}
      />

      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-ink-400">
            {label}
          </p>
          <p
            className={`tnum mt-2 font-display text-[1.6rem] font-bold leading-none ${style.value}`}
          >
            {value}
          </p>
          {hint && <p className="mt-2.5 text-xs text-ink-400">{hint}</p>}
        </div>
        {icon && (
          <span
            className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-xl ring-1 ${style.icon}`}
          >
            {icon}
          </span>
        )}
      </div>
    </div>
  );
}
