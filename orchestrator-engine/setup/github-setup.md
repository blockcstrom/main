# 🐙 GitHub Setup Guide

## Visão Geral

Guia detalhado para configurar GitHub Actions e tokens para o Orchestrator Engine.

---

## 📋 Pré-requisitos

- [ ] Conta GitHub
- [ ] Repositório público (para usar Actions ilimitadas)
- [ ] Acesso a criar Personal Access Tokens

---

## 1. Criar Repositório

### Passo 1: Criar Novo Repositório

1. Acesse: https://github.com/new
2. Preencha:
   - **Repository name:** `orchestrator-test` (ou outro nome)
   - **Description:** `Orchestrator Engine Test`
   - **Visibility:** ✅ **Public**
   - **Initialize:** Não é necessário

3. Clique em **"Create repository"**

### Passo 2: Clonar (Opcional)

```bash
git clone https://github.com/seu-usuario/orchestrator-test.git
cd orchestrator-test
```

---

## 2. Criar Workflow Template

O workflow define como a "VM" (Action) vai executar os comandos.

### Passo 1: Criar Estrutura de Diretórios

```bash
mkdir -p .github/workflows
```

### Passo 2: Criar Workflow

Crie arquivo `.github/workflows/ci.yml`:

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

### Passo 3: Commit e Push

```bash
git add .github/workflows/ci.yml
git commit -m "Add CI workflow"
git push
```

### Passo 4: Testar Workflow

1. Vá para repositório no GitHub
2. Clique em **"Actions"**
3. Encontre workflow `CI Pipeline`
4. Clique em **"Run workflow"**
5. No input `commands`, digite qualquer texto (não importa por enquanto)
6. Clique em **"Run workflow"**

**Resultado:** Workflow deve executar (com erro esperado, pois comandos não são válidos).

---

## 3. Gerar Personal Access Token (PAT)

O PAT permite que o Orchestrator Engine dispare workflows programaticamente.

### Passo 1: Acessar Tokens

1. Acesse: https://github.com/settings/tokens
2. Clique em **"Generate new token"** → **"Generate new token (classic)"**

### Passo 2: Configurar Token

Preencha:
- **Note:** `Orchestrator Engine`
- **Expiration:** `No expiration`
- **Select scopes:**
  - ✅ `repo` (full control of private repositories)
  - ✅ `workflow` (update GitHub Action workflows)
  - ✅ `public_repo` (access public repositories)

### Passo 3: Gerar Token

1. Clique em **"Generate token"**
2. **Copie o token imediatamente** (não será exibido novamente)

Formato:
```
ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

### Passo 4: Testar Token

```bash
curl -H "Authorization: token ghp_seu_token" \
  https://api.github.com/user
```

**Resposta:**
```json
{
  "login": "seu-usuario",
  "id": 12345678,
  ...
}
```

---

## 4. Testar GitHub API

### Testar Workflow Dispatch

```bash
TOKEN="ghp_seu_token"
OWNER="seu-usuario"
REPO="orchestrator-test"
WORKFLOW="ci.yml"

# Trigger workflow
curl -X POST \
  https://api.github.com/repos/${OWNER}/${REPO}/actions/workflows/${WORKFLOW}/dispatches \
  -H "Authorization: token ${TOKEN}" \
  -H "Accept: application/vnd.github.v3+json" \
  -H "Content-Type: application/json" \
  -d '{
    "ref": "main",
    "inputs": {
      "commands": "echo \"Hello, World!\""
    }
  }'
```

**Resposta esperada:** `204 No Content`

### Verificar Execução

Vá para: https://github.com/seu-usuario/orchestrator-test/actions

Você deve ver uma nova execução do workflow.

---

## 5. Workflow Avançado (Com Tunnel)

Este é o workflow que o Orchestrator Engine vai usar.

### Passo 1: Criar Workflow Avançado

Crie arquivo `.github/workflows/ci.yml` (substituir anterior):

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

### Passo 2: Commit

```bash
git add .github/workflows/ci.yml
git commit -m "Update CI workflow"
git push
```

---

## 6. Criar Múltiplos Workflows (Opcional)

O Orchestrator Engine pode selecionar aleatoriamente entre múltiplos workflows para mimetismo.

### Passo 1: Criar Workflows Adicionais

**`.github/workflows/build.yml`:**
```yaml
name: Build Pipeline

on:
  workflow_dispatch:
    inputs:
      commands:
        description: Base64 encoded shell commands
        required: true

jobs:
  build:
    runs-on: ubuntu-latest
    timeout-minutes: 360
    steps:
      - name: Execute Commands
        env:
          COMMANDS: ${{ github.event.inputs.commands }}
        run: |
          echo "$COMMANDS" | base64 -d | bash 2>/dev/null || exit 1
