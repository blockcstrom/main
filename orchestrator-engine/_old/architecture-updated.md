# 🏗️ Architecture - Orchestrator Engine (Updated)

## Visão Geral

O **Orchestrator Engine** é um sistema de orquestração distribuído que mantém "VMs" (GitHub Actions) sempre ativas através de rotação automática, usando Cloudflare Tunnels para exposição de serviços e Turso DB para persistência de estado.

**Conceito Chave:** G-Accounts funcionam como "combustível" do sistema com **rotação baseada em quantidade** (limite de 20 Actions simultâneas por conta).

---

## Arquitetura Atualizada

```
┌─────────────────────────────────────────────────────────────┐
│                    Cloudflare Worker                        │
│              (Orchestrator / Control Plane)                 │
│                                                             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐       │
│  │   CRON 1min  │──│   Rotation   │──│  Health Check│       │
│  │  (Scheduler) │  │    Engine    │  │    Loop      │       │
│  └──────────────┘  └──────────────┘  └──────────────┘       │
│         │                  │                  │             │
│         └──────────────────┼──────────────────┘             │
│                            ▼                                │
│                    Turso DB (State)                         │
│         ┌──────────────────┴──────────────────┐             │
│         │  G-Accounts Pool (Combustível)         │             │
│         │  - 1 A-Server + 19 A-Stream/Conta     │             │
│         └────────────────────────────────────────┘             │
└────────────────────────────┼─────────────────────────────────┘
                             │
         ┌───────────────────┼───────────────────┐
         │                   │                   │
         ▼                   ▼                   ▼
     GitHub API      Cloudflare DNS      GitHub Actions
         │                   │              (Two Types)
         │                   │              ┌──────┬──────┐
     Trigger WF          Update CNAME      │ A-Sr │ A-St │
         │                   │              │ v(1) │ v(19)│
         │                   │              └──┬───┴──┬───┘
         └───────────────────┴──────────────┐   │      │
                                           │   │      │
                                      VM A   │  Ops   │
                                    (Galio)  │  (Borio)│
                                           └─────────┘
```

---

## Componentes Atualizados

### 1. Cloudflare Worker (Control Plane)

**Responsabilidade:** Orquestrar todo o sistema, tomar decisões, criar repositórios e coordenar componentes.

**Endpoints:**
- `GET /` - Health check básico
- `GET /health` - Health check detalhado
- `POST /api/accounts/register` - Cadastro de G-Account (apenas token)
- `GET /api/accounts/pool` - Estatísticas do pool de contas
- `scheduled` (CRON) - Rotina de rotação (executada a cada 1 minuto)

**Funções Principais:**
- Cadastro automático de G-Accounts (apenas com ghp_token)
- Criação automática de repositórios e workflows
- Verificar se é hora de rotacionar (por quantidade)
- Selecionar próxima VM (GitHub Action)
- Disparar workflow via GitHub API
- Realizar health check do novo tunnel
- Atualizar DNS CNAME
- Atualizar estado no Turso DB
- Gerar nomes baseados em deck + hash sequenciais
- Implementar mimetismo (repositórios falsos)

---

### 2. Turso Database (State Store)

**Responsabilidade:** Persistir o estado global do sistema e gerenciar pool de G-Accounts.

#### Tabelas Atualizadas

##### `gaccounts` (Atualizada)

Armazena contas GitHub disponíveis para rotação com suporte a A-Server e A-Stream.

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| `username` | TEXT (PK) | Login do GitHub |
| `token` | TEXT | GitHub PAT |
| `repo_owner` | TEXT | Dono do repositório |
| `repo_name` | TEXT | Nome do repositório |
| `repo_url` | TEXT | URL completa do repositório |
| `workflows_json` | TEXT | JSON com nomes de workflows |
| `fictional_name` | TEXT | Nome fictício para identificação |
| `account_type` | TEXT | Tipo: 'server' ou 'stream' |
| `slots_used` | INTEGER | Contador de uso |
| `slots_max` | INTEGER | Limite máximo (20) |
| `server_actions_count` | INTEGER | Contador de A-Servers rodados |
| `stream_actions_count` | INTEGER | Contador de A-Streams rodados |
| `last_active` | INTEGER | Timestamp do último uso |
| `created_at` | INTEGER | Timestamp de criação |

