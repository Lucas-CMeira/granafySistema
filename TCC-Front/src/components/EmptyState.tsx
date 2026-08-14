import type { ReactNode } from "react";

type EmptyStateProps = {
  icon: ReactNode;
  title: string;
  description: string;
  action?: ReactNode;
  tone?: "money" | "plan";
};

export default function EmptyState({
  icon,
  title,
  description,
  action,
  tone = "money",
}: EmptyStateProps) {
  const ring =
    tone === "plan"
      ? "bg-ocean-50 text-ocean-500 ring-ocean-100"
      : "bg-emerald-50 text-emerald-500 ring-emerald-100";

  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-ink-200 bg-ink-50/40 px-6 py-12 text-center">
      <span
        className={`mb-4 flex h-14 w-14 items-center justify-center rounded-2xl text-3xl ring-1 ${ring}`}
      >
        {icon}
      </span>
      <p className="font-display text-base font-semibold text-ink-800">
        {title}
      </p>
      <p className="mt-1.5 max-w-xs text-sm leading-relaxed text-ink-500">
        {description}
      </p>
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
