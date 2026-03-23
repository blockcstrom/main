# 📡 API Specification - Orchestrator Engine (Updated)

## Visão Geral

API HTTP atualizada do Orchestrator Engine exposta via Cloudflare Worker usando framework Hono, com suporte a A-Server, A-Stream, cadastro automático e mimetismo.

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
  "version": "2.0.0",
  "active_tunnel": "Galio"
}
```

---

### 3. Register New G-Account (CADASTRO SIMPLIFICADO)

#### POST `/api/accounts/register`

Provisiona uma nova G-Account automaticamente criando repositório e workflow.

**Request:**
```json
{
  "token": "ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
  "account_type": "server"
}
```

**Parameters:**
- `token` (required): GitHub Personal Access Token
- `account_type` (required): "server" ou "stream"

**Headers:**
- `X-Requested-With: Orchestrator-UI` (CSRF protection)

**Response (201 Created):**
```http
HTTP/1.1 201 Created
Content-Type: application/json

{
  "success": true,
  "message": "Account provisioned successfully",
  "account": {
    "username": "github-user",
    "repo_owner": "github-user",
    "repo_name": "CI-Implementation-planner-123",
    "repo_url": "https://github.com/github-user/CI-Implementation-planner-123",
    "workflows": ["ci-build-test-456.yml"],
    "fictional_name": "Alpha",
    "account_type": "server",
    "slots_used": 0,
    "slots_max": 20,
    "server_actions_count": 0,
    "stream_actions_count": 0,
    "last_active": 0,
    "created_at": 1711234567890
  }
}
```

**Error Responses:**

400 Bad Request (Invalid token):
```json
{
  "success": false,
  "error": "Invalid GitHub token"
}
```

400 Bad Request (Invalid account_type):
```json
{
  "success": false,
  "error": "account_type must be 'server' or 'stream'"
}
```

401 Unauthorized:
```json
{
  "success": false,
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
  "error": "Failed to create repository"
}
```

---

### 4. List Accounts

#### GET `/api/accounts`

Lista todas as G-Accounts cadastradas.

**Authentication:** Cookie `orchestrator_session` required

**Response:**
```json
{
  "success": true,
  "accounts": [
    {
      "username": "user1",
      "repo_owner": "user1",
      "repo_name": "CI-Implementation-planner-123",
      "repo_url": "https://github.com/user1/CI-Implementation-planner-123",
      "workflows": ["ci-build-test-456.yml"],
      "fictional_name": "Alfa",
      "account_type": "server",
      "slots_used": 1,
      "slots_max": 20,
      "server_actions_count": 1,
      "stream_actions_count": 0,
      "last_active": 1711234567890,
      "created_at": 1711230000000
    },
    {
      "username": "user2",
      "repo_owner": "user2",
      "repo_name": "Js-library-json-456",
      "repo_url": "https://github.com/user2/Js-library-json-456",
      "workflows": ["interpreter-ci-cd-789.yml"],
      "fictional_name": "Beta",
      "account_type": "stream",
      "slots_used": 15,
      "slots_max": 20,
      "server_actions_count": 0,
      "stream_actions_count": 15,
      "last_active": 1711234600000,
      "created_at": 1711220000000
    }
  ]
}
```

**Error Response (401):**
```json
{
  "success": false,
  "error": "Unauthorized"
}
```

---

### 5. Get Account Details

#### GET `/api/accounts/:username`

Retorna detalhes de uma conta específica.

**Authentication:** Cookie `orchestrator_session` required

**Response:**
```json
{
  "success": true,
  "account": {
    "username": "user1",
    "repo_owner": "user1",
    "repo_name": "CI-Implementation-planner-123",
    "repo_url": "https://github.com/user1/CI-Implementation-planner-123",
    "workflows": ["ci-build-test-456.yml"],
    "fictional_name": "Alfa",
    "account_type": "server",
    "slots_used": 1,
    "slots_max": 20,
    "server_actions_count": 1,
    "stream_actions_count": 0,
    "last_active": 1711234567890,
    "created_at": 1711230000000
  }
}
```

**Error Response (404):**
```json
{
  "success": false,
  "error": "Account not found"
}
```

---

### 6. Delete Account

#### DELETE `/api/accounts/:username`

Remove uma G-Account do sistema.

**Authentication:** Cookie `orchestrator_session` required

**Headers:**
- `X-Requested-With: Orchestrator-UI` (CSRF protection)

**Response:**
```http
HTTP/1.1 200 OK
Content-Type: application/json