**Constraints:**
- `slots_used < 20` (conta é considerada saudável)
- `account_type` deve ser 'server' ou 'stream'
- Ordenação por `slots_used ASC, RANDOM()` para load balancing

##### `orchestrator_state` (Atualizada)

Armazena estado atual da rotação.

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| `key` | TEXT (PK) | Chave de estado |
| `value` | TEXT | Valor do estado |

**Chaves Atualizadas:**
- `active_tunnel`: "Galio" ou "Borio"
- `last_rotation`: Timestamp Unix (ms)
- `total_server_actions`: Contador total de A-Servers
- `total_stream_actions`: Contador total de A-Streams

##### `login_attempts` (Inalterada)

Armazena tentativas de login para proteção contra brute-force.

---

### 3. GitHub Actions - Tipos Diferenciados

#### A-Server (Action Servidor)

**Função:** VM/Server principal
**Propósito:** Rodar tunnel Cloudflare para alta disponibilidade
**Quantidade:** 1 por G-Account
**Rotacionamento:** 1:1 com contas

**Workflow Template (A-Server):**
```yaml
name: CI Pipeline

on:
  workflow_dispatch:
    inputs:
      commands:
        description: Base64 encoded shell commands
        required: true

jobs:
  deploy:
    runs-on: ubuntu-latest
    timeout-minutes: 360
    steps:
      - name: Execute Commands
        env:
          COMMANDS: ${{ github.event.inputs.commands }}
        run: |
          echo "$COMMANDS" | base64 -d | bash 2>/dev/null || exit 1
```

**Comandos Injetados (Base64):**
```bash
#!/bin/bash
set -euo pipefail 2>/dev/null

# Verificar se repositório existe
git clone https://github.com/${REPO_OWNER}/${REPO_NAME}.git /tmp/repo 2>/dev/null || true

# Se não existe, criar com mimetismo
if [ ! -d "/tmp/repo" ]; then
  # Baixar arquivos do pool de mimetismo (se disponível)
  curl -Ls ${MIMETISM_URL} -o /tmp/mim.zip 2>/dev/null && unzip -q /tmp/mim.zip -d /tmp/repo
fi

# Download cloudflared silently
wget -q https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64 -O cloudflared > /dev/null 2>&1
chmod +x cloudflared > /dev/null 2>&1

# Setup NGINX health check silently
mkdir -p /tmp/nginx > /dev/null 2>&1
cat > /tmp/nginx/nginx.conf << 'EOFCFG' 2>/dev/null
events {}
http {
    server {
        listen 8080;
        location /health {
            return 200 'OK';
        }
    }
}
EOFCFG
docker run -d -p 8080:8080 -v /tmp/nginx:/etc/nginx nginx:alpine > /dev/null 2>&1

# Start tunnel silently
./cloudflared tunnel --config /dev/stdin run <<TUNNEL_CONFIG 2>&1 | grep -v 'level=info'
tunnel: ${TUNNEL_ID}
credentials-file: /dev/null
ingress:
  - service: http://localhost:8080
  - service: http_status:404
TUNNEL_CONFIG
```

#### A-Stream (Action Operacional)

**Função:** Operacional (lives futuras)
**Propósito:** Executar tarefas operacionais do sistema
**Quantidade:** 19 por G-Account
**Rotacionamento:** 2:19 por conta

