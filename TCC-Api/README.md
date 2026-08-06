# GranaFy - Backend (API)

Este é o backend do projeto **GranaFy**, desenvolvido com Node.js, Fastify, TypeScript e Prisma ORM, utilizando um banco de dados PostgreSQL.

## 🚀 Tecnologias Utilizadas

- **Node.js** & **TypeScript**
- **Fastify** (Framework Web rápido e de baixo overhead)
- **Prisma ORM** (Modelagem de dados e migrações)
- **PostgreSQL** (Banco de dados relacional)
- **Bcrypt** (Criptografia de senhas)
- **JWT** (Autenticação)

## 📋 Pré-requisitos

Antes de iniciar, você precisará ter instalado em sua máquina as seguintes ferramentas:
- [Node.js](https://nodejs.org/en/) (Recomendado versão LTS: 18 ou 20)
- [PostgreSQL](https://www.postgresql.org/download/) (Rodando localmente ou via Docker)
- Uma ferramenta de gerenciamento de banco de dados (ex: pgAdmin, DBeaver, etc).

## ⚙️ Como Configurar e Rodar o Projeto Localmente

Siga o passo a passo abaixo para rodar o projeto na sua máquina:

### 1. Instale as dependências

No terminal, acesse a pasta do backend (`api`) e rode o comando:

```bash
npm install
```

### 2. Configure as Variáveis de Ambiente

Crie um arquivo `.env` na raiz da pasta `api` (caso não exista) com base nas configurações abaixo. Um arquivo já deve existir, mas é importante garantir que as informações estejam corretas de acordo com a máquina que for rodar o projeto.

```env
PORT=8081

# A URL do banco de dados tem o seguinte formato:
# postgresql://USUARIO:SENHA@HOST:PORTA/NOME_DO_BANCO
# Altere o usuário (ex: postgres), a senha (ex: Meira@05) e a porta (5432) de acordo com a instalação local.
DATABASE_URL="postgresql://postgres:Meira%4005@localhost:5432/GranaFy"

JWT_SECRET="granafy_super_secret"
```

*Nota: O banco de dados `GranaFy` será acessado através do Prisma. A senha "Meira@05" deve ser alterada se o banco do avaliador utilizar uma senha diferente (vale lembrar de encodar caracteres especiais caso a senha os tenha, ex: `@` vira `%40`).*

### 3. Configurando o Banco de Dados

Com o PostgreSQL rodando e a variável `DATABASE_URL` configurada, execute o comando abaixo para realizar as migrações (isso garantirá que todas as tabelas sejam criadas):

```bash
npx prisma migrate dev
```
*(As tabelas `user`, `entry`, `category` e `goal` serão geradas de acordo com o `schema.prisma`)*

### 4. Rodando o Servidor

Para iniciar o servidor de desenvolvimento:

```bash
npm run dev
```

A API estará rodando em `http://localhost:8081` (ou na porta definida no arquivo `.env`).

---

## 🗄️ Como Acessar o Banco de Dados para Testes

Para que o professor possa acessar e validar o banco de dados facilmente, existem duas alternativas principais:

### Opção 1: Prisma Studio (Recomendado e mais rápido)
O Prisma possui uma interface gráfica excelente direto no navegador, que permite visualizar, criar, editar e excluir dados no banco sem precisar de nenhum software extra de SGBD.
Com o projeto instalado e a API configurada, abra um novo terminal na pasta `api` e rode:

```bash
npx prisma studio
```
O Prisma Studio vai abrir no seu navegador no endereço `http://localhost:5555`. Lá será possível navegar pelas tabelas de Usuários, Lançamentos (Entradas e Saídas), Categorias e Metas.

### Opção 2: Conexão via DBeaver
Caso prefira usar o DBeaver como cliente de banco de dados, basta criar uma nova conexão PostgreSQL com as seguintes credenciais:
- **Host**: `localhost`
- **Porta**: `5432`
- **Database (Banco)**: `GranaFy`
- **Username (Usuário)**: `postgres` (ou conforme sua instalação local)
- **Password (Senha)**: A senha do PostgreSQL instalada na máquina.

---

## 🏗️ Estrutura e Regras de Negócio

O projeto é focado no controle financeiro e conta com os seguintes modelos principais:

- **User**: Para login e gestão do dono da conta (utiliza JWT para autenticação).
- **Entry**: Representa os lançamentos financeiros. Podem ser do tipo `income` (receitas) ou `expenses` (despesas).
- **Category**: Categorias dos lançamentos (cada lançamento precisa de uma categoria, as categorias podem possuir cores de identificação).
- **Goal**: Metas financeiras do usuário com data limite e valor-alvo estipulados.

## 📝 Testando os Endpoints

Você pode utilizar softwares como **Postman**, **Insomnia** ou a extensão **Thunder Client** (VSCode) para fazer requisições nos endpoints locais (por padrão, rodando em `http://localhost:8081`). Lembre-se de passar o *Bearer Token* nas rotas protegidas após o login!