{
  "success": true,
  "message": "Account deleted successfully"
}
```

**Error Responses:**

401 Unauthorized:
```json
{
  "success": false",
  "error": "Unauthorized"
}
```

404 Not Found:
```json
{
  "success": false",
  "error": "Account not found"
}
```

---

### 7. Get Pool Statistics (NOVO)

#### GET `/api/accounts/pool`

Retorna estatísticas do pool de G-Accounts.

**Authentication:** Cookie `orchestrator_session` required

**Response:**
```json
{
  "success": true,
  "statistics": {
    "total_accounts": 10,
    "server_accounts": 5,
    "stream_accounts": 5,
    "total_slots": 200,
    "used_slots": 45,
    "available_slots": 155,
    "total_server_actions": 5,
    "total_stream_actions": 40,
    "healthy_accounts": 9,
    "full_accounts": 1
  }
}
```

**Error Response (401):**
```json
{
  "success": false",
  "error": "Unauthorized"
}
```

---

### 8. Get System State (ATUALIZADO)

#### GET `/api/state`

Retorna estado atual da rotação e estatísticas globais.

**Authentication:** Cookie `orchestrator_session` required

**Response:**
```json
{
  "success": true,
  "state": {
    "active_tunnel": "Galio",
    "last_rotation": 1711234567890,
    "total_server_actions": 45,
    "total_stream_actions": 123,
    "last_health_check": 1711234567890,
    "system_uptime_start": 1711230000000,
    "uptime_seconds": 4567890
  }
}
```

**Error Response (401):**
```json
{
  "success": false",
  "error": "Unauthorized"
}
```

---

### 9. Reset Account Slots (NOVO)

#### POST `/api/accounts/:username/reset`

Reseta os slots de uma conta (força disponibilidade).

**Authentication:** Cookie `orchestrator_session` required

**Headers:**
- `X-Requested-With: Orchestrator-UI` (CSRF protection)

**Response:**
```http
HTTP/1.1 200 OK
Content-Type: application/json

{
  "success": true,
  "message": "Account slots reset successfully",
  "account": {
    "username": "user1",
    "slots_used": 0,
    "server_actions_count": 0,
    "stream_actions_count": 0
  }
}
```

**Error Responses:**

401 Unauthorized:
```json
{
  "success": false",
  "error": "Unauthorized"
}
```

404 Not Found:
```json
{
  "success": false",
  "error": "Account not found"
}
```

---

### 10. Get Rotation Logs (NOVO)

#### GET `/api/logs/rotations`

Retorna logs de rotações recentes.

**Authentication:** Cookie `orchestrator_session` required

**Query Parameters:**
- `limit` (optional, default: 100): Número máximo de logs
- `success_only` (optional, default: false): Filtrar apenas rotações bem-sucedidas

**Response:**
```json
{
  "success": true,
  "logs": [
    {
      "id": 1,
      "from_tunnel": "Borio",
      "to_tunnel": "Galio",
      "account_username": "user1",
      "action_type": "server",
      "success": true,
      "timestamp": 1711234567890,
      "duration_ms": 150000
    },
    {
      "id": 2,
      "from_tunnel": "Galio",
      "to_tunnel": "Borio",
      "account_username": "user2",
      "action_type": "stream",
      "success": false,
      "timestamp": 1711234000000,
      "duration_ms": 300000,
      "error_message": "Health check failed after 15 attempts"
    }
  ]
}
```

**Error Response (401):**
```json
{
  "success": false",
  "error": "Unauthorized"
}
```

---

### 11. Authentication (Fase 2 - UI)

#### POST `/login`

Autentica usuário e retorna cookie de sessão.

**Request:**
```json
{
  "password": "chave-de-acesso-secreta"
}
```

**Response:**
```http
HTTP/1.1 200 OK
Set-Cookie: orchestrator_session=eyJ...; Path=/; HttpOnly; Secure; SameSite=Strict
Content-Type: application/json

{
  "success": true,
  "message": "Login successful"
}
```

**Error Response (401):**
```json
{
  "success": false",
  "error": "Invalid password"
}
```

**Error Response (429 - Rate Limited):**
```json
{
  "success": false",
  "error": "Too many attempts. Try again in 30 minutes."
}
```

---

## Internal API (Worker ↔ External Services)

### GitHub API - Register Account

#### Validate Token

```
GET https://api.github.com/user
Authorization: token {github_pat}
Accept: application/vnd.github.v3+json
```

**Response:**
```json
{
  "login": "github-user",
  "id": 12345678,
  "type": "User"
}
```

#### Create Repository

```
POST https://api.github.com/user/repos
Authorization: token {github_pat}
Content-Type: application/json

{
  "name": "CI-Implementation-planner-123",
  "description": "A comprehensive CI/CD planning tool",
  "private": false,
  "auto_init": false
}
```

**Response:**
```json
{
  "id": 45678901,
  "name": "CI-Implementation-planner-123",
  "full_name": "github-user/CI-Implementation-planner-123",
  "clone_url": "https://github.com/github-user/CI-Implementation-planner-123.git",
  "private": false
}
```

#### Create Workflow

```
PUT https://api.github.com/repos/{owner}/{repo}/contents/.github/workflows/{workflow_name}
Authorization: token {github_pat}
Content-Type: application/json

