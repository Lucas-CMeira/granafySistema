// Cabeçalho padrão das telas internas: sobrancelha + título + subtítulo + ação.

import type { ReactNode } from "react";

type PageHeaderProps = {
  eyebrow: string;
  title: ReactNode;
  subtitle: ReactNode;
  action?: ReactNode;
};

export default function PageHeader({ eyebrow, title, subtitle, action }: PageHeaderProps) {
  return (
    <header className="mb-7 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div className="animate-fade-up">
        <p className="mb-2 flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.18em] text-emerald-700">
          <span aria-hidden className="h-px w-6 bg-emerald-400" />
          {eyebrow}
        </p>
        <h1 className="font-display text-3xl font-bold leading-tight text-ink-900 text-balance sm:text-[2.1rem]">
          {title}
        </h1>
        <p className="mt-2 max-w-xl text-sm leading-relaxed text-ink-500">{subtitle}</p>
      </div>

      {action && <div className="shrink-0">{action}</div>}
    </header>
  );
}
