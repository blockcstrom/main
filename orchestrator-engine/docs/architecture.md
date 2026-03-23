# 🏗️ Architecture - Orchestrator Engine (Updated v2.2)

## Visão Geral

O **Orchestrator Engine v2.2** é um sistema de orquestração distribuído que mantém "VMs" (GitHub Actions) sempre ativas através de rotação automática, usando Cloudflare Tunnels para exposição de serviços e Turso DB para persistência de estado.

**Conceito Chave v2.2:** G-Accounts funcionam como "combustível" do sistema com **rotação baseada em quantidade** e **separação FIXA de slots** (1 A-Server + 19 A-Stream por conta).

---

## Arquitetura Atualizada v2.2

```
┌─────────────────────────────────────────────────────────────┐
│                    Cloudflare Worker                        │
│              (Orchestrator / Control Plane)                 │
│                                                             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐       │
│  │   CRON 1min  │──│   Rotation   │──│  Health Check│       │
│  │  (Scheduler) │  │    Engine    │  │    Loop      │       │
│  └──────────────┘  └──────────────┘  └──────────────┘       │
│         │                  │                  │             │
│         └──────────────────┼──────────────────┘             │
│                            ▼                                │
│                    Turso DB (State)                         │
│         ┌──────────────────┴──────────────────┐             │
│         │  G-Accounts Pool (Combustível)         │             │
│         │  - 2 repos/conta (Server+Stream)        │             │
│         │  - Slots FIXO: 1 A-Server | 19 A-Stream  │             │
│         └────────────────────────────────────────┘             │
└────────────────────────────┼─────────────────────────────────┘
                             │
         ┌───────────────────┼───────────────────┐
         │                   │                   │
         ▼                   ▼                   ▼
     GitHub API      Cloudflare DNS      GitHub Actions
         │                   │              (Three Types)
         │                   │              ┌──────┬──────┬────┐
     Trigger WF          Update CNAME      │ A-Bo │ A-Sr │ A-St │
         │                   │              │ t(1) │ v(1) │ v(19)│
         │                   │              └──┬───┴──┬───┴───┬┘
         └───────────────────┴──────────────┐   │      │      │
                                           │   │      │      │
                                      VM A   │  Ops   │ Boot  │
                                    (Galio)  │(Borio) │ (Once)│
                                           └─────────┘
```

---

## Componentes Atualizados v2.2

### 1. Cloudflare Worker (Control Plane)

**Responsabilidade:** Orquestrar todo o sistema, tomar decisões, criar repositórios, disparar A-Boot e coordenar componentes.

**Endpoints:**
- `GET /` - Health check básico
- `GET /health` - Health check detalhado
- `POST /api/accounts/register` - Cadastro de G-Account (apenas token)
- `GET /api/accounts/pool` - Estatísticas do pool de contas
- `scheduled` (CRON) - Rotina de rotação (executada a cada 1 minuto)

**Funções Principais:**
- Cadastro automático de G-Accounts (apenas com ghp_token)
- Excluir TODOS os repositórios da conta antes de criar novos
- Criar 2 repositórios (A-Server + A-Stream)
- Enviar 2 workflows (A-Server + A-Stream)
- Disparar A-Boot (primeira Action)
- Verificar se é hora de rotacionar (por quantidade)
- Selecionar próxima VM (GitHub Action)
- Disparar workflow via GitHub API
- Realizar health check do novo tunnel
- Atualizar DNS CNAME
- Atualizar estado no Turso DB
- Gerar nomes baseados em 3 decks separados (Repos + YMLs + ZIPs)
- Implementar mimetismo (repositórios falsos)

---

### 2. Turso Database (State Store)

**Responsabilidade:** Persistir o estado global do sistema e gerenciar pool de G-Accounts.

#### Tabelas Atualizadas v2.2

##### `gaccounts` (Atualizada v2.2)

Armazena contas GitHub com separação FIXA de slots.

**MUDANÇA v2.2:**
- `server_slots_used`, `server_slots_max` (1 fixo para A-Server)
- `stream_slots_used`, `stream_slots_max` (19 fixo para A-Stream)
- `total_slots_used`, `total_slots_max` (20 total)
- `boot_completed` - Se A-Boot foi executado

**Proporção:**
- 1 A-Server (fixo) por conta
- 19 A-Stream (fixo) por conta
- Total: 20 Actions simultâneas por conta

