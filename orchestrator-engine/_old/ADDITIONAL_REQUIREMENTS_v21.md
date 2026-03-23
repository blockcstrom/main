# 📋 Requisitos Adicionais - Orchestrator Engine (v2.1)

## 🎯 Visão Geral

Este documento descreve requisitos adicionais e modificações importantes ao projeto do Orchestrator Engine (atualizado v2.1).

---

## 🔑 Conceitos Chave Atualizados

### 1. G-Accounts (Combustível do Sistema)

As contas GitHub funcionam como "combustível" para o sistema, com **rotação baseada em quantidade**.

**Regra Principal:**
- Limite de **20 Actions simultâneas** por G-Account
- **Todas as contas podem fazer papel tanto de A-Server quanto de A-Stream**
- **1 repo é A-Server e outro repo é A-Stream** na mesma conta G-Account
- Rotação sempre por quantidade de uso
- Tempo ilimitado de execução (repositórios públicos)

---

## 🏗️ Arquitetura de A-Server e A-Stream

### Nomenclatura e Funções

#### A-Server
- **Função:** VM/Server
- **Propósito:** Rodar tunnel Cloudflare para alta disponibilidade
- **Quantidade:** 1 repositório por G-Account
- **Rotacionamento:** Cada conta pode rodar A-Server

#### A-Stream
- **Função:** Operacional (lives futuras)
- **Propósito:** Executar tarefas operacionais do sistema
- **Quantidade:** 1 repositório por G-Account
- **Rotacionamento:** Cada conta pode rodar A-Stream

### Distribuição Exemplo

```
Conta 1 (G-Account):
├── repo-server (A-Server) ← VM principal
└── repo-stream (A-Stream) ← Operacional

Conta 2 (G-Account):
├── repo-server (A-Server) ← VM principal
└── repo-stream (A-Stream) ← Operacional

Conta 3 (G-Account):
├── repo-server (A-Server) ← VM principal
└── repo-stream (A-Stream) ← Operacional
```

**Nota:** Cada conta tem 2 repositórios (1 A-Server + 1 A-Stream), mas apenas 20 Actions simultâneas no total por conta.

---

## 🏷️ Sistema de Nomes (Sem IA - v2.1)

### Dois Decks Separados

#### Deck 1: Core Repo Names

Array de palavras base para nomes de repositórios:

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
- Api-gateway
- Message-queue
- Event-driven
- Devops
- Automation
- Machine-learning
- Data-streaming
- ...
```

#### Deck 2: Core YML Names

Array de palavras base para nomes de workflows:

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
- Docker
- Health-check
- Monitoring
- Backup
- ...
```

### Lógica de Randomização

**Conceito:** Deck + Hash Sequenciais (para cada deck)

1. **Deck 1 (Repo Names):** Seleciona palavra base + hash sequencial
2. **Deck 2 (YML Names):** Seleciona palavra base + hash sequencial
3. **Combinação:** Cria nomes únicos e realistas

**Exemplo de Implementação:**
```typescript
const CORE_REPO_NAMES = [
  "CI", "Builder", "Build", "Cloud", "Cripto",
  "Microservices", "Distributed", "Quantum", "Real-time",
  "Scalable", "Api-gateway", "Message-queue",
  // ... 100+ nomes
];

const CORE_YML_NAMES = [
  "CI", "Security", "Deploy", "Lint", "Format",
  "Test", "Coverage", "Integration", "Performance",
  "Docker", "Health-check", "Monitoring",
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

### Exemplos de Nomes Gerados

**Repositórios:**
- `CI-pipeline-123` (A-Server)
- `Builder-engine-456` (A-Stream)
- `Cloud-toolkit-789` (A-Server)
- `Cripto-service-101` (A-Stream)

**Workflows:**
- `ci-server-456.yml` (A-Server)
- `deploy-stream-789.yml` (A-Stream)
- `lint-server-101.yml` (A-Server)
- `test-stream-234.yml` (A-Stream)

---

## 🔐 Cadastro e Provisionamento

### Cadastro Simplificado
- **Input:** Apenas `ghp_token` (GitHub Personal Access Token)
- **Worker:** Cria automaticamente 2 repositórios + 2 workflows
- **Nenhum dado manual** além do token

### Fluxo de Provisionamento Atualizado

```
Input: ghp_token
    ↓
Worker valida token
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
    Salva no Turso DB (2 repositórios por conta)
         ↓
    G-Account pronta para uso
```

---

## 🎭 Mimmetismo e Repositórios Falsos

### Objetivo
Criar repositórios que pareçam "orgânicos" e legítimos para evitar detecção.

### Estrutura do Repositório Falso

```
fake-repo-server/
├── README.md (fake - parece projeto real)
├── src/
│   ├── index.js
│   └── utils.js
├── tests/
│   └── test.js
├── .github/
│   └── workflows/
│       ├── ci-server.yml (real - A-Server)
│       └── lint.yml (fake - para mimetismo)
├── package.json (fake)
├── .gitignore (fake)
└── LICENSE (fake)

fake-repo-stream/
├── README.md (fake - parece projeto real)
├── src/
│   ├── index.js
│   └── utils.js
├── tests/
│   └── test.js
├── .github/
│   └── workflows/
│       ├── deploy-stream.yml (real - A-Stream)
│       └── test.yml (fake - para mimetismo)
├── package.json (fake)
├── .gitignore (fake)
└── LICENSE (fake)
```

---

## 🔄 Inicialização Inteligente

### Fluxo de Inicialização

```
A-Server ou A-Stream inicia
    ↓