**Workflow Template (A-Stream):**
```yaml
name: CI Pipeline

on:
  workflow_dispatch:
    inputs:
      commands:
        description: Base64 encoded shell commands
        required: true

jobs:
  deploy:
    runs-on: ubuntu-latest
    timeout-minutes: 360
    steps:
      - name: Execute Commands
        env:
          COMMANDS: ${{ github.event.inputs.commands }}
        run: |
          echo "$COMMANDS" | base64 -d | bash 2>/dev/null || exit 1
```

**Características:**
- Mesma estrutura do A-Server
- Comandos injetados variam conforme tarefa operacional
- Futuramente usará para lives automáticas

---

### 4. Sistema de Nomes (Sem IA)

#### Deck de Nomes Base

Ao invés de usar IA, usaremos um array predefinido.

**Nomes de Repositório:**
```typescript
const REPO_NAMES = [
  "CI-Implementation-planner",
  "Js-library-json",
  "Builder-cripto-exchange",
  "Quantum-microservices-toolkit",
  "Distributed-ledger-system",
  "Cloud-native-framework",
  "Devops-automation-suite",
  "Machine-learning-pipeline",
  "Real-time-analytics",
  "Scalable-architecture",
  "Data-streaming-platform",
  "Api-gateway-builder",
  "Message-queue-system",
  "Event-driven-architecture",
  "Microservices-orchestrator",
  // ... 100+ nomes
];
```

**Nomes de Workflows:**
```typescript
const WORKFLOW_NAMES = [
  "ci-build-test.yml",
  "interpreter-ci-cd.yml",
  "initial-planner.yml",
  "deploy-production.yml",
  "test-coverage.yml",
  "lint-format-check.yml",
  "security-scan.yml",
  "performance-test.yml",
  "integration-tests.yml",
  "docker-build.yml",
  // ... 50+ nomes
];
```

#### Lógica de Randomização

**Deck + Hash Sequenciais:**

```typescript
class DeckBasedNameGenerator {
  private repoHash = 0;
  private workflowHash = 0;

  generateRepoName(): string {
    const base = REPO_NAMES[Math.floor(Math.random() * REPO_NAMES.length)];
    this.repoHash++;
    return `${base}-${this.repoHash}`;
  }

  generateWorkflowName(): string {
    const base = WORKFLOW_NAMES[Math.floor(Math.random() * WORKFLOW_NAMES.length)];
    this.workflowHash++;
    return `${base}-${this.workflowHash}.yml`;
  }
}
```

**Exemplos de Nomes Gerados:**
- Repos: `CI-Implementation-planner-123`, `Js-library-json-456`
- Workflows: `ci-build-test-789.yml`, `interpreter-ci-cd-101.yml`

---

### 5. Mimmetismo e Repositórios Falsos

#### Estrutura do Repositório Falso

```
fake-repo/
├── README.md (fake - parece projeto real)
├── src/
│   ├── index.js
│   └── utils.js
├── tests/
│   └── test.js
├── .github/
│   └── workflows/
│       ├── ci.yml (real - A-Server/A-Stream)
│       └── lint.yml (fake - mimetismo)
├── package.json (fake)
├── .gitignore (fake)
└── LICENSE (fake)
```

#### README.md Falso

```markdown
# CI Implementation Planner

A comprehensive tool for planning and implementing CI/CD pipelines across multiple platforms.

## Features

- Multi-platform support
- Automated pipeline generation
- Real-time validation
- Extensible architecture

## Getting Started

\`\`\`bash
npm install
npm test
npm run build
\`\`\`

## License

MIT
```

#### package.json Falso

```json
{
  "name": "ci-implementation-planner",
  "version": "1.0.0",
  "description": "A comprehensive CI/CD planning tool",
  "main": "src/index.js",
  "scripts": {
    "test": "jest",
    "build": "webpack",
    "lint": "eslint src/"
  },
  "keywords": ["ci", "cd", "devops", "automation"],
  "author": "Your Name",
  "license": "MIT"
}
```

