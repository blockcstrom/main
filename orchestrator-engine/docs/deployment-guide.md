# 🚀 Deployment Guide - Orchestrator Engine

## Visão Geral

Guia completo para deploy do Orchestrator Engine em produção via Cloudflare Workers.

---

## Pré-requisitos

### Ferramentas Necessárias

- **Node.js** >= 18.0
- **npm** >= 9.0
- **Wrangler CLI** >= 3.0
- **Turso CLI** >= 1.0
- **Cloudflare CLI** (opcional, cloudflared) >= 2024.3

### Contas Necessárias

- [ ] Conta Cloudflare
- [ ] Conta GitHub
- [ ] Conta Turso

---

## Checklist de Preparação

### 1. Configuração Cloudflare

- [ ] Registrar domínio `kill-kick.shop` no Cloudflare
- [ ] Obter Zone ID
- [ ] Criar registro CNAME `controller`
- [ ] Criar tunnels Galio e Borio
- [ ] Obter tokens dos tunnels
- [ ] Criar API Token (Edit Zone DNS)
- [ ] Obter DNS Record ID

### 2. Configuração Turso

- [ ] Criar banco de dados `orchestrator-engine`
- [ ] Obter DB URL
- [ ] Criar token de autenticação
- [ ] Executar schema.sql

### 3. Configuração GitHub

- [ ] Criar repositório público (para testing)
- [ ] Criar workflow template
- [ ] Gerar GitHub PAT

---

## Passo a Passo de Setup

### Passo 1: Configurar Cloudflare

#### 1.1 Registrar Domínio

1. Acesse: https://dash.cloudflare.com
2. Clique em "Add a Site"
3. Digite `kill-kick.shop`
4. Selecione plano Free
5. Copie nameservers fornecidos
6. Atualize no registrador do domínio

#### 1.2 Obter Zone ID

1. Vá para Dashboard → `kill-kick.shop`
2. Na sidebar direita, copie `Zone ID`
3. Formato: `abc123def456...`
4. Salve para uso futuro

#### 1.3 Criar Registro CNAME

1. Vá para DNS → Records
2. Clique em "Add Record"
3. Configurações:
   - Type: `CNAME`
   - Name: `controller`
   - Target: `placeholder.cfargotunnel.com`
   - Proxy status: `Proxied` (orange cloud)
   - TTL: `Auto`
4. Clique em "Save"

#### 1.4 Criar Tunnels

```bash
# Instalar cloudflared
wget -q https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64 -O cloudflared
chmod +x cloudflared

# Autenticar (abre browser)
./cloudflared tunnel login

# Criar tunnel Galio
./cloudflared tunnel create galio
# Output:
# Created tunnel galio with id: abc12345-6789-abcd-ef01-234567890abc
# Your tunnel has been created! You can start it by running:
#   cloudflared tunnel run galio

# Criar tunnel Borio
./cloudflared tunnel create borio
# Output similar...

# Obter tokens
./cloudflared tunnel token galio
# Copie o token (format: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...)

./cloudflared tunnel token borio
# Copie o token
```

**Salvar IDs dos tunnels:**
- GALIO_TUNNEL_ID: `abc12345-6789-abcd-ef01-234567890abc.cfargotunnel.com`
- BORIO_TUNNEL_ID: `def67890-1234-abcd-ef01-234567890def.cfargotunnel.com`

#### 1.5 Criar API Token Cloudflare

1. Acesse: https://dash.cloudflare.com/profile/api-tokens
2. Clique em "Create Token"
3. Selecione template: `Edit Zone DNS`
4. Configurações:
   - **Zone Resources:** `kill-kick.shop` → `Include`
   - **Client IP Address Filtering:** (opcional)
5. Clique em "Continue to summary" → "Create Token"
6. Copie o token gerado
7. Formato: `Bearer abc123...`

#### 1.6 Obter DNS Record ID

**Opção A: Via API**
```bash
curl -X GET "https://api.cloudflare.com/client/v4/zones/<ZONE_ID>/dns_records?name=controller.kill-kick.shop&type=CNAME" \
  -H "Authorization: Bearer <API_TOKEN>"
```

Resposta:
```json
{
  "success": true,
  "result": [{
    "id": "1234567890abcdef",
    "type": "CNAME",
    "name": "controller.kill-kick.shop",
    "content": "placeholder.cfargotunnel.com"
  }]
}
```

