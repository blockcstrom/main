# 🗄️ Turso Setup Guide

## Visão Geral

Guia detalhado para configurar Turso Database para o Orchestrator Engine.

---

## 📋 Pré-requisitos

- [ ] Conta Turso ( gratuita em https://turso.tech )
- [ ] Turso CLI instalado

---

## 1. Instalar Turso CLI

### Linux/macOS

```bash
curl -sSfL https://get.tur.so/install.sh | bash
```

### Windows

```powershell
iwr https://get.tur.so/install.ps1 -useb | iex
```

### Verificar Instalação

```bash
turso --version
```

Output:
```
turso version 1.x.x
```

---

## 2. Login no Turso

### Passo 1: Autenticar

```bash
turso auth login
```

1. Abre browser
2. Faça login (crie conta se necessário)
3. Clique em "Authorize"

### Passo 2: Verificar Login

```bash
turso auth whoami
```

Output:
```
username: seu-usuario
```

---

## 3. Criar Banco de Dados

### Passo 1: Criar DB

```bash
turso db create orchestrator-engine --group default
```

**Output:**
```
Database created!

DB URL: libsql://orchestrator-engine-seu-usuario.turso.io
```

**Opções disponíveis:**
- `--group`: Grupo do banco (default é "default")
- `--location`: Localização do banco (ex: `ams`, `ewr`, `hkg`)

### Passo 2: Verificar DB

```bash
turso db list
```

Output:
```
NAME                  GROUP      URL
orchestrator-engine   default    libsql://orchestrator-engine-seu-usuario.turso.io
```

---

## 4. Criar Token de Autenticação

### Passo 1: Criar Token Read/Write

```bash
turso db tokens create orchestrator-engine --readwrite
```

**Output:**
```
eyJhbGciOiJFUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ...
```

### Passo 2: Salvar Token

Copie o token e salve em local seguro (vai ser usado no `.env`).

**Nota:** Este token dá acesso completo ao banco (read/write). Não compartilhe!

---

## 5. Executar Schema

### Passo 1: Criar arquivo `schema.sql`

```bash
cat > schema.sql << 'EOF'
-- Tabela de contas GitHub (combustível do sistema)
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

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_gaccounts_slots_used ON gaccounts(slots_used);
CREATE INDEX IF NOT EXISTS idx_gaccounts_last_active ON gaccounts(last_active);

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

-- Inserir estado inicial
INSERT OR IGNORE INTO orchestrator_state (key, value) VALUES ('active_tunnel', 'Galio');
INSERT OR IGNORE INTO orchestrator_state (key, value) VALUES ('last_rotation', '0');
EOF
```

### Passo 2: Executar Schema

```bash
turso db shell orchestrator-engine --file schema.sql
```

**Output:**
```
(No output se sucesso)
```

### Passo 3: Verificar Tabelas

```bash
turso db shell orchestrator-engine --command ".tables"
```

**Output:**
```
gaccounts             login_attempts         orchestrator_state
```

### Passo 4: Verificar Estado Inicial

```bash
turso db shell orchestrator-engine --command "SELECT * FROM orchestrator_state;"
```

**Output:**
```
| key            | value          |
|----------------|----------------|
| active_tunnel  | Galio          |
| last_rotation  | 0              |
```

---

## 6. Inserir Dados Iniciais (Teste)

### Inserir Conta GitHub de Teste

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

### Verificar Inserção

```bash
turso db shell orchestrator-engine --command "SELECT username, fictional_name, slots_used FROM gaccounts;"
```

**Output:**
```
| username            | fictional_name | slots_used |
|---------------------|----------------|------------|
| seu-username-github | Teste          | 0          |
```

---

## 7. Usar o Database

### Via Shell Interativo

```bash
turso db shell orchestrator-engine
```

Comandos disponíveis:
```bash
# Listar tabelas
.tables

# Ver schema de tabela
.schema gaccounts

# Executar query
SELECT * FROM gaccounts;

# Sair
.quit
```

### Via Command Line

```bash
# Executar query simples
turso db execute orchestrator-engine --command "SELECT * FROM orchestrator_state;"

# Executar query com parâmetros
turso db execute orchestrator-engine --command "
  SELECT username, slots_used
  FROM gaccounts
  WHERE slots_used < ?;
" --args "5"
```

### Via Shell com Input File

```bash
turso db shell orchestrator-engine < queries.sql
```

---

## 8. Monitoramento e Debug

### Ver Logs do Database

```bash
turso db logs orchestrator-engine
```

**Output:**
```
2024-03-23T12:00:00Z  INFO  Query executed: SELECT * FROM gaccounts
2024-03-23T12:00:01Z  INFO  Query executed: INSERT INTO orchestrator_state ...
```

### Ver Status do Database

```bash
turso db inspect orchestrator-engine
```

**Output:**
```
Name: orchestrator-engine
Group: default
URL: libsql://orchestrator-engine-seu-usuario.turso.io
Version: 1.0.0

Tables: 3
Rows: 2
Size: 1.2 KB

Locations: ams, ewr, hkg
```

---

## 9. Backup e Restore

### Backup do Database

```bash
# Exportar schema e dados
turso db shell orchestrator-engine --command ".dump" > backup.sql

# Exportar apenas dados
turso db shell orchestrator-engine --command ".dump --data-only" > data_backup.sql
```

### Restore do Database

```bash
# Restaurar de backup
turso db shell orchestrator-engine < backup.sql

# Criar novo DB de backup
turso db create orchestrator-engine-backup --group default
turso db shell orchestrator-engine-backup < backup.sql
```

### Backup Automático (Cron)

```bash
# Adicionar ao crontab para backup diário
0 0 * * * turso db shell orchestrator-engine --command ".dump" > /backup/orchestrator-engine-$(date +\%Y\%m\%d).sql
```

---

## 10. Gerenciamento de Tokens

### Listar Tokens

```bash
turso db tokens list orchestrator-engine
```

**Output:**
```
NAME                     TYPE      CREATED AT
read-write-token         readwrite 2024-03-23T12:00:00Z
```

### Revogar Token

```bash
turso db tokens revoke orchestrator-engine read-write-token
```

### Criar Token Read-Only

```bash
turso db tokens create orchestrator-engine --read-only
```

---

## 11. Performance Optimization

### Criar Índices Adicionais

```bash
turso db execute orchestrator-engine --command "
  CREATE INDEX IF NOT EXISTS idx_gaccounts_username
  ON gaccounts(username);
"
```

### Analisar Query Performance

```bash
turso db execute orchestrator-engine --command "
  EXPLAIN QUERY PLAN
  SELECT * FROM gaccounts
  WHERE slots_used < 20
  ORDER BY RANDOM()
  LIMIT 1;
"
```

**Output:**
```
SCAN TABLE gaccounts USING INDEX idx_gaccounts_slots_used
```

---

## 12. Troubleshooting

### Problema: Connection refused

**Solução:**
- Verificar se DB existe: `turso db list`
- Verificar token: `turso auth whoami`
- Verificar URL do DB

### Problema: Token expired

**Solução:**
- Criar novo token: `turso db tokens create <db_name> --readwrite`
- Atualizar `.env` com novo token

### Problema: Schema error

**Solução:**
- Verificar schema: `turso db shell <db_name> --command ".schema"`
- Re-executar schema: `turso db shell <db_name> < schema.sql`

### Problema: Query lenta

**Solução:**
- Analisar query plan: `EXPLAIN QUERY PLAN <query>`
- Criar índices nas colunas usadas em WHERE/ORDER BY
- Considerar location do banco mais próximo

---

## 13. Best Practices

1. **Segurança:**
   - Não commitar tokens no git
   - Usar tokens com permissões mínimas necessárias
   - Rotacionar tokens periodicamente

2. **Performance:**
   - Criar índices em colunas frequentemente consultadas
   - Usar prepared statements para queries com parâmetros
   - Considerar location do banco para baixa latência

3. **Backup:**
   - Fazer backup regularmente
   - Testar restore periodicamente
   - Manter múltiplas versões de backup

4. **Monitoramento:**
   - Monitorar tamanho do DB
   - Monitorar número de queries
   - Revisar logs regularmente

---

## 14. Checklist Final

- [ ] Turso CLI instalado
- [ ] Login realizado
- [ ] Database `orchestrator-engine` criado
- [ ] DB URL obtido
- [ ] Token readwrite criado
- [ ] Schema executado
- [ ] Tabelas criadas
- [ ] Estado inicial inserido
- [ ] Conta de teste inserida
- [ ] Backup inicial criado

---

## 15. Variáveis de Ambiente

Após setup completo, preencher no `.env`:

```bash
# TURSO DATABASE
TURSO_DB_URL=libsql://orchestrator-engine-seu-usuario.turso.io
TURSO_DB_AUTH_TOKEN=eyJhbGciOiJFUzI1NiIsInR5cCI6IkpXVCJ9...
```

---

**Última Atualização:** 23/03/2026
