# 📊 Resumo de Atualizações v2.1 - Orchestrator Engine

## 🎉 Documentação v2.1 Completa!

Atualizações baseadas nas mudanças do arquivo `conteudo-adicional.md`.

---

## 🔄 Mudanças Principais v2.0 → v2.1

### 1. Estrutura de Contas (MAJOR CHANGE)

**v2.0:**
- Contas classificadas como 'server' ou 'stream'
- Cada conta tinha 1 repositório

**v2.1:**
- **Todas as contas podem fazer papel tanto de A-Server quanto de A-Stream**
- **1 repo é A-Server e outro repo é A-Stream** na mesma conta
- Coluna `account_type` **REMOVIDA**

### 2. Sistema de Nomes (ATUALIZADO)

**v2.0:**
- 1 deck + hash sequencial
- Nomes de repos e workflows misturados

**v2.1:**
- **2 decks separados:**
  - **Deck 1: Core Repo Names** (CI, Builder, Build, Cloud, Cripto...)
  - **Deck 2: Core YML Names** (CI, Security, Deploy, Lint, Format...)
- Lógica: Palavras base são combinadas com sufixos
- Exemplos:
  - Repos: `CI-pipeline-123`, `Builder-engine-456`
  - YMLs: `ci-server-456.yml`, `deploy-stream-789.yml`

---

## 📊 Schema do Banco de Dados (Atualizado v2.1)

### Colunas em `gaccounts` (v2.1)

**REMOVIDAS:**
- ❌ `account_type` - não é mais necessário

**NOVAS/ATUALIZADAS:**
- ✅ `server_repo_name` - Nome do repositório A-Server
- ✅ `server_repo_url` - URL do repositório A-Server
- ✅ `server_workflow_name` - Nome do workflow A-Server
- ✅ `stream_repo_name` - Nome do repositório A-Stream
- ✅ `stream_repo_url` - URL do repositório A-Stream
- ✅ `stream_workflow_name` - Nome do workflow A-Stream

### Schema Comparativo

| Coluna | v2.0 | v2.1 |
|--------|-------|-------|
| `account_type` | ✅ Existia | ❌ **REMOVIDO** |
| `repo_name` | 1 nome | ❌ Removida |
| `repo_url` | 1 URL | ❌ Removida |
| `workflows_json` | JSON array | ❌ Removida |
| `server_repo_name` | ❌ Não existia | ✅ **NOVA** |
| `server_repo_url` | ❌ Não existia | ✅ **NOVA** |
| `server_workflow_name` | ❌ Não existia | ✅ **NOVA** |
| `stream_repo_name` | ❌ Não existia | ✅ **NOVA** |
| `stream_repo_url` | ❌ Não existia | ✅ **NOVA** |
| `stream_workflow_name` | ❌ Não existia | ✅ **NOVA** |

---

## 🚀 API Updates (v2.1)

### POST /api/accounts/register

**v2.0 Request:**
```json
{
  "token": "ghp_...",
  "account_type": "server"  // ← OBRIGATÓRIO
}
```

**v2.1 Request:**
```json
{
  "token": "ghp_..."  // ← APENAS TOKEN
}
```

**v2.1 Response:**
```json
{
  "success": true,
  "account": {
    "username": "github-user",
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

## 📁 Arquivos Atualizados/Criados (v2.1)

### 🔹 Documentação Principal (v2.1)
1. `ADDITIONAL_REQUIREMENTS.md` - Atualizado v2.1
2. `UPDATE_SUMMARY_V21.md` - Este arquivo

### 🔹 Documentação Técnica (v2.1)
3. `docs/database-schema-v21.md` - Schema atualizado v2.1
4. `docs/architecture-v21.md` - Arquitetura atualizada v2.1
5. `docs/api-specification-v21.md` - API atualizada v2.1

### 🔹 Documentação Mantida (v2.0 - Para referência)
- `planner-updated.md`
- `README-updated.md`
- `docs/architecture-updated.md`
- `docs/database-schema-updated.md`
- `docs/api-specification-updated.md`

---

## 🎯 Distribuição de Repositórios (v2.1)

```
Conta 1 (G-Account):
├── repo-server (A-Server) ← VM principal
└── repo-stream (A-Stream) ← Operacional

Conta 2 (G-Account):
├── repo-server (A-Server) ← VM principal
└── repo-stream (A-Stream) ← Operacional
```

**Regra:** Cada conta tem 2 repositórios, mas apenas 20 Actions simultâneas no total.

---

## 🔢 Exemplos de Nomes (v2.1)

### Repositórios A-Server
- `CI-pipeline-123`
- `Builder-toolkit-456`
- `Cloud-system-789`
- `Cripto-framework-101`

### Repositórios A-Stream
- `Build-engine-234`
- `Microservices-service-567`
- `Distributed-worker-890`
- `Quantum-handler-123`

### Workflows A-Server
- `ci-server-456.yml`
- `security-server-789.yml`
- `deploy-server-101.yml`

### Workflows A-Stream
- `test-stream-234.yml`
- `lint-stream-567.yml`
- `format-stream-890.yml`

---

## 📊 Queries SQL (Comparativo)

### v2.0
```sql
-- Selecionar conta A-Server
SELECT * FROM gaccounts
WHERE account_type = 'server' AND slots_used < slots_max;

-- Selecionar conta A-Stream
SELECT * FROM gaccounts
WHERE account_type = 'stream' AND slots_used < slots_max;
```

### v2.1
```sql
-- Selecionar qualquer conta (pode rodar ambos)
SELECT * FROM gaccounts
WHERE slots_used < slots_max
ORDER BY slots_used ASC, RANDOM();
```

---

## 🔒 Segurança

Mantida de v2.0 - sem mudanças.

---

## 🚀 Próximos Passos

1. ✅ Documentação v2.1 criada
2. ⏳ Atualizar IMPLEMENTATION_CHECKLIST.md com v2.1
3. ⏳ Validar arquitetura v2.1 com usuário
4. ⏳ Setup de infraestrutura
5. ⏳ Implementação do Core Engine v2.1

---

**Última Atualização:** 23/03/2026
**Versão:** 2.1.0
**Status:** ✅ Documentação v2.1 Completa
**Próximo Passo:** Validar arquitetura v2.1 com usuário
