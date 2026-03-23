# Orchestrator Engine: Documentação Técnica Completa (v2.0)

## 1. Visão Geral do Sistema

O **Orchestrator Engine v2.0** é um sistema de alta criticidade e automação construído como um **Cloudflare Worker**. Sua função primária é garantir a alta disponibilidade (HA) de uma infraestrutura de comunicação baseada em túneis do Cloudflare (Cloudflared Tunnels), operando em um esquema de rotação contínua baseada em quantidade para evitar quedas e prover resiliência.

**Novidades v2.0:**
- G-Accounts como combustível com rotação por quantidade (20 Actions simultâneas)
- Duas funcionalidades: A-Server (VM principal) e A-Stream (Operacional)
- Cadastro simplificado (apenas ghp_token) - Worker cria repo + .yml automaticamente
- Sistema de nomes sem IA (Deck + Hash Sequenciais)
- Mimmetismo (repositórios falsos com pool de ZIPs)
- Inicialização inteligente do A-Server
- Foco em segurança e proteção contra vazamentos

O sistema foi desenhado para ser "sem servidor" no sentido tradicional, utilizando uma combinação inteligente de tecnologias para criar um ambiente de execução dinâmico e efêmero.

### Tecnologias Principais:

- **Cloudflare Workers:** Como o cérebro (control plane) da operação, executando a lógica de orquestração.
- **Turso DB (libSQL):** Banco de dados distribuído para persistência de estado, incluindo o inventário de contas, estado da rotação e logs de segurança.
- **GitHub Actions:** Utilizado como o ambiente de execução "servidor" onde os túneis do Cloudflare são efetivamente iniciados. Cada "VM" é, na verdade, um job do GitHub Actions.
- **Deck de Nomes:** Sistema de geração de nomes baseado em array predefinido + hash sequenciais (sem IA).
- **Cloudflare API:** Para a manipulação em tempo real de registros DNS, que é o mecanismo central da rotação de tráfego.
- **Mimmetismo:** Repositórios falsos com README.md, package.json e arquivos de código para parecerem projetos legítimos.

---

## 2. Arquitetura e Fluxo de Dados

### 2.1. Componentes Principais

- **Cloudflare Worker (`src/index.ts`):** O orquestrador central. Possui dois pontos de entrada: `fetch` para a API HTTP e `scheduled` para a tarefa de rotação (CRON).
- **Turso Database:** Armazena três tipos de informação:
    1. `gaccounts`: O "combustível" do sistema, um inventário de contas do GitHub com tokens e metadados. Suporta A-Server e A-Stream.
    2. `orchestrator_state`: O estado atual da rotação (qual túnel está ativo e quando a última rotação ocorreu).
    3. `login_attempts`: Para controle de segurança e prevenção de brute-force na UI.
    4. `mimetic_repos` (opcional): Pool de URLs de repositórios falsos para mimetismo.
    5. `rotation_logs`: Logs de rotações para debugging.
- **GitHub Actions:** Atua como a "VM" descartável. Existem dois tipos:
    - **A-Server:** VM principal (1 por conta) - Roda tunnel Cloudflare
    - **A-Stream:** Operacional (19 por conta) - Executa tarefas operacionais
- **Cloudflare DNS:** Um registro CNAME específico é o alvo da operação, sendo atualizado para apontar para o hostname do túnel ativo no momento.

### 2.2. Fluxo de Rotação de Túnel (CRON - Atualizado)

Esta é a "engrenagem" principal do sistema, detalhada em `src/handlers/scheduled.ts` e configurada para rodar a cada minuto em `wrangler.jsonc`.