Verifica: Já tenho repositório correspondente?
    ↓    ↓
   SIM    NÃO
    ↓      ↓
Segue    Puxa ZIP dos arquivos do pool
normal   ↓
    Cria/Atualiza repositório
         ↓
    Uploada arquivos (mimetismo)
         ↓
    Segue inicialização
```

### Autenticação

- Usa **ghp_token** para autenticação
- Token não é dado crítico (pode ser rotacionado)
- Não há dados sensíveis nos arquivos de mimetismo

---

## 🔒 Segurança e Proteção Contra Vazamentos

### Princípios Fundamentais

1. **Nenhum dado sensível nos repositórios**
2. **Tokens são armazenados apenas no Turso DB**
3. **Comandos totalmente silenciados** (`2>/dev/null`)
4. **Base64 encoding** para comandos shell
5. **Logs sem informações sensíveis**

---

## 📊 Schema Atualizado do Turso DB

### Tabela `gaccounts`

```sql
CREATE TABLE gaccounts (
  username TEXT PRIMARY KEY,
  token TEXT NOT NULL,
  repo_owner TEXT NOT NULL,
  server_repo_name TEXT NOT NULL,
  server_repo_url TEXT NOT NULL,
  server_workflow_name TEXT NOT NULL,
  stream_repo_name TEXT NOT NULL,
  stream_repo_url TEXT NOT NULL,
  stream_workflow_name TEXT NOT NULL,
  fictional_name TEXT NOT NULL,
  slots_used INTEGER NOT NULL DEFAULT 0,
  slots_max INTEGER NOT NULL DEFAULT 20,
  server_actions_count INTEGER NOT NULL DEFAULT 0,
  stream_actions_count INTEGER NOT NULL DEFAULT 0,
  last_active INTEGER NOT NULL DEFAULT 0,
  created_at INTEGER NOT NULL DEFAULT 0
);
```

**Colunas Atualizadas:**
- `server_repo_name`: Nome do repositório A-Server
- `server_repo_url`: URL do repositório A-Server
- `server_workflow_name`: Nome do workflow A-Server
- `stream_repo_name`: Nome do repositório A-Stream
- `stream_repo_url`: URL do repositório A-Stream
- `stream_workflow_name`: Nome do workflow A-Stream

**REMOVIDO:** `account_type` (não é mais necessário - cada conta tem ambos)

---

## 🚀 API Atualizada

### Novos Endpoints

#### POST `/api/accounts/register`

Provisiona uma nova G-Account com 2 repositórios (A-Server + A-Stream).

**Request:**
```json
{
  "token": "ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
}
```

**Response:**
```json
{
  "success": true,
  "account": {
    "username": "github-user",
    "repo_owner": "github-user",
    "server_repo_name": "CI-pipeline-123",
    "server_repo_url": "https://github.com/github-user/CI-pipeline-123",
    "server_workflow_name": "ci-server-456.yml",
    "stream_repo_name": "Builder-engine-456",
    "stream_repo_url": "https://github.com/github-user/Builder-engine-456",
    "stream_workflow_name": "deploy-stream-789.yml",
    "fictional_name": "Alpha",
    "slots_used": 0,
    "slots_max": 20
  }
}
```

---

## ✅ Checklist de Novos Requisitos

### Implementação
- [ ] Atualizar schema do Turso DB (remover `account_type`, adicionar campos server/stream)
- [ ] Atualizar gerador de nomes (2 decks separados)
- [ ] Implementar sistema de mimetismo
- [ ] Implementar pool de links
- [ ] Atualizar lógica de cadastro (criar 2 repos por conta)
- [ ] Implementar inicialização inteligente do A-Server/A-Stream
- [ ] Adicionar endpoints de API para registro automático

### Documentação
- [ ] Atualizar `architecture.md` com 2 repos por conta
- [ ] Atualizar `api-specification.md` com novos endpoints
- [ ] Atualizar `database-schema.md` com schema atualizado
- [ ] Atualizar `github-setup.md` com novas regras

### Testes
- [ ] Testar cadastro automático (criar 2 repos)
- [ ] Testar criação de 2 repositórios
- [ ] Testar mimetismo com pool de links
- [ ] Testar rotação por quantidade (20 actions)
- [ ] Testar seleção de repo correto (A-Server vs A-Stream)

---

## 🎯 Impacto na Arquitetura v2.0

### Mudanças Principais

1. **Estrutura de Contas:**
   - v2.0: Contas classificadas como 'server' ou 'stream'
   - v2.1: Cada conta tem ambos (1 repo A-Server + 1 repo A-Stream)

2. **Schema do DB:**
   - v2.0: `account_type` + 1 repo por conta
   - v2.1: Sem `account_type` + 2 repos por conta

3. **Gerador de Nomes:**
   - v2.0: 1 deck + hash
   - v2.1: 2 decks separados (Repos + YMLs) + hash

4. **API de Cadastro:**
   - v2.0: Input: token + account_type
   - v2.1: Input: apenas token (cria ambos)

---

**Última Atualização:** 23/03/2026
**Versão:** 2.1.0
**Status:** Requisitos v2.1 documentados
