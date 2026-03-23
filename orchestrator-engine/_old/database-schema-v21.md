# 🗄️ Database Schema - Turso (Updated v2.1)

## Visão Geral

Schema do banco de dados Turso (libSQL) atualizado para suportar 2 repositórios por conta (A-Server + A-Stream).

---

## Tabelas

### 1. `gaccounts` (Atualizada v2.1)

Armazena contas GitHub com 2 repositórios: 1 A-Server + 1 A-Stream.

#### Schema Atualizado

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
| `slots_used` | INTEGER | Contador de uso atual | DEFAULT 0, >= 0 |
| `slots_max` | INTEGER | Limite máximo de Actions | DEFAULT 20, > 0 |
| `server_actions_count` | INTEGER | Contador de A-Servers rodados | DEFAULT 0, >= 0 |
| `stream_actions_count` | INTEGER | Contador de A-Streams rodados | DEFAULT 0, >= 0 |
| `last_active` | INTEGER | Timestamp do último uso | DEFAULT 0 |
| `created_at` | INTEGER | Timestamp de criação (ms) | DEFAULT 0 |

**MUDANÇA v2.1:** Removida coluna `account_type` - cada conta tem ambos A-Server e A-Stream.

#### Índices

```sql
CREATE INDEX idx_gaccounts_slots_used ON gaccounts(slots_used);
CREATE INDEX idx_gaccounts_last_active ON gaccounts(last_active);
CREATE INDEX idx_gaccounts_available ON gaccounts(slots_used);
```

#### Queries Comuns

**Selecionar conta com slots disponíveis (para A-Server):**
```sql
SELECT *
FROM gaccounts
WHERE slots_used < slots_max
ORDER BY slots_used ASC, RANDOM()
LIMIT 1;
```

**Selecionar conta com slots disponíveis (para A-Stream):**
```sql
SELECT *
FROM gaccounts
WHERE slots_used < slots_max
ORDER BY slots_used ASC, RANDOM()
LIMIT 1;
```

**Incrementar slots (A-Server):**
```sql
UPDATE gaccounts
SET slots_used = slots_used + 1,
    server_actions_count = server_actions_count + 1,
    last_active = ?
WHERE username = ?;
```

**Incrementar slots (A-Stream):**
```sql
UPDATE gaccounts
SET slots_used = slots_used + 1,
    stream_actions_count = stream_actions_count + 1,
    last_active = ?
WHERE username = ?;
```

**Resetar slots de uma conta:**
```sql
UPDATE gaccounts
SET slots_used = 0,
    server_actions_count = 0,
    stream_actions_count = 0
WHERE username = ?;
```

**Listar todas contas com estatísticas:**
```sql
SELECT
  username,
  server_repo_name,
  stream_repo_name,
  fictional_name,
  slots_used,
  slots_max,
  slots_max - slots_used as available_slots,
  server_actions_count,
  stream_actions_count,
  last_active
FROM gaccounts
ORDER BY slots_used ASC;
```

