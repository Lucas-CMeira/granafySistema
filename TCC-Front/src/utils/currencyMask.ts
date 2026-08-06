// Utilitário de máscara monetária: formata strings de entrada no padrão pt-BR e converte de volta para número.

export function formatCurrency(raw: string): string {
  const digits = raw.replace(/\D/g, "");
  if (!digits) return "";

  const amount = parseInt(digits, 10);
  const reais = Math.floor(amount / 100);
  const cents = amount % 100;

  const reaisFormatted = reais.toLocaleString("pt-BR");
  return `${reaisFormatted},${String(cents).padStart(2, "0")}`;
}

export function parseCurrency(formatted: string): number {
  if (!formatted) return 0;
  const digits = formatted.replace(/\D/g, "");
  if (!digits) return 0;
  return parseInt(digits, 10) / 100;
}
