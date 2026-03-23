# Orchestrator Engine: Documentação Técnica Completa

## 1. Visão Geral do Sistema

O **Orchestrator Engine** é um sistema de alta criticidade e automação construído como um **Cloudflare Worker**. Sua função primária é garantir a alta disponibilidade (HA) de uma infraestrutura de comunicação baseada em túneis do Cloudflare (Cloudflared Tunnels), operando em um esquema de rotação contínua para evitar quedas e prover resiliência.

O sistema foi desenhado para ser "sem servidor" no sentido tradicional, utilizando uma combinação inteligente de tecnologias para criar um ambiente de execução dinâmico e efêmero.

### Tecnologias Principais:

- **Cloudflare Workers:** Como o cérebro (control plane) da operação, executando a lógica de orquestração.
- **Turso DB (libSQL):** Banco de dados distribuído para persistência de estado, incluindo o inventário de contas, estado da rotação e logs de segurança.
- **GitHub Actions:** Utilizado como o ambiente de execução "servidor" onde os túneis do Cloudflare são efetivamente iniciados. Cada "VM" é, na verdade, um job do GitHub Actions.
- **Gemini AI:** Integrado para gerar dinamicamente nomes de repositórios e workflows, uma técnica de "mimetismo" para que a infraestrutura pareça orgânica e menos suscetível a detecção.
- **Cloudflare API:** Para a manipulação em tempo real de registros DNS, que é o mecanismo central da rotação de tráfego.

---

## 2. Arquitetura e Fluxo de Dados

### 2.1. Componentes Principais

- **Cloudflare Worker (`src/index.ts`):** O orquestrador central. Possui dois pontos de entrada: `fetch` para a API HTTP e `scheduled` para a tarefa de rotação (CRON).
- **Turso Database:** Armazena três tipos de informação:
    1. `gaccounts`: O "combustível" do sistema, um inventário de contas do GitHub com tokens e metadados.
    2. `orchestrator_state`: O estado atual da rotação (qual túnel está ativo e quando a última rotação ocorreu).
    3. `login_attempts`: Para controle de segurança e prevenção de brute-force na UI.
- **GitHub Actions:** Atua como a "VM" descartável. O workflow principal é genérico e capaz de executar comandos shell arbitrários passados via `workflow_dispatch`.
- **Cloudflare DNS:** Um registro CNAME específico é o alvo da operação, sendo atualizado para apontar para o hostname do túnel ativo no momento.
- **Gemini AI (`src/lib/ai-generator.ts`):** Uma função utilitária que chama a API do Gemini para criar nomes de projetos e arquivos de workflow com aparência legítima, baseados em temas técnicos complexos.

### 2.2. Fluxo de Rotação de Túnel (CRON)

Esta é a "engrenagem" principal do sistema, detalhada em `src/handlers/scheduled.ts` e configurada para rodar a cada minuto em `wrangler.jsonc`.

1.  **Gatilho:** O CRON do Cloudflare Worker é acionado.
2.  **Verificação de Estado:** O Worker consulta a tabela `orchestrator_state` no Turso para obter a `last_rotation` (timestamp da última rotação) e o `active_tunnel` (ex: "Galio").
3.  **Decisão de Rotação:** O sistema calcula a diferença em minutos desde a última rotação. Se o tempo for maior que um limiar (340 minutos + um valor aleatório "jitter" de 0-10 minutos), o processo de rotação é iniciado.
4.  **Seleção de Conta:** Uma conta saudável (`GAccount`) é selecionada do banco de dados (com `slots_used < 20`).
5.  **Próximo Túnel:** O próximo túnel é determinado (se "Galio" está ativo, o próximo será "Borio", e vice-versa).
6.  **Geração de Payload:** O Worker escolhe aleatoriamente um nome de workflow (ex: `ci.yml`) da lista salva no banco de dados para a conta selecionada. Em seguida, monta os comandos shell para iniciar um contêiner NGINX (para o health check) e o `cloudflared tunnel`. Esses comandos são codificados em Base64.
7.  **Disparo do GitHub Action:** Uma requisição `POST` é enviada para a API do GitHub (`workflow_dispatch`), acionando o workflow no repositório da conta selecionada. O payload da requisição contém os comandos codificados.
8.  **Health Check (Sentinela):** Após disparar a Action, o Worker entra em um loop de verificação. Ele envia requisições `fetch` para o hostname direto do novo túnel (ex: `https://<uuid-borio>.cfargotunnel.com`). O objetivo é confirmar que o túnel está online. Qualquer resposta que não seja um erro de rede ou um status `502`/`503` é considerada um sucesso.
9.  **Troca de DNS (A Virada de Chave):** Se o health check for bem-sucedido, o Worker chama a API da Cloudflare (via `src/lib/cloudflare.ts`) para atualizar o registro CNAME (`DNS_RECORD_ID`), apontando-o para o hostname do novo túnel (`tunnelTarget`).
10. **Atualização de Estado:** O Worker atualiza a tabela `orchestrator_state` com o novo `active_tunnel` e o `last_rotation`. Ele também incrementa o `slots_used` e atualiza o `last_active` da `GAccount` utilizada.
11. **Falha:** Se o health check falhar após várias tentativas, a rotação é abortada para evitar downtime.

