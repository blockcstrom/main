# Instruções de Operação: Orchestrator (Engrenagem de Infraestrutura)

Este documento fornece o guia passo a passo para configurar, implantar e manter o **Orchestrator**, o controlador de alta disponibilidade para as VMs Gateway.

---

## 1. Configuração do Banco de Dados (Turso)

O Orchestrator utiliza o Turso para persistir o inventário de contas e o estado da rotação.

### SQL Inicial:
Execute estes comandos no console do Turso ou via Turso CLI:

```sql
-- Tabela para armazenar as contas do GitHub (Combustível)
CREATE TABLE gaccounts (
    username TEXT PRIMARY KEY, 
    token TEXT, 
    repo_owner TEXT, -- Dono do repositório alvo
    repo_name TEXT,  -- Nome do repositório alvo
    workflows_json TEXT, -- Nomes dos workflows configurados
    fictional_name TEXT, -- Nome fictício para identificar a conta
    slots_used INTEGER DEFAULT 0, 
    last_active DATETIME
);

-- Tabela para o estado da infraestrutura (Controle de Rotação)
CREATE TABLE orchestrator_state (
    key TEXT PRIMARY KEY, 
    value TEXT
);
```

---

## 2. Configuração do Ambiente (Wrangler)

### Variáveis Públicas (`orchestrator/wrangler.jsonc`):
Edite o arquivo e preencha os seguintes campos:

```jsonc
"vars": {
    "TURSO_DB_URL": "libsql://seu-db.turso.io",
    "BASIC_AUTH_USER": "admin" // Usuário para acessar a UI
}
```

### Segredos (Secrets):
Execute os comandos abaixo no terminal para configurar as credenciais sensíveis:

```bash
# Nome do Usuário Administrativo (Complexo e Secreto)
npx wrangler secret put BASIC_AUTH_USER

# Senha (Chave de Acesso) para Interface do Orchestrator
npx wrangler secret put BASIC_AUTH_PASS

# URL do banco de dados Turso
npx wrangler secret put TURSO_DB_URL

# Token de Autenticação do Turso DB
npx wrangler secret put TURSO_DB_AUTH_TOKEN
```

---

## 3. Implantação (Deploy)

Para enviar o Orchestrator para a Cloudflare, execute:

```bash
cd orchestrator
npm install
npm run deploy
```

---

## 4. Operação e Monitoramento

### Acesso à Interface:
1. Acesse a URL gerada pela Cloudflare (ex: `https://orchestrator.seu-nome.workers.dev`).
2. Insira as credenciais de **Basic Auth** (definidas no passo 2).
3. **Cadastre as GAccounts**: Insira o Username, GitHub PAT, o Dono do Repositório (Owner) e o Nome do Repositório.

### Ciclo de Funcionamento:
- **Verificação (1 min)**: O Worker verifica o estado a cada minuto.
- **Rotação (5h 40min)**: A cada 340 minutos, uma nova VM Gateway é solicitada via GitHub Action no repositório associado à conta.
- **Overlap (30 min)**: A nova VM sobe 30 minutos antes da antiga expirar para garantir a transição.
- **Túnel**: O sistema principal na VM deve estar configurado para se conectar ao domínio Cloudflare assim que a VM estiver ativa.

### Logs em Tempo Real:
Para acompanhar a lógica de rotação e possíveis erros de API:
```bash
npx wrangler tail
```

---

## 5. Manutenção

- **Adicionar Contas**: Use a UI para inserir novas GAccounts com seus respectivos repositórios.
- **Remover Contas**: Contas que atingirem 20 slots ou apresentarem erro de token devem ser removidas/atualizadas via UI.
- **Forçar Rotação**: Para forçar uma rotação imediata, você pode deletar a chave `last_rotation` na tabela `orchestrator_state` do Turso.

---

**Nota Importante**: Este Worker é apenas a **engrenagem de infraestrutura**. Ele garante que a VM (corpo) esteja ativa. A localização da VM (Owner/Repo) agora é definida individualmente por conta na interface.
