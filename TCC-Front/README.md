# TCC Frontend

Este é o repositório do Frontend do Trabalho de Conclusão de Curso (TCC). O projeto foi desenvolvido utilizando as tecnologias mais modernas do ecossistema JavaScript para garantir alta performance e uma excelente experiência de desenvolvimento.

## 🚀 Tecnologias Utilizadas

- **[React](https://react.dev/)** (v19) - Biblioteca JavaScript para construção de interfaces de usuário.
- **[Vite](https://vitejs.dev/)** - Ferramenta de build extremamente rápida e servidor de desenvolvimento.
- **[TypeScript](https://www.typescriptlang.org/)** - Superset do JavaScript que adiciona tipagem estática.
- **[Tailwind CSS](https://tailwindcss.com/)** - Framework CSS Utility-first para estilização ágil.
- **[React Router DOM](https://reactrouter.com/)** - Roteamento declarativo para React.
- **[React Icons](https://react-icons.github.io/react-icons/)** - Ícones populares e customizáveis.

## 📋 Pré-requisitos

Para rodar este projeto localmente, você precisará ter instalado em sua máquina:

- [Node.js](https://nodejs.org/en/) (Versão 18 ou superior recomendada)
- npm (Gerenciador de pacotes padrão do Node, já incluso na instalação do Node.js)

## 🛠️ Como rodar o projeto localmente

Siga o passo a passo abaixo para executar o projeto em sua máquina:

1. **Abra o terminal e acesse a pasta do projeto (Frontend)**:
   ```bash
   cd caminho/para/a/pasta/Frontend
   ```

2. **Instale as dependências**:
   Execute o comando abaixo para baixar todas as bibliotecas necessárias para o projeto funcionar:
   ```bash
   npm install
   ```

3. **Inicie o servidor de desenvolvimento**:
   Após a instalação ser concluída, inicie o projeto com:
   ```bash
   npm run dev
   ```

4. **Acesse o projeto no navegador**:
   Após executar o comando acima, o terminal exibirá um link local. Geralmente será:
   ```
   http://localhost:5173/
   ```
   Basta clicar no link ou copiá-lo e colar no seu navegador para ver o projeto rodando.

## 📦 Scripts Disponíveis

No diretório do projeto, você pode rodar os seguintes comandos:

- `npm run dev`: Roda o aplicativo em modo de desenvolvimento. A página será recarregada se você fizer edições.
- `npm run build`: Cria a versão de produção do aplicativo na pasta `dist`, otimizada para melhor performance.
- `npm run lint`: Roda o ESLint para encontrar e reportar erros e problemas no código.
- `npm run preview`: Inicia um servidor web local para visualizar a versão de produção gerada no passo anterior.

## 📁 Estrutura de Pastas

- `src/`: Contém todo o código-fonte da aplicação (componentes, páginas, assets visuais, rotas, etc).
- `public/`: Contém arquivos estáticos que não precisam passar pelo processo de build, como ícones e imagens cruas.
- `index.html`: Arquivo HTML principal que serve como ponto de entrada para a aplicação React.
- `vite.config.ts`, `tailwind.config.js`, `tsconfig.json`: Arquivos de configuração das ferramentas utilizadas.