---

## 3. API e Interface do Usuário (UI)

A API e a UI são gerenciadas pelo `src/api/router.ts`.

### 3.1. Autenticação

-   **Login (`/login`):** A UI possui uma tela de login (`src/ui/login.ts`) que pede uma "Chave de Acesso".
    -   A senha é comparada no backend usando `timingSafeEqual` para previnir ataques de tempo.
    -   **Proteção Brute-Force:** O sistema rastreia tentativas de login por IP na tabela `login_attempts`. Após 5 tentativas falhas, o IP é bloqueado por 30 minutos.
    -   **Sessão Segura:** Em um login bem-sucedido, um cookie de sessão (`orchestrator_session`) é gerado. O valor do cookie contém dados da sessão assinados com **HMAC-SHA256** (`src/lib/utils.ts`) para garantir que não possa ser forjado.
-   **Middleware (`isAuthenticated`):** Todas as rotas protegidas passam por essa função, que verifica a validade da assinatura do cookie de sessão.

### 3.2. Endpoints da API

-   `GET /`: Serve a página principal da UI (`src/ui/template.ts`), que lista as contas (`gaccounts`) cadastradas.
-   `POST /api/accounts`: Provisiona uma nova conta. Este é o fluxo mais complexo da API:
    1.  Requer um **GitHub Personal Access Token (PAT)** como input.
    2.  A função `provisionNewAccount` (`src/lib/github-init.ts`) é chamada.
    3.  **Fluxo de Provisionamento:**
        -   Valida o token e obtém o nome de usuário do dono do token.
        -   Seleciona um tema técnico aleatório da lista em `src/lib/ai-generator.ts`.
        -   Chama a **API do Gemini** com um prompt específico para gerar um nome de repositório e um nome de arquivo de workflow que sejam contextualmente relevantes ao tema.
        -   Cria um novo repositório público na conta do GitHub do usuário.
        -   Injeta um arquivo de workflow genérico em `.github/workflows/`, que usa `workflow_dispatch` e é capaz de executar comandos shell codificados em Base64.
        -   Salva os detalhes da nova conta (username, token, repo, workflows, nome fictício) no Turso DB.
-   `DELETE /api/accounts?username=<user>`: Deleta uma `gaccount` do banco de dados.

### 3.3. Segurança Adicional

-   **CSRF Protection:** Requisições `POST` e `DELETE` devem incluir o cabeçalho `X-Requested-With: Orchestrator-UI`, mitigando ataques de Cross-Site Request Forgery.

---

## 4. Configuração e Variáveis de Ambiente

As seguintes variáveis de ambiente (secrets) são necessárias para a operação do Worker (`src/index.ts`):

-   `TURSO_DB_URL`: URL de conexão do banco de dados Turso.
-   `TURSO_DB_AUTH_TOKEN`: Token de autenticação para o banco de dados.
-   `BASIC_AUTH_USER`: Nome de usuário para a UI (atualmente fixo, mas a senha é a chave).
-   `BASIC_AUTH_PASS`: A senha ("Chave de Acesso") para a UI.
-   `CLOUDFLARE_ZONE_ID`: O ID da zona DNS no Cloudflare onde o registro será atualizado.
-   `CLOUDFLARE_API_TOKEN`: Token da API do Cloudflare com permissão para editar registros DNS.
-   `DNS_RECORD_ID`: O ID específico do registro CNAME a ser atualizado.
-   `GALIO_TUNNEL_ID`: O hostname do túnel "Galio" (ex: `uuid.cfargotunnel.com`).
-   `GALIO_TOKEN`: O token do túnel "Galio".
-   `BORIO_TUNNEL_ID`: O hostname do túnel "Borio".
-   `BORIO_TOKEN`: O token do túnel "Borio".
-   `GEMINI_API_KEYS`: Uma lista de chaves de API da Gemini, separadas por vírgula, para redundância.

---

## 5. Estrutura do Banco de Dados (Turso)

-   **`gaccounts`**:
    -   `username` (PK): Login do GitHub.
    -   `token`: GitHub PAT.
    -   `repo_owner`: Dono do repositório (geralmente o mesmo que `username`).
    -   `repo_name`: Nome do repositório gerado pela IA.
    -   `workflows_json`: String JSON com a lista de nomes de workflows gerados pela IA.
    -   `fictional_name`: Um nome fictício para fácil identificação na UI.
    -   `slots_used`: Contador de quantas vezes a conta foi usada para uma rotação (limite de 20).
    -   `last_active`: Timestamp do último uso.

-   **`orchestrator_state`**:
    -   `key` (PK): A chave do estado (ex: "active_tunnel", "last_rotation").
    -   `value`: O valor associado (ex: "Galio", "167...").

-   **`login_attempts`**:
    -   `ip` (PK): O endereço de IP do cliente.
    -   `attempts`: Número de tentativas de login falhas.
    -   `last_attempt`: Timestamp da última tentativa.

-   **Migração:** O sistema possui um mecanismo de migração simples e automático em `src/index.ts`, que tenta adicionar novas colunas (`ALTER TABLE`) ao iniciar, ignorando erros se a coluna já existir.