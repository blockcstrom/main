# 🏗️ Architecture - Orchestrator Engine (Updated v2.1)

## Visão Geral

O **Orchestrator Engine v2.1** é um sistema de orquestração distribuído que mantém "VMs" (GitHub Actions) sempre ativas através de rotação automática, usando Cloudflare Tunnels para exposição de serviços e Turso DB para persistência de estado.

**Conceito Chave v2.1:** G-Accounts funcionam como "combustível" do sistema com **rotação baseada em quantidade** (limite de 20 Actions simultâneas por conta), onde **cada conta tem 2 repositórios**: 1 A-Server + 1 A-Stream.

---

## Arquitetura Atualizada v2.1

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
│         │  - Cada conta: 2 repos (Server+Stream)      │             │
│         │  - 20 Actions simultâneas por conta       │             │
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
         │                   │              │(1)  │(1)   │
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
- `POST /api/accounts/register` - Cadastro de G-Account (apenas token, cria 2 repos)
- `GET /api/accounts/pool` - Estatísticas do pool de contas
- `scheduled` (CRON) - Rotina de rotação (executada a cada 1 minuto)

**Funções Principais:**
- Cadastro automático de G-Accounts (apenas com ghp_token)
- Criação automática de 2 repositórios + 2 workflows
- Verificar se é hora de rotacionar (por quantidade)
- Selecionar próxima VM (GitHub Action)
- Disparar workflow via GitHub API
- Realizar health check do novo tunnel
- Atualizar DNS CNAME
- Atualizar estado no Turso DB
- Gerar nomes baseados em 2 decks separados (Repos + YMLs)
- Implementar mimetismo (repositórios falsos)

---

### 2. Turso Database (State Store)

**Responsabilidade:** Persistir o estado global do sistema e gerenciar pool de G-Accounts.

#### Tabelas Atualizadas v2.1

##### `gaccounts` (Atualizada v2.1)

Armazena contas GitHub com **2 repositórios cada**: 1 A-Server + 1 A-Stream.

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| `username` | TEXT (PK) | Login do GitHub |
| `token` | TEXT | GitHub PAT |
| `repo_owner` | TEXT | Dono do repositório |
| `server_repo_name` | TEXT | Nome do repositório A-Server |
| `server_repo_url` | TEXT | URL do repositório A-Server |
| `server_workflow_name` | TEXT | Nome do workflow A-Server |
| `stream_repo_name` | TEXT | Nome do repositório A-Stream |
| `stream_repo_url` | TEXT | URL do repositório A-Stream |
| `stream_workflow_name` | TEXT | Nome do workflow A-Stream |
| `fictional_name` | TEXT | Nome fictício para identificação |
| `slots_used` | INTEGER | Contador de uso |
| `slots_max` | INTEGER | Limite máximo (20) |
| `server_actions_count` | INTEGER | Contador de A-Servers rodados |
| `stream_actions_count` | INTEGER | Contador de A-Streams rodados |
| `last_active` | INTEGER | Timestamp do último uso |
| `created_at` | INTEGER | Timestamp de criação |

**MUDANÇA v2.1:** Removida `account_type` - cada conta tem ambos A-Server e A-Stream.

**Constraints:**
- `slots_used < 20` (conta é considerada saudável)
- Ordenação por `slots_used ASC, RANDOM()` para load balancing

##### `orchestrator_state` (Atualizada)

Armazena estado atual da rotação.

---

### 3. GitHub Actions - Tipos Diferenciados

#### A-Server (Action Servidor)

**Função:** VM/Server principal
**Propósito:** Rodar tunnel Cloudflare para alta disponibilidade
**Quantidade:** 1 repositório por G-Account
**Rotacionamento:** Qualquer conta pode rodar A-Server

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

#### A-Stream (Action Operacional)

**Função:** Operacional (lives futuras)
**Propósito:** Executar tarefas operacionais do sistema
**Quantidade:** 1 repositório por G-Account
**Rotacionamento:** Qualquer conta pode rodar A-Stream

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

---

### 4. Sistema de Nomes (v2.1 - Sem IA)

#### Dois Decks Separados

**Deck 1: Core Repo Names** (para nomes de repositórios)
```
Core Repo Names:
- CI
- Builder
- Build
- Cloud
- Cripto
- Microservices
- Distributed
- Quantum
- Real-time
- Scalable
- ...
```

