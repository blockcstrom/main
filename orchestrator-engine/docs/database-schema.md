# 🗄️ Database Schema - Turso (Updated v2.2)

## Visão Geral

Schema do banco de dados Turso (libSQL) atualizado para suportar separação FIXA de slots (1 A-Server + 19 A-Stream) e A-Boot.

---

## Tabelas

### 1. `gaccounts` (Atualizada v2.2)

Armazena contas GitHub com 2 repositórios (A-Server + A-Stream) e separação FIXA de slots.

#### Schema Atualizado v2.2

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
  created_at INTEGER NOT NULL DEFAULT 0,
  boot_completed INTEGER NOT NULL DEFAULT 0
);
```

#### Colunas

| Coluna | Tipo | Descrição | Constraints |
|--------|------|-----------|-------------|
| `username` | TEXT | Login do GitHub (PK) | PRIMARY KEY |
| `token` | TEXT | GitHub PAT | NOT NULL |
| `repo_owner` | TEXT | Dono do repositório | NOT NULL |
| `server_repo_name` | TEXT | Nome do repositório A-Server | NOT NULL |
| `server_repo_url` | TEXT | URL do repositório A-Server | NOT NULL |
| `server_workflow_name` | TEXT | Nome do workflow A-Server | NOT NULL |
| `stream_repo_name` | TEXT | Nome do repositório A-Stream | NOT NULL |
| `stream_repo_url` | TEXT | URL do repositório A-Stream | NOT NULL |
| `stream_workflow_name` | TEXT | Nome do workflow A-Stream | NOT NULL |
| `fictional_name` | TEXT | Nome fictício para identificação | NOT NULL |
| `server_slots_used` | INTEGER | Slots A-Server usados | DEFAULT 0, >= 0 |
| `server_slots_max` | INTEGER | Slots A-Server máximo (FIXO: 1) | DEFAULT 1 |
| `stream_slots_used` | INTEGER | Slots A-Stream usados | DEFAULT 0, >= 0 |
| `stream_slots_max` | INTEGER | Slots A-Stream máximo (FIXO: 19) | DEFAULT 19 |
| `total_slots_used` | INTEGER | Total slots usados | DEFAULT 0, >= 0 |
| `total_slots_max` | INTEGER | Total slots máximo (FIXO: 20) | DEFAULT 20 |
| `server_actions_count` | INTEGER | Contador de A-Servers rodados | DEFAULT 0, >= 0 |
| `stream_actions_count` | INTEGER | Contador de A-Streams rodados | DEFAULT 0, >= 0 |
| `last_active` | INTEGER | Timestamp do último uso | DEFAULT 0 |
| `created_at` | INTEGER | Timestamp de criação (ms) | DEFAULT 0 |
| `boot_completed` | INTEGER | Se A-Boot foi completado (0 ou 1) | DEFAULT 0 |

**MUDANÇA v2.2:** Separação FIXA de slots (1 A-Server + 19 A-Stream).

#### Índices

```sql
CREATE INDEX idx_gaccounts_server_slots ON gaccounts(server_slots_used, server_slots_max);
CREATE INDEX idx_gaccounts_stream_slots ON gaccounts(stream_slots_used, stream_slots_max);
CREATE INDEX idx_gaccounts_total_slots ON gaccounts(total_slots_used, total_slots_max);
CREATE INDEX idx_gaccounts_last_active ON gaccounts(last_active);
CREATE INDEX idx_gaccounts_boot_completed ON gaccounts(boot_completed);
```

#### Queries Comuns

**Selecionar conta com slots A-Server disponíveis:**
```sql
SELECT *
FROM gaccounts
WHERE server_slots_used < server_slots_max
ORDER BY server_slots_used ASC, RANDOM()
LIMIT 1;
```

**Selecionar conta com slots A-Stream disponíveis:**
```sql
SELECT *
FROM gaccounts
WHERE stream_slots_used < stream_slots_max
ORDER BY stream_slots_used ASC, RANDOM()
LIMIT 1;
```

**Incrementar slots A-Server:**
```sql
UPDATE gaccounts
SET server_slots_used = server_slots_used + 1,
    total_slots_used = total_slots_used + 1,
    server_actions_count = server_actions_count + 1,
    last_active = ?
