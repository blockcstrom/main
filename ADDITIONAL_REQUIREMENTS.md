# 📋 Requisitos Adicionais - Orchestrator Engine

## 🎯 Visão Geral

Este documento descreve requisitos adicionais e modificações importantes ao projeto original do Orchestrator Engine.

---

## 🔑 Conceitos Chave

### 1. G-Accounts (Combustível do Sistema)

As contas GitHub funcionam como "combustível" para o sistema, com **rotação baseada em quantidade**.

**Regra Principal:**
- Limite de **20 Actions simultâneas** por G-Account
- Rotação sempre por quantidade de uso
- Tempo ilimitado de execução (repositórios públicos)

---

## 🏗️ Arquitetura de A-Server e A-Stream

### Nomenclatura e Funções

#### A-Server
- **Função:** VM/Server
- **Propósito:** Rodar tunnel Cloudflare para alta disponibilidade
- **Quantidade:** 1 por G-Account
- **Rotacionamento:** 1:1 com contas

#### A-Stream
- **Função:** Operacional (lives futuras)
- **Propósito:** Executar tarefas operacionais do sistema
- **Quantidade:** 19 por G-Account
- **Rotacionamento:** 2:19 por conta

### Distribuição Exemplo

```
Conta 1:
├── A-Server[1:1] - VM principal
└── A-Stream[2:19] - 19 Actions operacionais

Conta 2:
├── A-Server[1:1] - VM principal
└── A-Stream[2:19] - 19 Actions operacionais

Conta 3:
├── A-Server[1:1] - VM principal
└── A-Stream[2:19] - 19 Actions operacionais
```

---

## 🔐 Cadastro e Provisionamento

### Cadastro Simplificado
- **Input:** Apenas `ghp_token` (GitHub Personal Access Token)
- **Worker:** Cria automaticamente repositório + workflow `.yml`
- **Nenhum dado manual** além do token

### Fluxo de Provisionamento

```
Input: ghp_token
    ↓
Worker valida token
    ↓
Worker seleciona nome (sem IA)
    ↓
Worker cria repositório público
    ↓
Worker cria workflow .yml
    ↓
Worker salva no Turso DB
    ↓
G-Account pronta para uso
```

---

## 🏷️ Sistema de Nomes (Sem IA)

### Array de Nomes Base

Ao invés de usar IA (Gemini), usaremos um **array predefinido** com múltiplos nomes chave.

**Exemplos de Nomes de Repositório:**
```
- CI-Implementation-planner
- Js-library-json
- Builder-cripto-exchange
- Quantum-microservices-toolkit
- Distributed-ledger-system
- Cloud-native-framework
- Devops-automation-suite
- Machine-learning-pipeline
- Real-time-analytics
- Scalable-architecture
```

**Exemplos de Nomes de Workflows:**
```
- ci-build-test.yml
- interpreter-ci-cd.yml
- initial-planner.yml
- deploy-production.yml
- test-coverage.yml
- lint-format-check.yml
- security-scan.yml
- performance-test.yml
- integration-tests.yml
- docker-build.yml
```

### Lógica de Randomização

**Conceito:** Deck + Hash Sequenciais

1. **Deck:** Array de nomes base (seleção aleatória)
2. **Hash Sequencial:** Incremento sequencial para garantir unicidade

**Exemplo de Implementação:**
```typescript
const REPO_NAMES = [
  "CI-Implementation-planner",
  "Js-library-json",
  "Builder-cripto-exchange",
  // ... mais 100+ nomes
];

const WORKFLOW_NAMES = [
  "ci-build-test.yml",
  "interpreter-ci-cd.yml",
  "initial-planner.yml",
  // ... mais 50+ nomes
];

interface NameGenerator {
  generateRepoName(): string;
  generateWorkflowName(): string;
}

class DeckBasedGenerator implements NameGenerator {
  private repoHash = 0;
  private workflowHash = 0;

  generateRepoName(): string {
    const base = REPO_NAMES[Math.floor(Math.random() * REPO_NAMES.length)];
    this.repoHash++;
    return `${base}-${this.repoHash}`;
  }

  generateWorkflowName(): string {
    const base = WORKFLOW_NAMES[Math.floor(Math.random() * WORKFLOW_NAMES.length)];
    this.workflowHash++;
    return `${base}-${this.workflowHash}.yml`;
  }
}
```