Copie o `id`.

**Opção B: Via Browser DevTools**
1. Vá para DNS Records no dashboard
2. Abra DevTools → Network tab
3. Clique no registro `controller`
4. Filtre por `dns_records`
5. Copie o `id` do response

---

### Passo 2: Configurar Turso

#### 2.1 Instalar Turso CLI

```bash
curl -sSfL https://get.tur.so/install.sh | bash
```

#### 2.2 Criar Banco de Dados

```bash
# Criar banco
turso db create orchestrator-engine --group default

# Output:
# Database created!
# DB URL: libsql://orchestrator-engine-username.turso.io
```

Copie a DB URL.

#### 2.3 Criar Token de Autenticação

```bash
turso db tokens create orchestrator-engine --readwrite
```

Output:
```bash
eyJhbGciOiJFUzI1NiIsInR5cCI6IkpXVCJ9...
```

Copie o token.

#### 2.4 Executar Schema

```bash
# Salvar schema.sql e executar
turso db shell orchestrator-engine --file schema.sql
```

Ou executar diretamente:

```bash
turso db execute orchestrator-engine --command "
CREATE TABLE IF NOT EXISTS gaccounts (
  username TEXT PRIMARY KEY,
  token TEXT NOT NULL,
  repo_owner TEXT NOT NULL,
  repo_name TEXT NOT NULL,
  workflows_json TEXT NOT NULL,
  fictional_name TEXT NOT NULL,
  slots_used INTEGER NOT NULL DEFAULT 0,
  last_active INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS orchestrator_state (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS login_attempts (
  ip TEXT PRIMARY KEY,
  attempts INTEGER NOT NULL DEFAULT 0,
  last_attempt INTEGER NOT NULL DEFAULT 0
);

INSERT OR IGNORE INTO orchestrator_state (key, value) VALUES ('active_tunnel', 'Galio');
INSERT OR IGNORE INTO orchestrator_state (key, value) VALUES ('last_rotation', '0');
"
```

#### 2.5 Verificar

```bash
turso db shell orchestrator-engine --command "SELECT * FROM orchestrator_state;"
```

Output:
```
| key            | value          |
|----------------|----------------|
| active_tunnel  | Galio          |
| last_rotation  | 0              |
```

---

### Passo 3: Configurar GitHub

#### 3.1 Criar Repositório (Testing)

1. Acesse: https://github.com/new
2. Nome: `orchestrator-test`
3. Visibility: `Public`
4. Clique em "Create repository"

#### 3.2 Criar Workflow Template

1. No repositório, crie arquivo: `.github/workflows/ci.yml`
2. Conteúdo:

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

3. Commit e push

#### 3.3 Gerar GitHub PAT

1. Acesse: https://github.com/settings/tokens
2. Clique em "Generate new token" → "Generate new token (classic)"
3. Configurações:
   - **Note:** `Orchestrator Engine`
   - **Expiration:** `No expiration`
   - **Scopes:**
     - `repo` (full control of private repositories)
     - `workflow` (update GitHub Action workflows)
4. Clique em "Generate token"
5. Copie o token (formato: `ghp_xxxxxxxxxxxxxxxx`)

---

### Passo 4: Configurar Environment Variables

#### 4.1 Criar .env

```bash
cp .env.example .env
```

#### 4.2 Preencher Credenciais

```bash
# TURSO DATABASE
TURSO_DB_URL=libsql://orchestrator-engine-username.turso.io
TURSO_DB_AUTH_TOKEN=eyJhbGciOiJFUzI1NiIsInR5cCI6IkpXVCJ9...

# CLOUDFLARE
CLOUDFLARE_ZONE_ID=abc123def456...
CLOUDFLARE_API_TOKEN=Bearer abc123...
DNS_RECORD_ID=1234567890abcdef
GALIO_TUNNEL_ID=abc12345-6789-abcd-ef01-234567890abc.cfargotunnel.com
GALIO_TOKEN=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
BORIO_TUNNEL_ID=def67890-1234-abcd-ef01-234567890def.cfargotunnel.com
BORIO_TOKEN=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
TARGET_DOMAIN=controller.kill-kick.shop

# ROTATION
ROTATION_INTERVAL_MINUTES=340
ROTATION_JITTER_MINUTES=10
HEALTH_CHECK_RETRIES=15
HEALTH_CHECK_INTERVAL_SECONDS=10

# SECURITY
BASIC_AUTH_USER=admin
BASIC_AUTH_PASS=your-secure-password-here
```