**Deck 2: Core YML Names** (para nomes de workflows)
```
Core YML Names:
- CI
- Security
- Deploy
- Lint
- Format
- Test
- Coverage
- Integration
- Performance
- ...
```

#### Lógica de Randomização

**Deck + Hash Sequenciais (separado para cada deck):**

```typescript
const CORE_REPO_NAMES = [
  "CI", "Builder", "Build", "Cloud", "Cripto",
  "Microservices", "Distributed", "Quantum", "Real-time",
  // ... 100+ nomes
];

const CORE_YML_NAMES = [
  "CI", "Security", "Deploy", "Lint", "Format",
  "Test", "Coverage", "Integration", "Performance",
  // ... 50+ nomes
];

class DeckBasedNameGenerator {
  private repoHash = 0;
  private ymlHash = 0;

  generateServerRepoName(): string {
    const base = CORE_REPO_NAMES[Math.floor(Math.random() * CORE_REPO_NAMES.length)];
    const suffix = ["Pipeline", "Toolkit", "System", "Framework", "Platform"][Math.floor(Math.random() * 5)];
    this.repoHash++;
    return `${base}-${suffix.toLowerCase()}-${this.repoHash}`;
  }

  generateStreamRepoName(): string {
    const base = CORE_REPO_NAMES[Math.floor(Math.random() * CORE_REPO_NAMES.length)];
    const suffix = ["Engine", "Service", "Worker", "Handler", "Processor"][Math.floor(Math.random() * 5)];
    this.repoHash++;
    return `${base}-${suffix.toLowerCase()}-${this.repoHash}`;
  }

  generateServerYmlName(): string {
    const base = CORE_YML_NAMES[Math.floor(Math.random() * CORE_YML_NAMES.length)];
    this.ymlHash++;
    return `${base.toLowerCase()}-server-${this.ymlHash}.yml`;
  }

  generateStreamYmlName(): string {
    const base = CORE_YML_NAMES[Math.floor(Math.random() * CORE_YML_NAMES.length)];
    this.ymlHash++;
    return `${base.toLowerCase()}-stream-${this.ymlHash}.yml`;
  }
}
```

**Exemplos de Nomes Gerados:**
- Repos A-Server: `CI-pipeline-123`, `Builder-toolkit-456`
- Repos A-Stream: `Cloud-engine-789`, `Cripto-service-101`
- YMLs A-Server: `ci-server-456.yml`, `deploy-server-789.yml`
- YMLs A-Stream: `test-stream-101.yml`, `lint-stream-234.yml`

---

### 5. Fluxo de Cadastro Atualizado v2.1

```
Input: ghp_token
    ↓
Worker valida token via GitHub API
    ↓
Worker gera 2 nomes de repositório (A-Server + A-Stream)
    ↓
Worker gera 2 nomes de workflow (A-Server + A-Stream)
    ↓
Worker verifica se repositórios já existem
    ↓    ↓
   SIM    NÃO
    ↓      ↓
Segue   Baixa ZIP do pool (se disponível)
normal   ↓
     Cria/Atualiza 2 repositórios
         ↓
    Cria 2 workflows (A-Server + A-Stream)
         ↓
    Salva no Turso DB
         ↓
    G-Account pronta para uso
```

---

### 6. Rotação por Quantidade (Atualizada)

**Nova Lógica de Rotação:**

```typescript
// Selecionar conta com slots disponíveis
const account = await db.getAccountWithAvailableSlots();
// WHERE slots_used < slots_max ORDER BY slots_used ASC, RANDOM() LIMIT 1

// Determinar tipo de Action (A-Server ou A-Stream)
const actionType = 'server'; // ou 'stream'

// Selecionar repo e workflow correspondentes
const repoName = actionType === 'server' 
  ? account.server_repo_name 
  : account.stream_repo_name;

const workflowName = actionType === 'server'
  ? account.server_workflow_name
  : account.stream_workflow_name;
```

---

## Segurança e Proteção Contra Vazamentos

Mesmo que v2.0.

---

**Última Atualização:** 23/03/2026
**Versão:** 2.1.0 (Atualizada com 2 repos por conta, 2 decks separados, sem account_type)