---

## 🎭 Mimmetismo e Repositórios Falsos

### Objetivo
Criar repositórios que pareçam "orgânicos" e legítimos para evitar detecção.

### Estrutura do Repositório Falso

```
fake-repo/
├── README.md (fake - parece projeto real)
├── src/
│   ├── index.js
│   └── utils.js
├── tests/
│   └── test.js
├── .github/
│   └── workflows/
│       ├── ci.yml (real - A-Server/A-Stream)
│       └── lint.yml (fake - para mimetismo)
├── package.json (fake)
├── .gitignore (fake)
└── LICENSE (fake)
```

### README.md Exemplo

```markdown
# CI Implementation Planner

A comprehensive tool for planning and implementing CI/CD pipelines across multiple platforms.

## Features

- Multi-platform support
- Automated pipeline generation
- Real-time validation
- Extensible architecture

## Getting Started

```bash
npm install
npm test
npm run build
```

## License

MIT
```

### Arquivos de Mimmetismo

**package.json (fake):**
```json
{
  "name": "ci-implementation-planner",
  "version": "1.0.0",
  "description": "A comprehensive CI/CD planning tool",
  "main": "src/index.js",
  "scripts": {
    "test": "jest",
    "build": "webpack",
    "lint": "eslint src/"
  },
  "keywords": ["ci", "cd", "devops", "automation"],
  "author": "Your Name",
  "license": "MIT"
}
```

---

## 🔄 Inicialização Inteligente do A-Server

### Fluxo de Inicialização

```
A-Server inicia
    ↓
Verifica: Já tenho repositório?
    ↓    ↓
   SIM    NÃO
    ↓      ↓
Segue    Puxa ZIP dos arquivos
normal   do pool de links
         ↓
    Cria/Atualiza repositório
         ↓
    Uploada arquivos (mimetismo)
         ↓
    Segue inicialização
```

### Detalhes do Fluxo "Não"

1. **Pool de Links:** URLs de arquivos .zip (provavelmente Google Drive)
2. **Download:** Worker baixa o ZIP do pool
3. **Extração:** Extrai arquivos temporariamente
4. **Criação/Atualização:** Cria ou atualiza o repositório
5. **Upload:** Uploada todos os arquivos via GitHub API
6. **Workflow Real:** Garante que o workflow A-Server/A-Stream está presente

### Autenticação

- Usa **ghp_token** para autenticação
- Token não é dado crítico (pode ser rotacionado)
- Não há dados sensíveis nos arquivos de mimetismo

### Fallback

**Caso não receba link do pool:**
- Segue inicialização normal
- Cria apenas o workflow essencial (A-Server/A-Stream)
- Sem mimetismo (mas funcional)

---

## 🔒 Segurança e Proteção Contra Vazamentos

### Princípios Fundamentais

1. **Nenhum dado sensível nos repositórios**
2. **Tokens são armazenados apenas no Turso DB**
3. **Comandos totalmente silenciados** (`2>/dev/null`)
4. **Base64 encoding** para comandos shell
5. **Logs sem informações sensíveis**

### Proteção de Dados

| Dado | Onde é armazenado | Proteção |
|------|-------------------|-----------|
| ghp_token | Turso DB (coluna `token`) | Criptografia em trânsito (HTTPS) |
| Tunnel tokens | Environment Variables | Secrets do Cloudflare Workers |
| DB credentials | Environment Variables | Secrets do Cloudflare Workers |
| Comandos shell | Passados via API (Base64) | Nenhum armazenamento persistente |

### Comandos Silenciados

```bash
# Todos os comandos com redirecionamento
command 2>/dev/null
command > /dev/null 2>&1

# Sem exposição de logs
grep -v 'level=info'  # Remove logs do cloudflared
```

---

## 📊 Schema Atualizado do Turso DB

### Tabela `gaccounts`