---

### 3. GitHub Actions - Tipos Diferenciados v2.2

#### A-Boot (NOVO v2.2)

**Função:** Popula repositórios com arquivos de mimetismo
**Propósito:** Baixar 2 ZIPs, extrair e enviar para os 2 repos
**Quantidade:** Executado apenas uma vez após criar os repositórios
**Comportamento:**
- **Primeira inicialização:** Baixa 2 ZIPs, extrai e envia para repos
- **Próximas inicializações:** Verifica que já está populado, segue

**Workflow Template (A-Boot):**
```yaml
name: Boot Init

on:
  workflow_dispatch:
    inputs:
      server_repo_url:
        required: true
      stream_repo_url:
        required: true
      zip_server_url:
        required: true
      zip_stream_url:
        required: true

jobs:
  boot:
    runs-on: ubuntu-latest
    timeout-minutes: 360
    steps:
      - name: Populate Repositories
        env:
          SERVER_REPO_URL: ${{ github.event.inputs.server_repo_url }}
          STREAM_REPO_URL: ${{ github.event.inputs.stream_repo_url }}
          ZIP_SERVER_URL: ${{ github.event.inputs.zip_server_url }}
          ZIP_STREAM_URL: ${{ github.event.inputs.zip_stream_url }}
        run: |
          # Verificar se já foi populado
          if [ -f "/tmp/.boot_completed" ]; then
            echo "Boot already completed, skipping..."
            exit 0
          fi
          
          # Baixar 2 ZIPs
          curl -Ls ${ZIP_SERVER_URL} -o /tmp/server.zip
          curl -Ls ${ZIP_STREAM_URL} -o /tmp/stream.zip
          
          # Extrair
          unzip -q /tmp/server.zip -d /tmp/server-repo
          unzip -q /tmp/stream.zip -d /tmp/stream-repo
          
          # Enviar para A-Server
          cd /tmp/server-repo
          git init
          git remote add origin ${SERVER_REPO_URL}
          git add .
          git commit -m "Add mimetic files"
          git push origin main
          
          # Enviar para A-Stream
          cd /tmp/stream-repo
          git init
          git remote add origin ${STREAM_REPO_URL}
          git add .
          git commit -m "Add mimetic files"
          git push origin main
          
          # Marcar como completado
          touch /tmp/.boot_completed
```

#### A-Server (Action Servidor)

**Função:** VM/Server principal
**Propósito:** Rodar tunnel Cloudflare para alta disponibilidade
**Quantidade:** 1 fixo por G-Account
**Slots:** 1 slot fixo por conta
**Rotacionamento:** Nunca 2 A-Servers sequenciais na mesma conta

#### A-Stream (Action Operacional)

**Função:** Operacional (lives futuras)
**Propósito:** Executar tarefas operacionais do sistema
**Quantidade:** 19 fixos por G-Account
**Slots:** 19 slots fixos por conta

---

### 4. Sistema de Nomes v2.2 (Sem IA)

#### Três Decks Separados

**Deck 1: Core Repo Names** (para nomes de repositórios)
**Deck 2: Core YML Names** (para nomes de workflows)
**Deck 3: Core ZIP Names** (para nomes de arquivos ZIP) - NOVO v2.2

**Core ZIP Names:**
```
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

**Exemplos de ZIPs:**
- `server-123.zip`
- `stream-456.zip`
- `common-789.zip`
- `bootstrap-101.zip`

---

### 5. Fluxo de Cadastro Atualizado v2.2

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

---

### 6. Rotação por Quantidade v2.2

**Separação FIXA de Slots:**

```typescript
// Selecionar conta com slots A-Server disponíveis
const serverAccount = await db.getAccountWithServerSlots();
// WHERE server_slots_used < server_slots_max (1)

// Selecionar conta com slots A-Stream disponíveis
const streamAccount = await db.getAccountWithStreamSlots();
// WHERE stream_slots_used < stream_slots_max (19)
```

**Proporção Mínima: 1:2**
- Para cada 1 A-Server, no mínimo 2 A-Streams
- Nunca 2 A-Servers sequenciais na mesma conta

---

## Segurança

Mesmo que v2.1 - sem mudanças.

---

**Última Atualização:** 23/03/2026
**Versão:** 2.2.0 (Atualizada com A-Boot, separação FIXA de slots, 3 decks de nomes)
