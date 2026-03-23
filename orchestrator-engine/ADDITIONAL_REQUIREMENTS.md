# 📋 Requisitos Adicionais - Orchestrator Engine (v2.2)

## 🎯 Visão Geral

Este documento descreve requisitos adicionais e modificações importantes ao projeto do Orchestrator Engine (atualizado v2.2).

---

## 🔑 Conceitos Chave Atualizados v2.2

### 1. G-Accounts (Combustível do Sistema)

As contas GitHub funcionam como "combustível" para o sistema, com **rotação baseada em quantidade**.

**Regra Principal v2.2:**
- Limite de **20 Actions simultâneas** por G-Account
- **Separação FIXA de slots:**
  - **1 slot para A-Server** (fixo)
  - **19 slots para A-Stream** (fixo)
- Rotação sempre por quantidade de uso
- Tempo ilimitado de execução (repositórios públicos)

---

## 🏗️ Arquitetura de A-Server, A-Stream e A-Boot

### Nomenclatura e Funções v2.2

#### A-Server
- **Função:** VM/Server
- **Propósito:** Rodar tunnel Cloudflare para alta disponibilidade
- **Slots:** 1 fixo por G-Account
- **Rotacionamento:** Nunca 2 A-Servers sequenciais na mesma conta

#### A-Stream
- **Função:** Operacional (lives futuras)
- **Propósito:** Executar tarefas operacionais do sistema
- **Slots:** 19 fixos por G-Account
- **Rotacionamento:** Proporção mínima 1:2 entre contas

#### A-Boot (NOVO)
- **Função:** Inicialização e populaçao de repositórios
- **Propósito:** Baixar ZIPs, extrair e enviar para os 2 repos na primeira inicialização
- **Executado:** Apenas uma vez após criar os repositórios
- **Comportamento:** Nas próximas inicializações, sabe que já está populado

### Proporção de Slots

**Por conta G-Account:**
- 1 A-Server (fixo)
- 19 A-Streams (fixo)

**Entre múltiplas contas (mínimo):**
- 1:2 (1 A-Server para cada 2 A-Streams)
- Ex: Conta 1 (1 A-Server), Conta 2 (2 A-Streams), Conta 3 (1 A-Server)...

**Exemplo:**
```
Conta 1:
├── A-Server (slot 1 de 1)
└── A-Streams (slots 1-19 de 19)

Conta 2:
├── A-Server (slot 1 de 1)
└── A-Streams (slots 1-19 de 19)

Conta 3:
├── A-Server (slot 1 de 1)
└── A-Streams (slots 1-19 de 19)
```

---

## 🏷️ Sistema de Nomes (v2.2 - Sem IA)

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

#### Deck 3: ZIP Names (NOVO v2.2)

Array de palavras base para nomes de arquivos ZIP:

```
Core ZIP Names:
- server
- stream
- common
- bootstrap
- init
- scaffold
- template
- starter
- seed
- assets
- ...
```

### Lógica de Randomização v2.2

**Conceito:** Deck + Hash Sequenciais (para cada deck)

**Deck 1 (Repo Names):** Seleciona palavra base + hash sequencial
**Deck 2 (YML Names):** Seleciona palavra base + hash sequencial
**Deck 3 (ZIP Names):** Seleciona palavra base + hash sequencial (aplicado aos links)

**Exemplo de Implementação v2.2:**
```typescript
const CORE_REPO_NAMES = [
  "CI", "Builder", "Build", "Cloud", "Cripto",
  // ... 100+ nomes
];

const CORE_YML_NAMES = [
  "CI", "Security", "Deploy", "Lint", "Format",
  // ... 50+ nomes
];

const CORE_ZIP_NAMES = [
  "server", "stream", "common", "bootstrap",
  // ... 30+ nomes
];

class DeckBasedNameGenerator {
  private repoHash = 0;
  private ymlHash = 0;
  private zipHash = 0;

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

  generateZipName(): string {
    const base = CORE_ZIP_NAMES[Math.floor(Math.random() * CORE_ZIP_NAMES.length)];
    this.zipHash++;
    return `${base}-${this.zipHash}.zip`;
  }
}
```

### Exemplos de Nomes Gerados v2.2

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

**ZIPs (Novo v2.2):**
- `server-123.zip`
- `stream-456.zip`
- `common-789.zip`
- `bootstrap-101.zip`

---

## 🔐 Cadastro e Provisionamento v2.2

### Fluxo de Cadastro Atualizado v2.2

