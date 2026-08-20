// Moldura das telas de login e cadastro.
//Template (layout padrao para telas de login e cadastro)

import type { ReactNode } from "react";
import Logo from "./Logo";
import Highlight from "./Highlight";

const SAMPLE_ENTRIES = [
  {
    title: "Salário",
    category: "Salário",
    color: "#10B981",
    value: 4200,
    type: "income",
  },
  {
    title: "Supermercado",
    category: "Alimentação",
    color: "#F59E0B",
    value: 386.9,
    type: "expenses",
  },
  {
    title: "Aluguel",
    category: "Casa",
    color: "#3B82F6",
    value: 1450,
    type: "expenses",
  },
  {
    title: "Fatura do cartão",
    category: "Cartão",
    color: "#EF4444",
    value: 872.4,
    type: "expenses",
  },
];

const SAMPLE_BALANCE = SAMPLE_ENTRIES.reduce(
  (total, entry) =>
    entry.type === "income" ? total + entry.value : total - entry.value,
  0,
);

const money = (value: number) =>
  value.toLocaleString("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

export default function AuthLayout({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="flex min-h-screen w-full bg-ink-50">
      <div className="relative hidden overflow-hidden bg-ink-950 p-10 text-white lg:flex lg:w-[52%] lg:flex-col lg:justify-between xl:p-14">
        <span
          aria-hidden
          className="absolute -right-24 -top-28 h-96 w-96 rounded-full bg-emerald-500/20 blur-3xl"
        />
        <span
          aria-hidden
          className="absolute -bottom-32 -left-20 h-96 w-96 rounded-full bg-ocean-600/20 blur-3xl"
        />
        <span
          aria-hidden
          className="absolute inset-x-0 top-0 h-1 bg-brand-gradient"
        />

        <Logo
          size="lg"
          plate
          className="relative z-10 animate-fade-up self-start"
        />

        <div className="relative z-10 my-12">
          <h2 className="max-w-lg font-display text-[2.6rem] font-bold leading-[1.1] text-balance animate-fade-up">
            Controle e Saiba exatamente{" "}
            <Highlight tone="money" onDark>
              para onde vai
            </Highlight>{" "}
            o seu dinheiro.
          </h2>

          <p className="mt-4 max-w-md text-[0.95rem] leading-relaxed text-ink-200 animate-fade-up">
            Cada receita e cada despesa em um só lugar — com o saldo recalculado
            a cada lançamento.
          </p>

          <div
            aria-hidden
            className="mt-9 max-w-md rounded-2xl border border-white/10 bg-white/[0.06] p-5 backdrop-blur-sm animate-fade-up"
          >
            <div className="mb-4 flex items-baseline justify-between">
              <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-emerald-300/90">
                Extrato do mês
              </p>
              <p className="text-[11px] text-ink-300"></p>
            </div>

            <ul className="flex flex-col divide-y divide-white/[0.07]">
              {SAMPLE_ENTRIES.map((entry) => (
                <li
                  key={entry.title}
                  className="flex items-center gap-3 py-2.5"
                >
                  <span
                    className="h-8 w-8 shrink-0 rounded-lg ring-1 ring-inset ring-white/10"
                    style={{ backgroundColor: `${entry.color}26` }}
                  >
                    <span
                      className="mx-auto mt-[13px] block h-1.5 w-1.5 rounded-full"
                      style={{ backgroundColor: entry.color }}
                    />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-white">
                      {entry.title}
                    </p>
                    <p className="text-[11px] text-ink-300">{entry.category}</p>
                  </div>
                  <p
                    className={`tnum shrink-0 text-sm font-semibold ${
                      entry.type === "income"
                        ? "text-emerald-300"
                        : "text-rose-300"
                    }`}
                  >
                    {entry.type === "income" ? "+" : "−"} R${" "}
                    {money(entry.value)}
                  </p>
                </li>
              ))}
            </ul>

            <div className="mt-4 flex items-center justify-between rounded-xl bg-emerald-500/15 px-3.5 py-3 ring-1 ring-inset ring-emerald-400/20">
              <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-emerald-200">
                Saldo
              </p>
              <p className="tnum font-display text-lg font-bold text-white">
                R$ {money(SAMPLE_BALANCE)}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-1 flex-col items-center justify-center p-6 sm:p-10">
        <div className="w-full max-w-md animate-fade-up">
          <div className="mb-8 flex justify-center lg:hidden">
            <Logo size="lg" />
          </div>

          <div className="mb-7 text-center lg:text-left">
            <h1 className="font-display text-2xl font-bold text-ink-900">
              {title}
            </h1>
            <p className="mt-1.5 text-sm leading-relaxed text-ink-500">
              {subtitle}
            </p>
          </div>

          {children}
        </div>
      </div>
    </div>
  );
}
