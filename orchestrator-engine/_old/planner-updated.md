# 🚀 Planner - Orchestrator Engine (Updated v2)

## 📋 Visão Geral

**Objetivo:** Sistema de rotação automática de "VMs" (GitHub Actions) com Cloudflare Tunnels para garantir alta disponibilidade do domínio `controller.kill-kick.shop`.

**Conceito Atualizado:** Criar uma "VM gratuita" usando GitHub Actions (ilimitadas para repositórios públicos) que rodam tunnels Cloudflare, com orquestração via Cloudflare Worker e estado persistido no Turso DB.

**Novidades v2.0:**
- G-Accounts como combustível com rotação por quantidade
- Duas funcionalidades: A-Server (VM) e A-Stream (Operacional)
- Cadastro simplificado (apenas ghp_token) - Worker cria repo + .yml
- Sistema de nomes sem IA (Deck + Hash Sequenciais)
- Mimmetismo (repositórios falsos com pool de ZIPs)
- Inicialização inteligente do A-Server
- Foco em segurança e proteção contra vazamentos

---

## 🎯 Arquitetura Atualizada

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
│         │  - 1 A-Server + 19 A-Stream/Conta     │             │
│         └────────────────────────────────────────┘             │
└────────────────────────────┼─────────────────────────────────┘
                             │
         ┌───────────────────┼───────────────────┐
         │                   │                   │
         ▼                   ▼                   ▼
     GitHub API      Cloudflare DNS      GitHub Actions
         │                   │              (Two Types)
         │                   │              ┌──────┬──────┐
     Trigger WF          Update CNAME      │ A-Sr │ A-St │
         │                   │              │ v(1) │ v(19)│
         │                   │              └──┬───┴──┬───┘
         └───────────────────┴──────────────┐   │      │
                                           │   │      │
                                      VM A   │  Ops   │
                                    (Galio)  │  (Borio)│
                                           └─────────┘