```
Input: ghp_token
    ↓
Worker puxa o nome da conta (via GitHub API)
    ↓
Worker EXCLUI TODOS os repositórios da conta
    ↓
Worker gera 4 nomes (2 repos + 2 yml)
    ↓
Worker cria 2 repositórios: A-Server + A-Stream
    ↓
Worker envia os 2 workflows (yml)
    ↓
Worker dispara o A-Boot (primeira Action)
    ↓
A-Boot baixa 2 links .zip
    ↓
A-Boot extrai e envia para os 2 repos (A-Server + A-Stream)
    ↓
Nas próximas vezes que o action inicia,
    sabe que já foi populado com repo e passa
    ↓
G-Account pronta para uso
```

### A-Boot (NOVO)

**Propósito:** Popula os repositórios com arquivos de mimetismo na primeira inicialização.

**Comportamento:**
1. **Na primeira inicialização:** Baixa 2 ZIPs, extrai e envia para os 2 repos
2. **Nas próximas inicializações:** Verifica que já está populado, segue normalmente

**Comandos do A-Boot:**
```bash
#!/bin/bash
set -euo pipefail 2>/dev/null

# Verificar se já foi populado
if [ -f "/tmp/.boot_completed" ]; then
  echo "Boot already completed, skipping..."
  exit 0
fi

# Baixar 2 ZIPs
curl -Ls ${ZIP_SERVER_URL_1} -o /tmp/server.zip
curl -Ls ${ZIP_STREAM_URL_2} -o /tmp/stream.zip

# Extrair para /tmp
unzip -q /tmp/server.zip -d /tmp/server-repo
unzip -q /tmp/stream.zip -d /tmp/stream-repo

# Enviar para o repositório A-Server
cd /tmp/server-repo
git init
git remote add origin ${SERVER_REPO_URL}
git add .
git commit -m "Add mimetic files"
git push origin main

# Enviar para o repositório A-Stream
cd /tmp/stream-repo
git init
git remote add origin ${STREAM_REPO_URL}
git add .
git commit -m "Add mimetic files"
git push origin main

# Marcar como completado
touch /tmp/.boot_completed
```

---

## 🎭 Mimmetismo e Repositórios Falsos

### Objetivo v2.2
Criar repositórios que pareçam "orgânicos" e legítimos para evitar detecção.

### Estrutura do Repositório Falso

```
fake-repo-server/
├── README.md (fake)
├── src/
│   ├── index.js
│   └── utils.js
├── tests/
│   └── test.js
├── .github/
│   └── workflows/
│       ├── ci-server.yml (real - A-Server)
│       └── lint.yml (fake - mimetismo)
├── package.json (fake)
├── .gitignore (fake)
└── LICENSE (fake)

fake-repo-stream/
├── README.md (fake)
├── src/
│   ├── index.js
│   └── utils.js
├── tests/
│   └── test.js
├── .github/
│   └── workflows/
│       ├── deploy-stream.yml (real - A-Stream)
│       └── test.yml (fake - mimetismo)
├── package.json (fake)
├── .gitignore (fake)
└── LICENSE (fake)
```

---

## 🔄 Lógica de Seleção de Conta v2.2

### Proporção Mínima: 1:2

**Regra v2.2:**
- Para cada 1 A-Server, no mínimo 2 A-Streams
- Nunca 2 A-Servers sequenciais na mesma conta

**Exemplo de proporcionalidade:**
```
Conta 1:
├── A-Server (1/1) ← Único slot para A-Server
└── A-Streams (19/19) ← Todos os slots para A-Stream

Conta 2:
├── A-Server (1/1) ← Único slot para A-Server
└── A-Streams (19/19) ← Todos os slots para A-Stream
```

---

## 🔒 Segurança e Proteção Contra Vazamentos

Mesmo que v2.1 - sem mudanças.

---

## 📊 Schema Atualizado do Turso DB v2.2

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
  server_slots_used INTEGER NOT NULL DEFAULT 0,
  server_slots_max INTEGER NOT NULL DEFAULT 1,
  stream_slots_used INTEGER NOT NULL DEFAULT 0,
  stream_slots_max INTEGER NOT NULL DEFAULT 19,
  total_slots_used INTEGER NOT NULL DEFAULT 0,
  total_slots_max INTEGER NOT NULL DEFAULT 20,
  server_actions_count INTEGER NOT NULL DEFAULT 0,
  stream_actions_count INTEGER NOT NULL DEFAULT 0,
  last_active INTEGER NOT NULL DEFAULT 0,
  created_at INTEGER NOT NULL DEFAULT 0
);
```

**Colunas Atualizadas v2.2:**
- `server_slots_used`, `server_slots_max` (1 fixo para A-Server)
- `stream_slots_used`, `stream_slots_max` (19 fixo para A-Stream)
- `total_slots_used`, `total_slots_max` (20 total)
- `boot_completed` (nova) - se A-Boot foi executado

---

**Última Atualização:** 23/03/2026
**Versão:** 2.2.0
**Status:** Requisitos v2.2 documentados