```sql
CREATE TABLE gaccounts (
  username TEXT PRIMARY KEY,
  token TEXT NOT NULL,
  repo_owner TEXT NOT NULL,
  repo_name TEXT NOT NULL,
  repo_url TEXT NOT NULL,
  workflows_json TEXT NOT NULL,
  fictional_name TEXT NOT NULL,
  account_type TEXT NOT NULL,  -- 'server' ou 'stream'
  slots_used INTEGER NOT NULL DEFAULT 0,
  slots_max INTEGER NOT NULL DEFAULT 20,
  server_actions_count INTEGER NOT NULL DEFAULT 0,
  stream_actions_count INTEGER NOT NULL DEFAULT 0,
  last_active INTEGER NOT NULL DEFAULT 0,
  created_at INTEGER NOT NULL DEFAULT 0
);
```

**Novas Colunas:**
- `repo_url`: URL completa do repositório
- `account_type`: Tipo da conta ('server' ou 'stream')
- `slots_max`: Limite máximo (20)
- `server_actions_count`: Contador de A-Servers rodados
- `stream_actions_count`: Contador de A-Streams rodados
- `created_at`: Timestamp de criação

---

## 🚀 API Atualizada

### Novos Endpoints

#### POST `/api/accounts/register`

Provisiona uma nova G-Account automaticamente.

**Request:**
```json
{
  "token": "ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
}
```

**Response:**
```json
{
  "success": true,
  "account": {
    "username": "github-user",
    "repo_owner": "github-user",
    "repo_name": "CI-Implementation-planner-123",
    "repo_url": "https://github.com/github-user/CI-Implementation-planner-123",
    "workflows": ["ci-build-test-456.yml"],
    "fictional_name": "Alpha",
    "account_type": "server",
    "slots_used": 0,
    "slots_max": 20
  }
}
```

#### GET `/api/accounts/pool`

Retorna estatísticas do pool de G-Accounts.

**Response:**
```json
{
  "total_accounts": 10,
  "server_accounts": 5,
  "stream_accounts": 5,
  "total_slots": 200,
  "used_slots": 45,
  "available_slots": 155
}
```

---

## 📦 Pool de Links

### Estrutura

Array de URLs para arquivos .zip contendo repositórios falsos.

**Exemplo:**
```typescript
const MIMETISM_POOL = [
  "https://drive.google.com/uc?id=xxx&export=download",
  "https://drive.google.com/uc?id=yyy&export=download",
  "https://drive.google.com/uc?id=zzz&export=download",
  // ... mais 20+ links
];
```

### Rotacionamento

- Seleção aleatória do pool
- Se URL falhar, tentar próxima
- Se todas falharem, usar fallback (sem mimetismo)

---

## ✅ Checklist de Novos Requisitos

### Implementação
- [ ] Atualizar schema do Turso DB com novas colunas
- [ ] Implementar gerador de nomes baseado em deck
- [ ] Implementar sistema de mimetismo
- [ ] Implementar pool de links
- [ ] Atualizar lógica de cadastro (apenas token)
- [ ] Implementar inicialização inteligente do A-Server
- [ ] Adicionar endpoints de API para registro automático

### Documentação
- [x] Criar este documento de requisitos adicionais
- [ ] Atualizar `architecture.md` com A-Server/A-Stream
- [ ] Atualizar `api-specification.md` com novos endpoints
- [ ] Atualizar `database-schema.md` com schema atualizado
- [ ] Atualizar `github-setup.md` com novas regras
- [ ] Atualizar `planner.md` com nova visão

### Testes
- [ ] Testar cadastro automático (apenas token)
- [ ] Testar criação de repositório
- [ ] Testar mimetismo com pool de links
- [ ] Testar fallback sem mimetismo
- [ ] Testar rotação por quantidade (20 actions)

---

## 🎯 Impacto na Arquitetura Original

### Mudanças Principais

1. **Separação de Responsabilidades:**
   - Antes: 1 tipo de Action (tunnel)
   - Agora: 2 tipos (A-Server + A-Stream)

2. **Mecanismo de Cadastro:**
   - Antes: Provisionamento manual com IA
   - Agora: Cadastro simples + automação completa

3. **Gerador de Nomes:**
   - Antes: Gemini AI
   - Agora: Deck + Hash Sequenciais

4. **Mimetismo:**
   - Antes: Não existia
   - Agora: Repositórios falsos + pool de links

5. **Rotação:**
   - Antes: Baseada em tempo
   - Agora: Baseada em quantidade (20 slots)

---

**Última Atualização:** 23/03/2026
**Status:** Requisitos adicionais documentados
**Próximo Passo:** Atualizar documentação existente