WHERE username = ?;
```

**Incrementar slots A-Stream:**
```sql
UPDATE gaccounts
SET stream_slots_used = stream_slots_used + 1,
    total_slots_used = total_slots_used + 1,
    stream_actions_count = stream_actions_count + 1,
    last_active = ?
WHERE username = ?;
```

**Marcar boot como completado:**
```sql
UPDATE gaccounts
SET boot_completed = 1
WHERE username = ?;
```

**Resetar slots de uma conta:**
```sql
UPDATE gaccounts
SET server_slots_used = 0,
    stream_slots_used = 0,
    total_slots_used = 0,
    server_actions_count = 0,
    stream_actions_count = 0,
    boot_completed = 0
WHERE username = ?;
```

#### Exemplo de Dados v2.2

```json
{
  "username": "user1",
  "token": "ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
  "repo_owner": "user1",
  "server_repo_name": "CI-pipeline-123",
  "server_repo_url": "https://github.com/user1/CI-pipeline-123",
  "server_workflow_name": "ci-server-456.yml",
  "stream_repo_name": "Builder-engine-456",
  "stream_repo_url": "https://github.com/user1/Builder-engine-456",
  "stream_workflow_name": "deploy-stream-789.yml",
  "fictional_name": "Alpha",
  "server_slots_used": 1,
  "server_slots_max": 1,
  "stream_slots_used": 5,
  "stream_slots_max": 19,
  "total_slots_used": 6,
  "total_slots_max": 20,
  "server_actions_count": 1,
  "stream_actions_count": 5,
  "last_active": 1711234567890,
  "created_at": 1711230000000,
  "boot_completed": 1
}
```

---

### 2. `orchestrator_state` (Inalterada)

Armazena estado atual da rotação e estatísticas globais.

---

### 3. `login_attempts` (Inalterada)

Armazena tentativas de login para proteção contra brute-force.

---

### 4. `mimetic_repos` (Atualizada v2.2)

Armazena URLs de ZIPs para mimetismo com nomes baseados em Deck 3.

#### Schema Atualizado

```sql
CREATE TABLE mimetic_repos (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  zip_name TEXT NOT NULL,
  url TEXT NOT NULL UNIQUE,
  repo_type TEXT NOT NULL,  -- 'server' ou 'stream' ou 'common'
  description TEXT,
  created_at INTEGER NOT NULL DEFAULT 0,
  last_used INTEGER NOT NULL DEFAULT 0,
  usage_count INTEGER NOT NULL DEFAULT 0
);
```

#### Colunas

| Coluna | Tipo | Descrição | Constraints |
|--------|------|-----------|-------------|
| `id` | INTEGER | ID do registro (PK) | AUTOINCREMENT |
| `zip_name` | TEXT | Nome do arquivo ZIP (ex: server-123.zip) | NOT NULL |
| `url` | TEXT | URL do arquivo ZIP | UNIQUE, NOT NULL |
| `repo_type` | TEXT | Tipo de repositório ('server', 'stream', 'common') | NOT NULL |
| `description` | TEXT | Descrição do ZIP | |
| `created_at` | INTEGER | Timestamp de criação (ms) | DEFAULT 0 |
| `last_used` | INTEGER | Timestamp do último uso (ms) | DEFAULT 0 |
| `usage_count` | INTEGER | Contador de usos | DEFAULT 0, >= 0 |

---

### 5. `rotation_logs` (Inalterada)

Armazena logs de rotações para debugging e análise.

---

## Schema Completo Atualizado v2.2

```sql
-- ========================================
-- Orchestrator Engine - Database Schema (v2.2)
-- ========================================