1.  **Gatilho:** O CRON do Cloudflare Worker é acionado.
2.  **Verificação de Estado:** O Worker consulta a tabela `orchestrator_state` no Turso para obter a `last_rotation` (timestamp da última rotação) e o `active_tunnel` (ex: "Galio").
3.  **Decisão de Rotação (Atualizada):** O sistema verifica se há contas com slots disponíveis. Se todas as contas do tipo 'server' estão cheias, busca conta do tipo 'stream'.
4.  **Seleção de Conta:** Uma conta saudável (`GAccount`) é selecionada do banco de dados (com `slots_used < slots_max`).
5.  **Determinação de Tipo de Action:** Baseado em `account_type`, decide se rodará A-Server ou A-Stream.
6.  **Geração de Payload:** O Worker gera comandos shell baseados no tipo de Action.
7.  **Disparo do GitHub Action:** Uma requisição `POST` é enviada para a API do GitHub (`workflow_dispatch`), acionando o workflow no repositório da conta selecionada. O payload da requisição contém os comandos codificados em Base64.
8.  **Health Check (Sentinela):** Após disparar a Action, o Worker entra em um loop de verificação. Ele envia requisições `fetch` para o hostname direto do novo túnel (ex: `https://<uuid-borio>.cfargotunnel.com`). O objetivo é confirmar que o túnel está online.
9.  **Troca de DNS (A Virada de Chave):** Se o health check for bem-sucedido, o Worker chama a API da Cloudflare (via `src/lib/cloudflare.ts`) para atualizar o registro CNAME (`DNS_RECORD_ID`), apontando-o para o hostname do novo túnel (`tunnelTarget`).
10. **Atualização de Estado:** O Worker atualiza a tabela `orchestrator_state` com o novo `active_tunnel` e o `last_rotation`. Ele também incrementa os contadores apropriados (`server_actions_count` ou `stream_actions_count`) e atualiza o `last_active` da `GAccount` utilizada.
11. **Falha:** Se o health check falhar após várias tentativas, a rotação é abortada para evitar downtime.

---

## 3. API e Interface do Usuário (UI - Atualizada)

A API e a UI são gerenciadas pelo `src/api/router.ts`.

### 3.1. Cadastro de G-Accounts (NOVO)

**POST /api/accounts/register**

Provisiona uma nova G-Account automaticamente criando repositório e workflow.

**Request:**
```json
{
  "token": "ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
  "account_type": "server"
}
```

**Fluxo de Provisionamento:**
1. Valida o token e obtém o nome de usuário via GitHub API.
2. Gera nomes usando sistema de Deck + Hash (sem IA).
3. Verifica se repositório já existe.
4. Se não existe, cria repositório público.
5. Baixa arquivos de mimetismo do pool (se disponível).
6. Cria workflow .yml (A-Server ou A-Stream).
7. Salva os detalhes no Turso DB.

**Response:**
```json
{
  "success": true,
  "message": "Account provisioned successfully",
  "account": {
    "username": "github-user",
    "repo_name": "CI-Implementation-planner-123",
    "repo_url": "https://github.com/github-user/CI-Implementation-planner-123",
    "workflows": ["ci-build-test-456.yml"],
    "fictional_name": "Alpha",
    "account_type": "server",
    "slots_used": 0,
    "slots_max": 20
  }
}
```

### 3.2. Sistema de Nomes (NOVO)

**Deck de Nomes Base:**
```typescript
const REPO_NAMES = [
  "CI-Implementation-planner",
  "Js-library-json",
  "Builder-cripto-exchange",
  // ... 100+ nomes
];

const WORKFLOW_NAMES = [
  "ci-build-test.yml",
  "interpreter-ci-cd.yml",
  "initial-planner.yml",
  // ... 50+ nomes
];
```

**Lógica de Randomização:**
```typescript
class DeckBasedNameGenerator {
  private repoHash = 0;
  private workflowHash = 0;

  generateRepoName(): string {
    const base = REPO_NAMES[Math.floor(Math.random() * REPO_NAMES.length)];
    this.repoHash++;
    return `${base}-${this.repoHash}`;
  }
}
```

### 3.3. Endpoints da API Atualizados

- `GET /`: Serve a página principal da UI.
- `POST /api/accounts/register`: Provisiona nova G-Account (apenas token).
- `GET /api/accounts`: Lista todas as contas.
- `GET /api/accounts/pool`: Estatísticas do pool de contas.
- `DELETE /api/accounts?username=<user>`: Deleta uma G-Account.
- `POST /api/accounts/:username/reset`: Reseta slots de uma conta.

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
-   `MIMETISM_POOL_URL` (opcional): URLs de arquivos ZIP para mimetismo.

---

## 5. Estrutura do Banco de Dados (Turso - Atualizado)