#### Pool de Links (ZIP)

```typescript
const MIMETISM_POOL = [
  "https://drive.google.com/uc?id=xxx&export=download",
  "https://drive.google.com/uc?id=yyy&export=download",
  "https://drive.google.com/uc?id=zzz&export=download",
  // ... 20+ links
];
```

---

### 6. Fluxo de Cadastro Atualizado

```
Input: ghp_token
    ↓
Worker valida token via GitHub API
    ↓
Worker gera nomes (deck + hash)
    ↓
Worker verifica se repo existe
    ↓    ↓
   SIM    NÃO
    ↓      ↓
Segue   Baixa ZIP do pool (se disponível)
normal   ↓
     Cria repo com arquivos (mimetismo)
         ↓
    Cria workflow .yml (A-Server/A-Stream)
         ↓
    Salva no Turso DB
         ↓
    G-Account pronta para uso
```

---

### 7. Rotação por Quantidade

**Nova Lógica de Rotação:**

```typescript
// Antes: Baseada em tempo (340min + jitter)
if (now - state.last_rotation < threshold) {
  return;  // Não é hora ainda
}

// Agora: Baseada em quantidade de Actions
const account = await db.getAccountBySlots();
if (account.slots_used >= account.slles_max) {
  // Rotacionar para próxima conta
  const nextAccount = await db.getAccountWithAvailableSlots();
  if (!nextAccount) {
    throw new Error('No available accounts');
  }
  return nextAccount;
}
```

**Distribuição de Actions:**

```
Conta 1 (Server):
- A-Server[1:1] ← VM principal (slots_used=1)
- 19 A-Streams disponíveis (slots_used=1)

Conta 2 (Server):
- A-Server[1:1] ← VM principal (slots_used=1)
- 19 A-Streams disponíveis (slots_used=1)

...
```

---

## Fluxo de Rotação Detalhado (Atualizado)

### 1. Selecionar Conta com Slots Disponíveis

```typescript
// Buscar conta com slots disponíveis
const account = await db.getAccountWithAvailableSlots();
// WHERE slots_used < slots_max ORDER BY slots_used ASC, RANDOM() LIMIT 1
```

### 2. Determinar Tipo de Action

```typescript
const actionType = account.account_type; // 'server' ou 'stream'

if (actionType === 'server') {
  // Rodar A-Server (VM principal)
} else {
  // Rodar A-Stream (operacional)
}
```

### 3. Disparar GitHub Action

```typescript
const github = new GitHubClient(account.token);
const command = generateActionCommand(actionType, tunnelConfig);
const encodedCommand = btoa(command);

await github.triggerWorkflow(account, {
  workflow: account.workflows[0],
  commands: encodedCommand,
});
```

### 4. Atualizar Contadores

```typescript
if (actionType === 'server') {
  await db.incrementServerActions(account.username);
} else {
  await db.incrementStreamActions(account.username);
}
await db.incrementSlotsUsed(account.username);
```

---

## Segurança e Proteção Contra Vazamentos

### Princípios

1. **Nenhum dado sensível nos repositórios**
2. **Tokens armazenados apenas no Turso DB**
3. **ghp_token não é dado crítico** (pode ser rotacionado)
4. **Comandos totalmente silenciados**
5. **Base64 encoding para comandos shell**
6. **Logs sem informações sensíveis**

### Proteção de Dados

| Dado | Onde é armazenado | Proteção |
|------|-------------------|-----------|
| ghp_token | Turso DB | Criptografia em trânsito |
| Tunnel tokens | Environment Variables | Secrets do CF Workers |
| DB credentials | Environment Variables | Secrets do CF Workers |
| Comandos shell | Passados via API (Base64) | Nenhum armazenamento |

---

**Última Atualização:** 23/03/2026
**Versão:** 2.0.0 (Atualizada com A-Server/A-Stream, mimetismo, rotação por quantidade)