-- Tabela de contas GitHub (combustível do sistema)
CREATE TABLE IF NOT EXISTS gaccounts (
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
  created_at INTEGER NOT NULL DEFAULT 0,
  boot_completed INTEGER NOT NULL DEFAULT 0,
  CHECK (server_slots_used >= 0),
  CHECK (stream_slots_used >= 0),
  CHECK (total_slots_used >= 0),
  CHECK (server_slots_max = 1),
  CHECK (stream_slots_max = 19),
  CHECK (total_slots_max = 20),
  CHECK (server_actions_count >= 0),
  CHECK (stream_actions_count >= 0),
  CHECK (boot_completed IN (0, 1))
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_gaccounts_server_slots ON gaccounts(server_slots_used, server_slots_max);
CREATE INDEX IF NOT EXISTS idx_gaccounts_stream_slots ON gaccounts(stream_slots_used, stream_slots_max);
CREATE INDEX IF NOT EXISTS idx_gaccounts_total_slots ON gaccounts(total_slots_used, total_slots_max);
CREATE INDEX IF NOT EXISTS idx_gaccounts_last_active ON gaccounts(last_active);
CREATE INDEX IF NOT EXISTS idx_gaccounts_boot_completed ON gaccounts(boot_completed);

-- Tabela de estado da orquestração
CREATE TABLE IF NOT EXISTS orchestrator_state (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL
);

-- Tabela de tentativas de login (segurança)
CREATE TABLE IF NOT EXISTS login_attempts (
  ip TEXT PRIMARY KEY,
  attempts INTEGER NOT NULL DEFAULT 0,
  last_attempt INTEGER NOT NULL DEFAULT 0
);

-- Tabela de repositórios de mimetismo (v2.2)
CREATE TABLE IF NOT EXISTS mimetic_repos (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  zip_name TEXT NOT NULL,
  url TEXT NOT NULL UNIQUE,
  repo_type TEXT NOT NULL,
  description TEXT,
  created_at INTEGER NOT NULL DEFAULT 0,
  last_used INTEGER NOT NULL DEFAULT 0,
  usage_count INTEGER NOT NULL DEFAULT 0
);

-- Tabela de logs de rotação (debug)
CREATE TABLE IF NOT EXISTS rotation_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  from_tunnel TEXT NOT NULL,
  to_tunnel TEXT NOT NULL,
  account_username TEXT NOT NULL,
  action_type TEXT NOT NULL,
  success BOOLEAN NOT NULL,
  timestamp INTEGER NOT NULL,
  duration_ms INTEGER,
  error_message TEXT
);

-- Inserir estado inicial
INSERT OR IGNORE INTO orchestrator_state (key, value) VALUES ('active_tunnel', 'Galio');
INSERT OR IGNORE INTO orchestrator_state (key, value) VALUES ('last_rotation', '0');
INSERT OR IGNORE INTO orchestrator_state (key, value) VALUES ('total_server_actions', '0');
INSERT OR IGNORE INTO orchestrator_state (key, value) VALUES ('total_stream_actions', '0');
INSERT OR IGNORE INTO orchestrator_state (key, value) VALUES ('last_health_check', '0');
INSERT OR IGNORE INTO orchestrator_state (key, value) VALUES ('system_uptime_start', '0');
```

---

## Views Úteis

### View: Contas Disponíveis A-Server

```sql
CREATE VIEW IF NOT EXISTS available_server_accounts AS
SELECT
  username,
  server_repo_name,
  fictional_name,
  server_slots_used,
  server_slots_max,
  server_actions_count,
  last_active
FROM gaccounts
WHERE server_slots_used < server_slots_max
ORDER BY server_slots_used ASC;
```

### View: Contas Disponíveis A-Stream

```sql
CREATE VIEW IF NOT EXISTS available_stream_accounts AS
SELECT
  username,
  stream_repo_name,
  fictional_name,
  stream_slots_used,
  stream_slots_max,
  stream_actions_count,
  last_active
FROM gaccounts
WHERE stream_slots_used < stream_slots_max
ORDER BY stream_slots_used ASC;
```

---

**Última Atualização:** 23/03/2026
**Versão:** 2.2.0 (Atualizada com separação FIXA de slots, A-Boot)
