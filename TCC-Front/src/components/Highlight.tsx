// Destaque de palavras-chave.

import type { ReactNode } from "react";

type Tone = "money" | "plan" | "out" | "warn";
type Variant = "marker" | "underline" | "gradient";

const MARKER: Record<Tone, string> = {
  money:
    "bg-gradient-to-r from-emerald-300/70 via-emerald-200/80 to-emerald-300/50",
  plan: "bg-gradient-to-r from-ocean-200/80 via-ocean-100/90 to-ocean-200/60",
  out: "bg-gradient-to-r from-rose-200/80 via-rose-100/90 to-rose-200/60",
  warn: "bg-gradient-to-r from-amber-200/80 via-amber-100/90 to-amber-200/60",
};

const MARKER_ON_DARK: Record<Tone, string> = {
  money:
    "bg-gradient-to-r from-emerald-400/45 via-emerald-300/35 to-emerald-400/20",
  plan: "bg-gradient-to-r from-ocean-400/45 via-ocean-300/35 to-ocean-400/20",
  out: "bg-gradient-to-r from-rose-400/45 via-rose-300/35 to-rose-400/20",
  warn: "bg-gradient-to-r from-amber-400/45 via-amber-300/35 to-amber-400/20",
};

const RULE: Record<Tone, string> = {
  money: "from-emerald-500 to-emerald-300",
  plan: "from-ocean-500 to-ocean-300",
  out: "from-rose-500 to-rose-300",
  warn: "from-amber-500 to-amber-300",
};

const GRADIENT: Record<Tone, string> = {
  money: "from-emerald-600 to-emerald-400",
  plan: "from-ocean-600 to-emerald-500",
  out: "from-rose-600 to-rose-400",
  warn: "from-amber-600 to-amber-400",
};

type HighlightProps = {
  children: ReactNode;
  tone?: Tone;
  variant?: Variant;
  onDark?: boolean;
  className?: string;
};

export default function Highlight({
  children,
  tone = "money",
  variant = "marker",
  onDark = false,
  className = "",
}: HighlightProps) {
  if (variant === "gradient") {
    return (
      <mark
        className={`bg-gradient-to-r bg-clip-text text-transparent ${GRADIENT[tone]} ${className}`}
      >
        {children}
      </mark>
    );
  }

  if (variant === "underline") {
    return (
      <mark
        className={`relative inline-block bg-transparent ${onDark ? "text-white" : "text-ink-900"} ${className}`}
      >
        <span className="relative z-10">{children}</span>
        <span
          aria-hidden
          className={`absolute inset-x-0 -bottom-0.5 h-[0.22em] origin-left animate-draw-marker rounded-full bg-gradient-to-r ${RULE[tone]}`}
        />
      </mark>
    );
  }

  return (
    <mark
      className={`relative inline-block bg-transparent ${onDark ? "text-white" : "text-ink-900"} ${className}`}
    >
      <span className="relative z-10">{children}</span>
      <span
        aria-hidden
        className={`absolute inset-x-[-0.18em] bottom-[0.04em] top-[0.42em] origin-left -rotate-[0.6deg]
                    animate-draw-marker rounded-[0.25em] ${onDark ? MARKER_ON_DARK[tone] : MARKER[tone]}`}
      />
    </mark>
  );
}
