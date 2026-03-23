# 🗄️ Database Schema - Turso (Updated)

## Visão Geral

Schema do banco de dados Turso (libSQL) atualizado para suportar A-Server, A-Stream e rotação por quantidade.

---

## Tabelas

### 1. `gaccounts` (Atualizada)

Armazena contas GitHub disponíveis para rotação de VMs com suporte a A-Server e A-Stream.

#### Schema Atualizado

```sql
CREATE TABLE gaccounts (
  username TEXT PRIMARY KEY,
  token TEXT NOT NULL,
  repo_owner TEXT NOT NULL,
  repo_name TEXT NOT NULL,
  repo_url TEXT NOT NULL,
  workflows_json TEXT NOT NULL,
  fictional_name TEXT NOT NULL,
  account_type TEXT NOT NULL,
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
| `repo_name` | TEXT | Nome do repositório | NOT NULL |
| `repo_url` | TEXT | URL completa do repositório | NOT NULL |
| `workflows_json` | TEXT | JSON array com nomes de workflows | NOT NULL |
| `fictional_name` | TEXT | Nome fictício para identificação | NOT NULL |
| `account_type` | TEXT | Tipo da conta: 'server' ou 'stream' | NOT NULL, CHECK IN ('server', 'stream') |
| `slots_used` | INTEGER | Contador de uso atual | DEFAULT 0, >= 0 |
| `slots_max` | INTEGER | Limite máximo de Actions | DEFAULT 20, > 0 |
| `server_actions_count` | INTEGER | Contador de A-Servers rodados | DEFAULT 0, >= 0 |
| `stream_actions_count` | INTEGER | Contador de A-Streams rodados | DEFAULT 0, >= 0 |
| `last_active` | INTEGER | Timestamp Unix (ms) | DEFAULT 0 |
| `created_at` | INTEGER | Timestamp de criação (ms) | DEFAULT 0 |

#### Índices

```sql
CREATE INDEX idx_gaccounts_slots_used ON gaccounts(slots_used);
CREATE INDEX idx_gaccounts_account_type ON gaccounts(account_type);
CREATE INDEX idx_gaccounts_last_active ON gaccounts(last_active);
CREATE INDEX idx_gaccounts_available ON gaccounts(slots_used, account_type);
```

#### Queries Comuns

**Selecionar conta com slots disponíveis (para A-Server):**
```sql
SELECT *
FROM gaccounts
WHERE account_type = 'server'
  AND slots_used < slots_max
ORDER BY slots_used ASC, RANDOM()
LIMIT 1;
```

**Selecionar conta com slots disponíveis (para A-Stream):**
```sql
SELECT *
FROM gaccounts
WHERE account_type = 'stream'
  AND slots_used < slots_max
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
  repo_name,
  account_type,
  fictional_name,
  slots_used,
  slots_max,
  slots_max - slots_used as available_slots,
  server_actions_count,
  stream_actions_count,
  last_active
FROM gaccounts
ORDER BY account_type, slots_used ASC;
```

#### Exemplo de Dados

```json
{
  "username": "user1",
  "token": "ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
  "repo_owner": "user1",
  "repo_name": "CI-Implementation-planner-123",
  "repo_url": "https://github.com/user1/CI-Implementation-planner-123",
  "workflows_json": "[\"ci-build-test-456.yml\"]",
  "fictional_name": "Alpha",
  "account_type": "server",
  "slots_used": 1,
  "slots_max": 20,
  "server_actions_count": 1,
  "stream_actions_count": 0,
  "last_active": 1711234567890,
  "created_at": 1711230000000
}
```

---

### 2. `orchestrator_state` (Atualizada)

Armazena estado atual da rotação e estatísticas globais.

#### Schema Atualizado

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
| `system_uptime_start` | "1711230000000" | Timestamp de início do sistema |

#### Queries Comuns

**Obter tunnel ativo:**
```sql
SELECT value
FROM orchestrator_state
WHERE key = 'active_tunnel';
```

**Obter estatísticas globais:**
```sql
SELECT key, value
FROM orchestrator_state
WHERE key IN ('total_server_actions', 'total_stream_actions', 'last_health_check');
```

**Atualizar contador de A-Servers:**
```sql
INSERT OR REPLACE INTO orchestrator_state (key, value)
VALUES ('total_server_actions', COALESCE(
  (SELECT CAST(value AS INTEGER) FROM orchestrator_state WHERE key = 'total_server_actions'), 0
) + 1);
```

**Atualizar contador de A-Streams:**
```sql
INSERT OR REPLACE INTO orchestrator_state (key, value)
VALUES ('total_stream_actions', COALESCE(
  (SELECT CAST(value AS INTEGER) FROM orchestrator_state WHERE key = 'total_stream_actions'), 0
) + 1);
```

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

#### Colunas

| Coluna | Tipo | Descrição | Constraints |
|--------|------|-----------|-------------|
| `ip` | TEXT | Endereço IP do cliente (PK) | PRIMARY KEY |
| `attempts` | INTEGER | Número de tentativas falhas | DEFAULT 0, >= 0 |
| `last_attempt` | INTEGER | Timestamp Unix (ms) | DEFAULT 0 |

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

#### Colunas

| Coluna | Tipo | Descrição | Constraints |
|--------|------|-----------|-------------|
| `id` | INTEGER | ID do registro (PK) | AUTOINCREMENT |
| `url` | TEXT | URL do arquivo ZIP | UNIQUE, NOT NULL |
| `repo_name` | TEXT | Nome do repositório (para organização) | NOT NULL |
| `description` | TEXT | Descrição do repositório | |
| `created_at` | INTEGER | Timestamp de criação (ms) | DEFAULT 0 |
| `last_used` | INTEGER | Timestamp do último uso (ms) | DEFAULT 0 |
| `usage_count` | INTEGER | Contador de usos | DEFAULT 0, >= 0 |

#### Queries Comuns

**Selecionar ZIP aleatório:**
```sql
SELECT url, repo_name
FROM mimetic_repos
ORDER BY RANDOM()
LIMIT 1;
```

**Inserir novo ZIP:**
```sql
INSERT INTO mimetic_repos (url, repo_name, description, created_at)
VALUES (?, ?, ?, ?);
```

**Atualizar uso:**
```sql
UPDATE mimetic_repos
SET last_used = ?,
    usage_count = usage_count + 1