{
  "message": "Add workflow",
  "content": "base64_encoded_content"
}
```

#### Upload Files (Mimetismo)

```
PUT https://api.github.com/repos/{owner}/{repo}/contents/{path}
Authorization: token {github_pat}
Content-Type: application/json

{
  "message": "Add {filename}",
  "content": "base64_encoded_content"
}
```

---

### GitHub API - Dispatch Workflow

#### Dispatch Workflow

```
POST https://api.github.com/repos/{owner}/{repo}/actions/workflows/{workflow}/dispatches
Authorization: token {github_pat}
Content-Type: application/json

{
  "ref": "main",
  "inputs": {
    "commands": "{base64_encoded_commands}"
  }
}
```

**Response:**
```http
HTTP/1.1 204 No Content
```

---

### Cloudflare API

#### Update DNS Record

```
PATCH https://api.cloudflare.com/client/v4/zones/{zone_id}/dns_records/{record_id}
Authorization: Bearer {api_token}
Content-Type: application/json

{
  "type": "CNAME",
  "name": "controller",
  "content": "{tunnel_hostname}",
  "ttl": 1,
  "proxied": true
}
```

**Response:**
```json
{
  "success": true,
  "result": {
    "id": "1234567890abcdef",
    "type": "CNAME",
    "name": "controller.kill-kick.shop",
    "content": "uuid-galio.cfargotunnel.com",
    "proxied": true,
    "ttl": 1
  }
}
```

---

## Turso Database API

### Queries Atualizadas

#### Get Account with Available Slots (A-Server)

```sql
SELECT *
FROM gaccounts
WHERE account_type = 'server'
  AND slots_used < slots_max
ORDER BY slots_used ASC, RANDOM()
LIMIT 1;
```

#### Get Account with Available Slots (A-Stream)

```sql
SELECT *
FROM gaccounts
WHERE account_type = 'stream'
  AND slots_used < slots_max
ORDER BY slots_used ASC, RANDOM()
LIMIT 1;
```

#### Increment Slots (A-Server)

```sql
UPDATE gaccounts
SET slots_used = slots_used + 1,
    server_actions_count = server_actions_count + 1,
    last_active = ?
WHERE username = ?;
```

#### Increment Slots (A-Stream)

```sql
UPDATE gaccounts
SET slots_used = slots_used + 1,
    stream_actions_count = stream_actions_count + 1,
    last_active = ?
WHERE username = ?;
```

#### Reset Account Slots

```sql
UPDATE gaccounts
SET slots_used = 0,
    server_actions_count = 0,
    stream_actions_count = 0
WHERE username = ?;
```

#### Get Pool Statistics

```sql
SELECT
  COUNT(*) as total_accounts,
  SUM(CASE WHEN account_type = 'server' THEN 1 ELSE 0 END) as server_accounts,
  SUM(CASE WHEN account_type = 'stream' THEN 1 ELSE 0 END) as stream_accounts,
  SUM(slots_max) as total_slots,
  SUM(slots_used) as used_slots,
  SUM(slots_max - slots_used) as available_slots,
  SUM(server_actions_count) as total_server_actions,
  SUM(stream_actions_count) as total_stream_actions,
  SUM(CASE WHEN slots_used < slots_max THEN 1 ELSE 0 END) as healthy_accounts,
  SUM(CASE WHEN slots_used >= slots_max THEN 1 ELSE 0 END) as full_accounts
FROM gaccounts;
```

#### Get Rotation Logs

```sql
SELECT *
FROM rotation_logs
ORDER BY timestamp DESC
LIMIT ?;
```

#### Insert Rotation Log

```sql
INSERT INTO rotation_logs (
  from_tunnel, to_tunnel, account_username, action_type, success, timestamp, duration_ms, error_message
) VALUES (?, ?, ?, ?, ?, ?, ?, ?);
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
| 502 | Bad Gateway (Health Check Failed) |
| 503 | Service Unavailable |

---

## Rate Limiting

| Endpoint | Limit | Window |
|----------|-------|--------|
| `POST /login` | 5 | IP, 30min |
| `POST /api/accounts/register` | 10 | IP, 1h |
| `DELETE /api/accounts/:username` | 20 | Account, 1h |
| `POST /api/accounts/:username/reset` | 5 | Account, 1h |
| `GET /api/accounts/pool` | 100 | IP, 1h |
| `GET /api/logs/rotations` | 100 | IP, 1h |

---

## CSRF Protection

Todos os endpoints POST e DELETE devem incluir o header:

```
X-Requested-With: Orchestrator-UI
```

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
**Versão:** 2.0.0 (Atualizada com A-Server/A-Stream, cadastro automático, mimetismo)
