// Formatação de datas, valores e cores usada por todas as telas.
//
// IMPORTANTE sobre datas: a API grava a data escolhida no <input type="date">
// como meia-noite em UTC (`new Date("2026-08-06")` → 2026-08-06T00:00:00Z).
// Se o front formatar isso no fuso local (UTC-3 no Brasil), a tela mostra
// 05/08/2026 — um dia a menos do que o usuário digitou. Por isso todas as
// leituras aqui são feitas em UTC: a data é um dia do calendário, não um
// instante no tempo.

const MONTHS_SHORT = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"];
const MONTHS_LONG = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
];

/** "1.234,56" — sem o símbolo, para poder compor com um "R$" estilizado à parte. */
export function formatMoney(value: number): string {
  return Number(value || 0).toLocaleString("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

/** "R$ 1.234,56" */
export function formatCurrencyBRL(value: number): string {
  return `R$ ${formatMoney(value)}`;
}

/** Versão curta para eixos de gráfico: "R$ 1,2 mil" / "R$ 3,4 mi". */
export function formatMoneyCompact(value: number): string {
  const abs = Math.abs(value);
  if (abs >= 1_000_000) return `R$ ${(value / 1_000_000).toFixed(1).replace(".", ",")} mi`;
  if (abs >= 1_000) return `R$ ${(value / 1_000).toFixed(1).replace(".", ",")} mil`;
  return `R$ ${Math.round(value)}`;
}

/** "06/08/2026" */
export function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return "—";
  return date.toLocaleDateString("pt-BR", { timeZone: "UTC" });
}

/** "6 ago" */
export function formatDateShort(dateStr: string): string {
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return "—";
  return `${date.getUTCDate()} ${MONTHS_SHORT[date.getUTCMonth()]}`;
}

/** "Agosto de 2026" — rótulo dos grupos do histórico. */
export function formatMonthLabel(dateStr: string): string {
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return "Sem data";
  return `${MONTHS_LONG[date.getUTCMonth()]} de ${date.getUTCFullYear()}`;
}

/** Chave "2026-08" para agrupar lançamentos por mês. */
export function monthKey(dateStr: string): string {
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return "0000-00";
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}`;
}

/** "2026-08-06" de hoje, no formato aceito pelo <input type="date">. */
export function todayInputValue(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/**
 * Diferença em dias de calendário entre hoje e uma data limite.
 * Positivo = ainda faltam dias; 0 = vence hoje; negativo = já venceu.
 */
export function daysUntil(dateStr: string): number {
  const target = new Date(dateStr);
  if (isNaN(target.getTime())) return 0;

  const now = new Date();
  const todayUTC = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate());
  const targetUTC = Date.UTC(target.getUTCFullYear(), target.getUTCMonth(), target.getUTCDate());

  return Math.round((targetUTC - todayUTC) / 86_400_000);
}

/** Texto amigável de prazo: "12 dias restantes", "Vence hoje", "Venceu há 3 dias". */
export function deadlineLabel(dateStr: string): string {
  const days = daysUntil(dateStr);
  if (days === 0) return "Vence hoje";
  if (days === 1) return "Vence amanhã";
  if (days > 1) return `${days} dias restantes`;
  if (days === -1) return "Venceu ontem";
  return `Venceu há ${Math.abs(days)} dias`;
}

/** Meses de calendário (mínimo 1) até a data limite — base do "ritmo mensal". */
export function monthsUntil(dateStr: string): number {
  return Math.max(1, Math.ceil(daysUntil(dateStr) / 30));
}

// ── Cores de categoria ─────────────────────────────────────────────────────
// A API já guarda uma cor por categoria (Category.color, 6 dígitos hex sem "#"),
// mas o front nunca usava esse dado. Agora usamos — e categorias criadas pelo
// usuário, que vêm sem cor, recebem um tom estável derivado do próprio nome.

const FALLBACK_COLORS = [
  "0EA5E9", "8B5CF6", "EC4899", "F97316", "14B8A6",
  "6366F1", "84CC16", "F43F5E", "06B6D4", "A855F7",
];

export function categoryColor(category?: { name?: string; color?: string | null } | null): string {
  if (category?.color) return `#${category.color.replace("#", "")}`;

  const name = category?.name || "Outros";
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = (hash * 31 + name.charCodeAt(i)) >>> 0;
  }
  return `#${FALLBACK_COLORS[hash % FALLBACK_COLORS.length]}`;
}

/** Iniciais da categoria para o marcador colorido da lista ("Alimentação" → "AL"). */
export function categoryInitials(name?: string | null): string {
  const clean = (name || "?").trim();
  const words = clean.split(/\s+/).filter(Boolean);
  if (words.length >= 2) return (words[0][0] + words[1][0]).toUpperCase();
  return clean.slice(0, 2).toUpperCase();
}
