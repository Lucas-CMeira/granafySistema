// Tradução de falhas em mensagens que o usuário consegue agir.

export const NETWORK_MESSAGE =
  "Não foi possível falar com o servidor. Verifique se a API está no ar.";

export function errorMessage(error: unknown, fallback: string): string {
  if (error instanceof TypeError) return NETWORK_MESSAGE;
  if (error instanceof Error && error.message) return error.message;
  return fallback;
}
