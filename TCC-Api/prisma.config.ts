// Configuração da CLI do Prisma (schema, migrations e datasource).
//
// Atenção: a partir do Prisma 6, a existência deste arquivo faz a CLI PARAR de
// carregar o .env sozinha ("Prisma config detected, skipping environment
// variable loading"). É por isso que o `import "dotenv/config"` abaixo é
// obrigatório — sem ele, DATABASE_URL chega vazia nos comandos de migration.
import "dotenv/config";
import { defineConfig } from "prisma/config";

// `noUncheckedIndexedAccess` faz process.env[...] ser `string | undefined`, e o
// defineConfig exige `string`. Em vez de silenciar com `!`, validamos aqui: se
// a variável faltar, o erro aponta direto para a causa em vez de estourar mais
// tarde dentro do Prisma com uma mensagem de conexão inválida.
const databaseUrl = process.env["DATABASE_URL"];
if (!databaseUrl) {
  throw new Error("[ENV] -> Variável de ambiente não definida: DATABASE_URL");
}

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url: databaseUrl,
  },
});
