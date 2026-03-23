# 📡 API Specification - Orchestrator Engine (Updated v2.1)

## Visão Geral

API HTTP atualizada do Orchestrator Engine exposta via Cloudflare Worker usando framework Hono, com suporte a 2 repositórios por conta (A-Server + A-Stream).

**Base URL:** `https://orchestrator-engine.workers.dev`

---

## Endpoints

### 1. Health Check

#### GET `/`

Retorna status básico do sistema.

**Response:**
```http
HTTP/1.1 200 OK
Content-Type: text/plain

Orchestrator Engine - System Online
```

---

### 2. Detailed Health Check

#### GET `/health`

Retorna status detalhado do sistema com timestamp.

**Response:**
```json
{
  "status": "healthy",
  "timestamp": 1711234567890,
  "version": "2.1.0",
  "active_tunnel": "Galio"
}
```

---

### 3. Register New G-Account (CADASTRO ATUALIZADO v2.1)

#### POST `/api/accounts/register`

Provisiona uma nova G-Account automaticamente criando **2 repositórios** (A-Server + A-Stream) + 2 workflows.

**Request (v2.1 - Atualizado):**
```json
{
  "token": "ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
}
```

**MUDANÇA v2.1:** Removido `account_type` - cria automaticamente ambos A-Server e A-Stream.

**Headers:**
- `X-Requested-With: Orchestrator-UI` (CSRF protection)

**Response (201 Created):**
```json
{
  "success": true,
  "message": "Account provisioned successfully with 2 repositories",
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
    "slots_max": 20,
    "server_actions_count": 0,
    "stream_actions_count": 0
  }
}
```

**Error Responses:**

400 Bad Request (Invalid token):
```json
{
  "success": false",
  "error": "Invalid GitHub token"
}
```

401 Unauthorized:
```json
{
  "success": false",
  "error": "Unauthorized"
}
```

409 Conflict (Account already exists):
```json
{
  "success": false",
  "error": "Account already exists"
}
```

500 Internal Server Error:
```json
{
  "success": false,
  "error": "Failed to create repositories"
}
```

---

### 4. List Accounts (Atualizado v2.1)

#### GET `/api/accounts`

Lista todas as G-Accounts com seus 2 repositórios.

**Authentication:** Cookie `orchestrator_session` required

**Response:**
```json
{
  "success": true,
  "accounts": [
    {
      "username": "user1",
      "repo_owner": "user1",
      "server_repo_name": "CI-pipeline-123",
      "server_repo_url": "https://github.com/user1/CI-pipeline-123",
      "server_workflow_name": "ci-server-456.yml",
      "stream_repo_name": "Builder-engine-456",
      "stream_repo_url": "https://github.com/user1/Builder-engine-456",
      "stream_workflow_name": "deploy-stream-789.yml",
      "fictional_name": "Alfa",
      "slots_used": 2,
      "slots_max": 20,
      "server_actions_count": 1,
      "stream_actions_count": 1,
      "last_active": 1711234567890
    }
  ]
}
```

---

### 5. Get Account Details (Atualizado v2.1)

#### GET `/api/accounts/:username`

Retorna detalhes de uma conta específica com seus 2 repositórios.

**Authentication:** Cookie `orchestrator_session` required

**Response:**
```json
{
  "success": true,
  "account": {
    "username": "user1",
    "repo_owner": "user1",
    "server_repo_name": "CI-pipeline-123",
    "server_repo_url": "https://github.com/user1/CI-pipeline-123",
    "server_workflow_name": "ci-server-456.yml",
    "stream_repo_name": "Builder-engine-456",
    "stream_repo_url": "https://github.com/user1/Builder-engine-456",
    "stream_workflow_name": "deploy-stream-789.yml",
    "fictional_name": "Alfa",
    "slots_used": 2,
    "slots_max": 20,
    "server_actions_count": 1,
    "stream_actions_count": 1,
    "last_active": 1711234567890
  }
}
```

---

### 6. Get Pool Statistics (Atualizado v2.1)

#### GET `/api/accounts/pool`

Retorna estatísticas do pool de G-Accounts.

**Response:**
```json
{
  "success": true,
  "statistics": {
    "total_accounts": 10,
    "total_repositories": 20,  // v2.1: 2 por conta
    "total_slots": 200,
    "used_slots": 45,
    "available_slots": 155,
    "total_server_actions": 5,
    "total_stream_actions": 40
  }
}
```

---

### 7. Get System State (Atualizado v2.1)

#### GET `/api/state`

Retorna estado atual da rotação.

**Response:**
```json
{
  "success": true,
  "state": {
    "active_tunnel": "Galio",
    "last_rotation": 1711234567890,
    "total_server_actions": 5,
    "total_stream_actions": 40,
    "uptime_seconds": 4567890
  }
}
```

---

### 8. Authentication (Fase 2 - UI)

#### POST `/login`

Autentica usuário e retorna cookie de sessão.

**Request:**
```json
{
  "password": "chave-de-acesso-secreta"
}
```

---

## Turso Database API (Atualizado v2.1)

### Queries Atualizadas

#### Get Account with Available Slots (Sem account_type)

```sql
SELECT *
FROM gaccounts
WHERE slots_used < slots_max
ORDER BY slots_used ASC, RANDOM()
LIMIT 1;
```

**MUDANÇA v2.1:** Removida cláusula `account_type` - mesma conta pode rodar ambos.

#### Get Account with Specific Repo Type

```sql
SELECT username, server_repo_name, server_workflow_name, server_repo_url
FROM gaccounts
WHERE slots_used < slots_max
ORDER BY slots_used ASC, RANDOM()
LIMIT 1;
```

#### Insert New Account (v2.1)

```sql
INSERT INTO gaccounts (
  username, token, repo_owner,
  server_repo_name, server_repo_url, server_workflow_name,
  stream_repo_name, stream_repo_url, stream_workflow_name,
  fictional_name, slots_used, slots_max,
  server_actions_count, stream_actions_count,
  last_active, created_at
) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, 20, 0, 0, 0, ?);
```

---

## Error Codes

| Code | Description |
|------|-------------|
| 200 | Success |
| 201 | Created |
| 202 | Accepted |
| 400 | Bad Request |
| 401 | Unauthorized |
| 404 | Not Found |
| 409 | Conflict |
| 429 | Too Many Requests (Rate Limited) |
| 500 | Internal Server Error |

---

**Última Atualização:** 23/03/2026
**Versão:** 2.1.0 (Atualizada com 2 repos por conta, sem account_type)