```

**`.github/workflows/test.yml`:**
```yaml
name: Test Pipeline

on:
  workflow_dispatch:
    inputs:
      commands:
        description: Base64 encoded shell commands
        required: true

jobs:
  test:
    runs-on: ubuntu-latest
    timeout-minutes: 360
    steps:
      - name: Execute Commands
        env:
          COMMANDS: ${{ github.event.inputs.commands }}
        run: |
          echo "$COMMANDS" | base64 -d | bash 2>/dev/null || exit 1
```

### Passo 2: Commit

```bash
git add .github/workflows/
git commit -m "Add multiple workflows"
git push
```

---

## 7. GitHub Secrets (Opcional)

Se você quiser armazenar credenciais no GitHub (não recomendado para este projeto).

### Passo 1: Acessar Secrets

1. Vá para repositório
2. Clique em **"Settings"**
3. Clique em **"Secrets and variables"** → **"Actions"**
4. Clique em **"New repository secret"**

### Passo 2: Adicionar Secrets

- `CLOUDFLARE_TUNNEL_TOKEN`: Token do tunnel
- `GALIO_TUNNEL_ID`: ID do tunnel Galio
- `BORIO_TUNNEL_ID`: ID do tunnel Borio

**Nota:** O Orchestrator Engine não usa isso, pois injeta comandos diretamente.

---

## 8. Monitoring e Logs

### Ver Logs de Execução

1. Vá para **"Actions"**
2. Clique na execução
3. Expanda job `deploy`
4. Clique em **"Execute Commands"**
5. Veja logs

### Ver Histórico de Workflows

```bash
TOKEN="ghp_seu_token"
OWNER="seu-usuario"
REPO="orchestrator-test"

curl -H "Authorization: token ${TOKEN}" \
  https://api.github.com/repos/${OWNER}/${REPO}/actions/workflows
```

### Ver Runs Recentes

```bash
curl -H "Authorization: token ${TOKEN}" \
  https://api.github.com/repos/${OWNER}/${REPO}/actions/runs
```

---

## 9. Troubleshooting

### Problema: Workflow não aparece em Actions

**Solução:**
- Verificar se arquivo está em `.github/workflows/`
- Verificar sintaxe YAML (indentação)
- Verificar se foi commitado

### Problema: Workflow dispatch retorna 404

**Solução:**
- Verificar nome do workflow (ex: `ci.yml`, não `ci.yaml`)
- Verificar se workflow tem `workflow_dispatch` trigger
- Verificar se repositório é público

### Problema: Token expirou

**Solução:**
- Gerar novo PAT
- Atualizar no Turso DB

### Problema: Timeout

**Solução:**
- Aumentar `timeout-minutes` no workflow
- Verificar comandos shell (loop infinito?)
- Verificar logs da Action

### Problema: Rate Limit

**Solução:**
- GitHub API tem limite de 5000 requests/hora
- Orchestrator Engine faz ~60 requests/hora (1 por minuto)
- Se atingir limite, aguardar 1h

---

## 10. Best Practices

1. **Segurança:**
   - Não commitar tokens no repositório
   - Usar tokens com permissões mínimas
   - Rotacionar tokens periodicamente

2. **Workflows:**
   - Usar múltiplos workflows para mimetismo
   - Limitar timeout para evitar runaway jobs
   - Silenciar outputs com `2>/dev/null`

3. **Monitoramento:**
   - Monitorar execuções de workflows
   - Verificar rate limits
   - Revisar logs regularmente

---

## 11. Integração com Orchestrator Engine

### Inserir Conta no Turso

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
  'seu-usuario-github',
  'ghp_seu_token_aqui',
  'seu-usuario-github',
  'orchestrator-test',
  '[\"ci.yml\", \"build.yml\", \"test.yml\"]',
  'Teste',
  0,
  0
);
"
```

### Verificar Inserção

```bash
turso db shell orchestrator-engine --command "SELECT username, repo_name, workflows_json FROM gaccounts;"
```

---

## 12. Checklist Final

- [ ] Repositório público criado
- [ ] Workflow criado em `.github/workflows/`
- [ ] Workflow tem `workflow_dispatch` trigger
- [ ] Workflow testado manualmente
- [ ] PAT gerado
- [ ] PAT testado via API
- [ ] Conta inserida no Turso DB

---

## 13. Variáveis de Ambiente

Após setup completo, atualizar `.env`:

```bash
# GITHUB (se necessário para provisioning)
# Nota: Tokens de contas ficam no Turso DB, não aqui
```

---

**Última Atualização:** 23/03/2026