#### Exemplo de Dados

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
  "slots_used": 2,
  "slots_max": 20,
  "server_actions_count": 1,
  "stream_actions_count": 1,
  "last_active": 1711234567890,
  "created_at": 1711230000000
}
```

---

### 2. `orchestrator_state` (Atualizada)

Armazena estado atual da rotação e estatísticas globais.

#### Schema

```sql
CREATE TABLE orchestrator_state (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL
);
```

#### Colunas

| Coluna | Tipo | Descrição | Constraints |
|--------|------|-----------|-------------|
| `key` | TEXT | Chave de estado (PK) | PRIMARY KEY |
| `value` | TEXT | Valor do estado | NOT NULL |

#### Chaves de Estado Atualizadas

| Key | Value | Descrição |
|-----|-------|-----------|
| `active_tunnel` | "Galio" \| "Borio" | Tunnel atualmente ativo |
| `last_rotation` | "1711234567890" | Timestamp da última rotação (ms) |
| `total_server_actions` | "45" | Total de A-Servers rodados |
| `total_stream_actions` | "123" | Total de A-Streams rodados |
| `last_health_check` | "1711234567890" | Timestamp do último health check |

---

### 3. `login_attempts` (Inalterada)

Armazena tentativas de login para proteção contra brute-force.

#### Schema

```sql
CREATE TABLE login_attempts (
  ip TEXT PRIMARY KEY,
  attempts INTEGER NOT NULL DEFAULT 0,
  last_attempt INTEGER NOT NULL DEFAULT 0
);
```

---

### 4. `mimetic_repos` (Nova - Opcional)

Armazena informações sobre repositórios de mimetismo (ZIP files).

#### Schema

```sql
CREATE TABLE mimetic_repos (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  url TEXT NOT NULL UNIQUE,
  repo_name TEXT NOT NULL,
  description TEXT,
  created_at INTEGER NOT NULL DEFAULT 0,
  last_used INTEGER NOT NULL DEFAULT 0,
  usage_count INTEGER NOT NULL DEFAULT 0
);
```

---

### 5. `rotation_logs` (Nova - Para Debug)

Armazena logs de rotações para debugging e análise.

#### Schema

```sql
CREATE TABLE rotation_logs (
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
```

---

## Schema Completo Atualizado v2.1

```sql
-- ========================================
-- Orchestrator Engine - Database Schema (v2.1)
-- ========================================

-- Tabela de contas GitHub (combustível do sistema)
-- v2.1: Cada conta tem 2 repositórios (1 A-Server + 1 A-Stream)
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
  slots_used INTEGER NOT NULL DEFAULT 0,
  slots_max INTEGER NOT NULL DEFAULT 20,
  server_actions_count INTEGER NOT NULL DEFAULT 0,
  stream_actions_count INTEGER NOT NULL DEFAULT 0,
  last_active INTEGER NOT NULL DEFAULT 0,
  created_at INTEGER NOT NULL DEFAULT 0,
  CHECK (slots_used >= 0),
  CHECK (slots_max > 0),
  CHECK (server_actions_count >= 0),
  CHECK (stream_actions_count >= 0)
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_gaccounts_slots_used ON gaccounts(slots_used);
CREATE INDEX IF NOT EXISTS idx_gaccounts_last_active ON gaccounts(last_active);
CREATE INDEX IF NOT EXISTS idx_gaccounts_available ON gaccounts(slots_used);

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

-- Tabela de repositórios de mimetismo (opcional)
CREATE TABLE IF NOT EXISTS mimetic_repos (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  url TEXT NOT NULL UNIQUE,
  repo_name TEXT NOT NULL,
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

### View: Contas Disponíveis

```sql
CREATE VIEW IF NOT EXISTS available_accounts AS
SELECT
  username,
  server_repo_name,
  stream_repo_name,
  fictional_name,
  slots_used,
  slots_max,
  slots_max - slots_used as available_slots,
  server_actions_count,
  stream_actions_count,
  last_active
FROM gaccounts
WHERE slots_used < slots_max
ORDER BY slots_used ASC;
```

### View: Estatísticas do Pool

```sql
CREATE VIEW IF NOT EXISTS pool_statistics AS
SELECT
  COUNT(*) as total_accounts,
  SUM(slots_max) as total_slots,
  SUM(slots_used) as used_slots,
  SUM(slots_max - slots_used) as available_slots,
  SUM(server_actions_count) as total_server_actions,
  SUM(stream_actions_count) as total_stream_actions
FROM gaccounts;
```

---

## Data Validation

### gaccounts

- `slots_used` deve ser >= 0
- `slots_max` deve ser > 0
- `slots_used` <= `slots_max`
- `server_actions_count` >= 0
- `stream_actions_count` >= 0
- `server_workflow_name` e `stream_workflow_name` devem terminar em `.yml`
- `last_active` deve ser timestamp Unix válido
- `created_at` deve ser timestamp Unix válido

---

**Última Atualização:** 23/03/2026
**Versão:** 2.1.0 (Atualizada com 2 repos por conta, 2 decks separados)