```

---

## 📁 Arquivos Criados

### Documentação Principal (v1.0 - Original)
- ✅ `planner.md` - Planejamento geral original
- ✅ `IMPLEMENTATION_CHECKLIST.md` - Checklist de implementação
- ✅ `.env.example` - Template de environment variables

### Documentação Atualizada (v2.0)
- ✅ `ADDITIONAL_REQUIREMENTS.md` - Requisitos adicionais
- ✅ `planner-updated.md` - Planejamento atualizado (este arquivo)
- ✅ `docs/architecture-updated.md` - Arquitetura com A-Server/A-Stream
- ✅ `docs/database-schema-updated.md` - Schema atualizado
- ✅ `docs/api-specification-updated.md` - API atualizada

### Documentação Original (v1.0 - Mantida para referência)
- ✅ `docs/architecture.md` - Arquitetura original
- ✅ `docs/api-specification.md` - API original
- ✅ `docs/database-schema.md` - Schema original
- ✅ `docs/deployment-guide.md` - Guia de deploy

### Guias de Setup (v1.0)
- ✅ `setup/cloudflare-setup.md` - Configuração Cloudflare
- ✅ `setup/turso-setup.md` - Configuração Turso
- ✅ `setup/github-setup.md` - Configuração GitHub

---

## 🚀 Fases de Implementação Atualizadas

### ✅ Fase 1: Planejamento v1.0 (Completo)
- [x] Definir arquitetura do sistema
- [x] Criar estrutura de arquivos de planejamento
- [x] Documentar fluxo de rotação
- [x] Definir stack tecnológica (TypeScript + Hono)

### ✅ Fase 2: Documentação v1.0 (Completo)
- [x] Arquitetura detalhada
- [x] Especificação da API
- [x] Schema do banco de dados
- [x] Guia de deployment
- [x] Guias de setup (Cloudflare, Turso, GitHub)

### ✅ Fase 3: Requisitos Adicionais v2.0 (Completo)
- [x] Documentar A-Server e A-Stream
- [x] Documentar rotação por quantidade
- [x] Documentar sistema de nomes (sem IA)
- [x] Documentar mimetismo e pool de ZIPs
- [x] Documentar cadastro simplificado
- [x] Documentar segurança e proteção

### ✅ Fase 4: Documentação v2.0 (Completo)
- [x] Atualizar arquitetura com A-Server/A-Stream
- [x] Atualizar schema do banco de dados
- [x] Atualizar especificação da API
- [x] Criar documento de requisitos adicionais

### 📝 Fase 5: Setup de Infraestrutura (Pendente)
- [ ] Configurar domínio no Cloudflare
- [ ] Criar tunnels Galio e Borio
- [ ] Criar banco Turso com schema v2.0
- [ ] Obter credenciais necessárias

### 💻 Fase 6: Implementação do Core Engine v2.0 (Pendente)
- [ ] Setup projeto (package.json, tsconfig.json, wrangler.toml)
- [ ] Criar types TypeScript atualizados
- [ ] Implementar DB client com suporte a A-Server/A-Stream
- [ ] Implementar GitHub API integration (criação automática)
- [ ] Implementar gerador de nomes (Deck + Hash)
- [ ] Implementar sistema de mimetismo (pool de ZIPs)
- [ ] Implementar Cloudflare DNS API
- [ ] Implementar rotation engine (por quantidade)
- [ ] Implementar endpoints de cadastro automático
- [ ] Implementar entry point (Hono)

### 🧪 Fase 7: Testes e Debug (Pendente)
- [ ] Testar cadastro automático (apenas token)
- [ ] Testar criação de repositório
- [ ] Testar mimetismo com pool de ZIPs
- [ ] Testar rotação por quantidade
- [ ] Validar health check
- [ ] Validar rotação de DNS

### 🚢 Fase 8: Deploy em Produção (Pendente)
- [ ] Deploy para Cloudflare Workers
- [ ] Monitorar primeiras rotações
- [ ] Ajustar parâmetros conforme necessário

---

## 🎯 Prioridades Atualizadas

### 1. Alta Prioridade (Core v2.0)
- Sistema de cadastro automático (apenas ghp_token)
- Geração de nomes (Deck + Hash)
- Sistema de mimetismo (pool de ZIPs)
- Rotação por quantidade (20 slots por conta)
- Suporte a A-Server e A-Stream

### 2. Média Prioridade
- Inicialização inteligente do A-Server
- Logs de rotação para debug
- Estatísticas do pool de contas

### 3. Baixa Prioridade (v1.0 - Fase 2)
- UI de gerenciamento
- Dashboard avançado de monitoramento
- Integração com lives automáticas

---

## 🔐 Segurança Atualizada

### Novos Princípios v2.0

1. **Nenhum dado sensível nos repositórios**
2. **ghp_token não é dado crítico** (pode ser rotacionado)
3. **Tokens armazenados apenas no Turso DB**
4. **Comandos totalmente silenciados**
5. **Base64 encoding para comandos shell**
6. **Logs sem informações sensíveis**
7. **Mimetismo não expõe dados reais**

---

## 📊 Métricas de Sucesso

### Métricas v1.0 (Mantidas)
- **Uptime do sistema:** > 99.5%
- **Tempo de rotação:** < 3 minutos (incluindo health check)
- **Taxa de falha de rotação:** < 1%
- **Tempo de cold start:** < 2 minutos
- **Overhead de DNS:** < 30 segundos

### Métricas v2.0 (Novas)
- **Cadastros automáticos:** > 95% de sucesso
- **Tempo de cadastro:** < 30 segundos
- **Mimetismo aplicado:** > 90% dos repositórios
- **Rotação por quantidade:** Zero falhas por limite

---

## 🐛 Riscos e Mitigações v2.0

### Novos Riscos Identificados

| Risco | Probabilidade | Impacto | Mitigação |
|-------|--------------|---------|-----------|
| Pool de ZIPs indisponível | Média | Baixo | Fallback sem mimetismo |
| GitHub repositório duplicado | Baixa | Médio | Verificar antes de criar |
| G-Account slots esgotados | Média | Alto | Múltiplas contas por tipo |
| Mimmetismo detectado | Baixa | Alto | Nomes realistas + README.md |

---

## 📝 Próximos Passos

1. ✅ Criar documentação técnica detalhada (`docs/`)
2. ✅ Criar guias de setup (`setup/`)
3. ✅ Definir checklist de implementação (`IMPLEMENTATION_CHECKLIST.md`)
4. ✅ Validar arquitetura v1.0 com usuário
5. ✅ Documentar requisitos adicionais v2.0
6. ⏳ Atualizar IMPLEMENTATION_CHECKLIST.md com v2.0
7. ⏳ Validar arquitetura v2.0 com usuário
8. ⏳ Iniciar implementação após aprovação

---

## 🔄 Diferenças v1.0 vs v2.0

| Aspecto | v1.0 | v2.0 |
|---------|-------|-------|
| Cadastro | Manual + IA | Apenas token + Automação |
| Nomes | Gemini AI | Deck + Hash Sequenciais |
| Rotação | Baseada em tempo | Baseada em quantidade |
| Actions | 1 tipo (tunnel) | 2 tipos (A-Server + A-Stream) |
| Limite por conta | Não definido | 20 simultâneas |
| Mimmetismo | Não existe | Pool de ZIPs |
| Criação de repo | Manual | Automática |
| Inicialização | Simples | Inteligente |

---

## 🔗 Referências

- [Cloudflare Workers](https://developers.cloudflare.com/workers/)
- [Turso DB](https://turso.tech/)
- [GitHub Actions](https://docs.github.com/en/actions)
- [Cloudflare Tunnels](https://developers.cloudflare.com/cloudflare-one/connections/connect-apps/)
- [Hono Framework](https://hono.dev/)
- [ADDITIONAL_REQUIREMENTS.md](./ADDITIONAL_REQUIREMENTS.md) - Requisitos detalhados v2.0

---

## ⏱️ Status Atual

**Fase:** Planejamento v1.0 Completo ✅, Documentação v2.0 Completo ✅

**Próxima Etapa:**
- Aprovação da arquitetura v2.0
- Setup de infraestrutura
- Implementação do Core Engine v2.0

---

**Última Atualização:** 23/03/2026
**Versão:** 2.0.0
**Status:** ✅ Planejamento v1.0 Completo, ✅ Documentação v2.0 Completo
**Responsável:** OpenCode AI
