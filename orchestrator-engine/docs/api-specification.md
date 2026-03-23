# 📡 API Specification - Orchestrator Engine (Updated v2.2)

## Visão Geral

API HTTP atualizada do Orchestrator Engine exposta via Cloudflare Worker usando framework Hono, com suporte a 2 repositórios por conta (A-Server + A-Stream), A-Boot e separação FIXA de slots (1 A-Server + 19 A-Stream).

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
  "version": "2.2.0",
  "active_tunnel": "Galio"
}
```

---

### 3. Register New G-Account (ATUALIZADO v2.2)

#### POST `/api/accounts/register`

Provisiona uma nova G-Account automaticamente EXCLUINDO todos os repositórios existentes, criando 2 novos repositórios + 2 workflows e disparando o A-Boot.

**Request:**
```json
{
  "token": "ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
}
```

**Headers:**
- `X-Requested-With: Orchestrator-UI` (CSRF protection)

**Response (201 Created):**
```json
{
  "success": true,
  "message": "Account provisioned successfully with A-Boot",
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
    "server_slots_used": 0,
    "server_slots_max": 1,
    "stream_slots_used": 0,
    "stream_slots_max": 19,
    "total_slots_used": 0,
    "total_slots_max": 20,
    "server_actions_count": 0,
    "stream_actions_count": 0,
    "boot_completed": 0
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

500 Internal Server Error:
```json
{
  "success": false",
  "error": "Failed to create repositories or dispatch A-Boot"
}
```

---

### 4. Get Pool Statistics (ATUALIZADO v2.2)

#### GET `/api/accounts/pool`

Retorna estatísticas do pool de G-Accounts com separação FIXA de slots.

**Response:**
```json
{
  "success": true,
  "statistics": {
    "total_accounts": 10,
    "total_repositories": 20,
    "total_slots": 200,
    "used_slots": 45,
    "available_slots": 155,
    "server_slots_available": 3,
    "stream_slots_available": 147,
    "total_server_actions": 5,
    "total_stream_actions": 40
  }
}
```

---

## Turso Database API (ATUALIZADO v2.2)

### Queries Atualizadas

#### Get Account with Server Slots Available

```sql
SELECT *
FROM gaccounts
WHERE server_slots_used < server_slots_max
ORDER BY server_slots_used ASC, RANDOM()
LIMIT 1;
```

#### Get Account with Stream Slots Available

```sql
SELECT *
FROM gaccounts
WHERE stream_slots_used < stream_slots_max
ORDER BY stream_slots_used ASC, RANDOM()
LIMIT 1;
```

#### Increment Server Slots

```sql
UPDATE gaccounts
SET server_slots_used = server_slots_used + 1,
    total_slots_used = total_slots_used + 1,
    server_actions_count = server_actions_count + 1,
    last_active = ?
WHERE username = ?;
```

#### Increment Stream Slots

```sql
UPDATE gaccounts
SET stream_slots_used = stream_slots_used + 1,
    total_slots_used = total_slots_used + 1,
    stream_actions_count = stream_actions_count + 1,
    last_active = ?
WHERE username = ?;
```

#### Mark Boot as Completed

```sql
UPDATE gaccounts
SET boot_completed = 1
WHERE username = ?;
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

## Versioning

API versionada via URL path (future):

```
/api/v1/accounts
/api/v2/accounts
```

Atual: v2 (implícito)

---

**Última Atualização:** 23/03/2026
**Versão:** 2.2.0 (Atualizada com A-Boot, exclusão de repos, separação FIXA de slots)