---

### Passo 5: Deploy Local (Testing)

#### 5.1 Instalar Dependências

```bash
npm install
```

#### 5.2 Build

```bash
npm run build
```

#### 5.3 Testar Localmente

```bash
wrangler dev
```

Acesse: http://localhost:8787

Testar endpoints:
```bash
curl http://localhost:8787/
curl http://localhost:8787/health
```

---

### Passo 6: Deploy em Produção

#### 6.1 Login no Wrangler

```bash
wrangler login
```

Abre browser para autenticação.

#### 6.2 Criar Worker

```bash
wrangler deploy
```

Output:
```bash
⛅️ wrangler 3.30.0
-------------------
Uploading orchestrator-engine...
Uploaded orchestrator-engine (0.97 sec)
Deploying orchestrator-engine...
Published orchestrator-engine
  https://orchestrator-engine.username.workers.dev
Current Version ID: 1234567890abcdef
```

#### 6.3 Testar Worker

```bash
# Substitua pela URL do seu worker
curl https://orchestrator-engine.username.workers.dev/
curl https://orchestrator-engine.username.workers.dev/health
```

---

### Passo 7: Inserir Conta GitHub (Manual)

#### 7.1 Via Turso CLI

```bash
turso db execute orchestrator-engine --command "
INSERT INTO gaccounts (
  username,
  token,
  repo_owner,
  repo_name,
  workflows_json,
  fictional_name,
  slots_used,
  last_active
) VALUES (
  'seu-username-github',
  'ghp_seu_token_aqui',
  'seu-username-github',
  'orchestrator-test',
  '[\"ci.yml\"]',
  'Teste',
  0,
  0
);
"
```

#### 7.2 Verificar

```bash
turso db shell orchestrator-engine --command "SELECT username, fictional_name, slots_used FROM gaccounts;"
```

---

## Monitoramento

### Ver Logs

```bash
# Via Wrangler
wrangler tail
```

Output:
```bash
GET / 200 OK (1ms)
GET /health 200 OK (2ms)
Starting rotation...
Workflow triggered, waiting for tunnel to come online...
Tunnel is online!
DNS updated successfully
Rotation completed successfully
```

### Ver DNS

```bash
# Verificar CNAME
dig controller.kill-kick.shop +short
```

Output:
```
abc12345-6789-abcd-ef01-234567890abc.cfargotunnel.com
```

### Ver Health Check

```bash
curl https://controller.kill-kick.shop/health
```

---

## Troubleshooting

### Problema: Worker não roda CRON

**Solução:**
```bash
# Verificar CRON configuration
wrangler tail

# Verificar logs de erro
```

### Problema: DNS não atualiza

**Solução:**
- Verificar API Token (permissões)
- Verificar Zone ID
- Verificar DNS Record ID

### Problema: Health check falha

**Solução:**
- Verificar se tunnel está rodando
- Verificar token do tunnel
- Verificar se workflow GitHub está funcionando

### Problema: GitHub Action timeout

**Solução:**
- Aumentar `timeout-minutes` no workflow
- Verificar comandos shell
- Verificar logs da Action no GitHub

---

## Rollback

### Reverter para versão anterior

```bash
# Ver versões
wrangler versions list

# Deploy versão anterior
wrangler deploy --version-id <version-id>
```

---

## Cleanup

### Remover tudo (se necessário)

```bash
# Deletar Worker
wrangler delete orchestrator-engine

# Deletar DB Turso
turso db delete orchestrator-engine

# Deletar tunnels Cloudflare
cloudflared tunnel delete galio
cloudflared tunnel delete borio

# Deletar registro DNS
# Via Cloudflare Dashboard
```

---

## Security Checklist

- [ ] Alterar `BASIC_AUTH_PASS` para valor seguro
- [ ] Não commitar `.env`
- [ ] Adicionar `.env` ao `.gitignore`
- [ ] Usar tokens com permissões mínimas necessárias
- [ ] Habilitar 2FA em todas as contas
- [ ] Rotacionar tokens periodicamente

---

**Última Atualização:** 23/03/2026
