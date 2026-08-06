// Tradução de falhas em mensagens que o usuário consegue agir.

/**
 * O fetch() rejeita com TypeError quando a requisição sequer chega ao servidor
 * (API fora do ar, sem rede, CORS). Isso é bem diferente de "credenciais
 * inválidas" ou "valor obrigatório", e merece uma mensagem própria — senão o
 * usuário fica tentando corrigir um formulário que está certo.
 */
export const NETWORK_MESSAGE =
  "Não foi possível falar com o servidor. Verifique se a API está no ar.";

export function errorMessage(error: unknown, fallback: string): string {
  if (error instanceof TypeError) return NETWORK_MESSAGE;
  if (error instanceof Error && error.message) return error.message;
  return fallback;
}