WHERE url = ?;
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

#### Colunas

| Coluna | Tipo | Descrição | Constraints |
|--------|------|-----------|-------------|
| `id` | INTEGER | ID do log (PK) | AUTOINCREMENT |
| `from_tunnel` | TEXT | Tunnel anterior | NOT NULL |
| `to_tunnel` | TEXT | Tunnel novo | NOT NULL |
| `account_username` | TEXT | Username da conta usada | NOT NULL |
| `action_type` | TEXT | Tipo de Action ('server' ou 'stream') | NOT NULL |
| `success` | BOOLEAN | Se a rotação foi bem-sucedida | NOT NULL |
| `timestamp` | INTEGER | Timestamp da rotação (ms) | NOT NULL |
| `duration_ms` | INTEGER | Duração da rotação (ms) | |
| `error_message` | TEXT | Mensagem de erro (se falhou) | |

#### Queries Comuns

**Inserir log de rotação:**
```sql
INSERT INTO rotation_logs (
  from_tunnel, to_tunnel, account_username, action_type, success, timestamp, duration_ms, error_message
) VALUES (?, ?, ?, ?, ?, ?, ?, ?);
```

**Obter logs recentes:**
```sql
SELECT *
FROM rotation_logs
ORDER BY timestamp DESC
LIMIT 100;
```

**Obter taxa de sucesso:**
```sql
SELECT
  COUNT(*) as total,
  SUM(CASE WHEN success = 1 THEN 1 ELSE 0 END) as successful,
  CAST(SUM(CASE WHEN success = 1 THEN 1 ELSE 0 END) AS REAL) / COUNT(*) * 100 as success_rate
FROM rotation_logs
WHERE timestamp > ?;
```

---

## Schema Completo Atualizado

```sql
-- ========================================
-- Orchestrator Engine - Database Schema (Updated)
-- ========================================

-- Tabela de contas GitHub (combustível do sistema)
CREATE TABLE IF NOT EXISTS gaccounts (
  username TEXT PRIMARY KEY,
  token TEXT NOT NULL,
  repo_owner TEXT NOT NULL,
  repo_name TEXT NOT NULL,
  repo_url TEXT NOT NULL,
  workflows_json TEXT NOT NULL,
  fictional_name TEXT NOT NULL,
  account_type TEXT NOT NULL,
  slots_used INTEGER NOT NULL DEFAULT 0,
  slots_max INTEGER NOT NULL DEFAULT 20,
  server_actions_count INTEGER NOT NULL DEFAULT 0,
  stream_actions_count INTEGER NOT NULL DEFAULT 0,
  last_active INTEGER NOT NULL DEFAULT 0,
  created_at INTEGER NOT NULL DEFAULT 0,
  CHECK (account_type IN ('server', 'stream')),
  CHECK (slots_used >= 0),
  CHECK (slots_max > 0),
  CHECK (server_actions_count >= 0),
  CHECK (stream_actions_count >= 0)
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_gaccounts_slots_used ON gaccounts(slots_used);
CREATE INDEX IF NOT EXISTS idx_gaccounts_account_type ON gaccounts(account_type);
CREATE INDEX IF NOT EXISTS idx_gaccounts_last_active ON gaccounts(last_active);
CREATE INDEX IF NOT EXISTS idx_gaccounts_available ON gaccounts(slots_used, account_type);

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
  repo_name,
  account_type,
  fictional_name,
  slots_used,
  slots_max,
  slots_max - slots_used as available_slots,
  server_actions_count,
  stream_actions_count,
  last_active
FROM gaccounts
WHERE slots_used < slots_max
ORDER BY slots_used ASC, account_type;
```

### View: Estatísticas do Pool

```sql
CREATE VIEW IF NOT EXISTS pool_statistics AS
SELECT
  COUNT(*) as total_accounts,
  SUM(CASE WHEN account_type = 'server' THEN 1 ELSE 0 END) as server_accounts,
  SUM(CASE WHEN account_type = 'stream' THEN 1 ELSE 0 END) as stream_accounts,
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

- `account_type` deve ser 'server' ou 'stream'
- `slots_used` deve ser >= 0
- `slots_max` deve ser > 0
- `slots_used` <= `slots_max`
- `server_actions_count` >= 0
- `stream_actions_count` >= 0
- `workflows_json` deve ser JSON válido
- `last_active` deve ser timestamp Unix válido
- `created_at` deve ser timestamp Unix válido

### orchestrator_state

- `active_tunnel` deve ser "Galio" ou "Borio"
- Valores numéricos devem ser timestamp Unix válidos

---

**Última Atualização:** 23/03/2026
**Versão:** 2.0.0 (Atualizada com A-Server/A-Stream, mimetismo, rotacionamento por quantidade)