-   **`gaccounts`** (Atualizada):
    -   `username` (PK): Login do GitHub.
    -   `token`: GitHub PAT.
    -   `repo_owner`: Dono do repositório.
    -   `repo_name`: Nome do repositório gerado.
    -   `repo_url`: URL completa do repositório.
    -   `workflows_json`: String JSON com a lista de nomes de workflows.
    -   `fictional_name`: Um nome fictício para fácil identificação na UI.
    -   `account_type`: Tipo da conta ('server' ou 'stream').
    -   `slots_used`: Contador de quantas vezes a conta foi usada (limite de 20).
    -   `slots_max`: Limite máximo de Actions (20).
    -   `server_actions_count`: Contador de A-Servers rodados.
    -   `stream_actions_count`: Contador de A-Streams rodados.
    -   `last_active`: Timestamp do último uso.
    -   `created_at`: Timestamp de criação.

-   **`orchestrator_state`** (Atualizada):
    -   `key` (PK): A chave do estado.
    -   `value`: O valor associado.
    -   **Novas chaves:**
        - `active_tunnel`: "Galio" ou "Borio"
        - `last_rotation`: Timestamp da última rotação
        - `total_server_actions`: Total de A-Servers rodados
        - `total_stream_actions`: Total de A-Streams rodados

-   **`login_attempts`**:
    -   `ip` (PK): O endereço de IP do cliente.
    -   `attempts`: Número de tentativas de login falhas.
    -   `last_attempt`: Timestamp da última tentativa.

-   **`mimetic_repos`** (Nova - Opcional):
    -   `id`: ID do registro.
    -   `url`: URL do arquivo ZIP.
    -   `repo_name`: Nome do repositório.
    -   `usage_count`: Contador de usos.

-   **`rotation_logs`** (Nova):
    -   `id`: ID do log.
    -   `from_tunnel`: Tunnel anterior.
    -   `to_tunnel`: Tunnel novo.
    -   `account_username`: Username da conta usada.
    -   `action_type`: Tipo de Action ('server' ou 'stream').
    -   `success`: Se a rotação foi bem-sucedida.
    -   `timestamp`: Timestamp da rotação.
    -   `duration_ms`: Duração da rotação.
    -   `error_message`: Mensagem de erro (se falhou).

---

## 6. Distribuição de Actions

### Regra de Distribuição

Por G-Account:
- **1 A-Server** (VM principal)
- **19 A-Streams** (Operacionais)

**Exemplo:**
```
Conta 1 (Server):
├── A-Server[1:1] ← VM principal
└── 19 A-Streams disponíveis

Conta 2 (Server):
├── A-Server[1:1] ← VM principal
└── 19 A-Streams disponíveis
```

---

## 7. Segurança e Mimmetismo

### Princípios de Segurança

1. Nenhum dado sensível nos repositórios
2. ghp_token não é dado crítico (pode ser rotacionado)
3. Tokens armazenados apenas no Turso DB
4. Comandos totalmente silenciados
5. Base64 encoding para comandos shell
6. Logs sem informações sensíveis

### Mimmetismo

Repositórios falsos criados para parecerem projetos legítimos:

- README.md com descrição detalhada
- package.json (fake) com scripts e dependências
- src/ com arquivos de código (fake)
- tests/ com testes (fake)
- .github/workflows/ com workflows adicionais (fake)

**Pool de ZIPs:**
- URLs de arquivos .zip contendo repositórios completos
- Seleção aleatória do pool
- Fallback sem mimetismo se pool indisponível

---

## 8. Documentação

- **[ADDITIONAL_REQUIREMENTS.md](./ADDITIONAL_REQUIREMENTS.md)** - Requisitos adicionais v2.0
- **[planner-updated.md](./planner-updated.md)** - Planejamento atualizado
- **[docs/architecture-updated.md](./docs/architecture-updated.md)** - Arquitetura detalhada v2.0
- **[docs/database-schema-updated.md](./docs/database-schema-updated.md)** - Schema atualizado
- **[docs/api-specification-updated.md](./docs/api-specification-updated.md)** - API atualizada

---

## 9. Migração v1.0 → v2.0

Para atualizar de v1.0 para v2.0:

1. Adicionar colunas na tabela `gaccounts`:
   - `repo_url`
   - `account_type`
   - `slots_max`
   - `server_actions_count`
   - `stream_actions_count`
   - `created_at`

2. Criar novas tabelas:
   - `mimetic_repos` (opcional)
   - `rotation_logs`

3. Adicionar novas chaves em `orchestrator_state`:
   - `total_server_actions`
   - `total_stream_actions`

---

**Última Atualização:** 23/03/2026
**Versão:** 2.0.0
**Status:** Planejamento v2.0 Completo
