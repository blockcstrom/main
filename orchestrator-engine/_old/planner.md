# 🚀 Planner - Orchestrator Engine

## 📋 Visão Geral

**Objetivo:** Sistema de rotação automática de "VMs" (GitHub Actions) com Cloudflare Tunnels para garantir alta disponibilidade do domínio `controller.kill-kick.shop`.

**Conceito:** Criar uma "VM gratuita" usando GitHub Actions (ilimitadas para repositórios públicos) que rodam tunnels Cloudflare, com orquestração via Cloudflare Worker e estado persistido no Turso DB.

---

## 🎯 Arquitetura

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
└────────────────────────────┼────────────────────────────────┘
                             │
         ┌───────────────────┼───────────────────┐
         │                   │                   │       
         ▼                   ▼                   ▼       
    GitHub API      Cloudflare DNS      GitHub Actions   
         │                   │                   │       
    Trigger WF          Update CNAME        VM A (Galio) 
         │                   │              Run Tunnel   
         │                   │                   │       
         └───────────────────┴────────────┐──────▼───────┐
                                          │ VM B (Borio) │
                                          │ Standby      │
                                          └──────────────┘
```

---

## 📁 Arquivos Criados

### Documentação Principal
- ✅ `planner.md` - Planejamento geral (este arquivo)
- ✅ `IMPLEMENTATION_CHECKLIST.md` - Checklist de implementação
- ✅ `.env.example` - Template de environment variables

### Documentação Técnica (`docs/`)
- ✅ `README.md` - Índice da documentação
- ✅ `architecture.md` - Arquitetura detalhada (9.8 KB)
- ✅ `api-specification.md` - Especificação da API (7.6 KB)
- ✅ `database-schema.md` - Schema do Turso DB (8.2 KB)
- ✅ `deployment-guide.md` - Guia de deploy (11 KB)

### Guias de Setup (`setup/`)
- ✅ `cloudflare-setup.md` - Configuração Cloudflare (8 KB)
- ✅ `turso-setup.md` - Configuração Turso (9 KB)
- ✅ `github-setup.md` - Configuração GitHub (9 KB)

---

## 📁 Estrutura de Arquivos

```
orchestrator-engine/
├── planner.md                          # Planejamento geral ✅
├── IMPLEMENTATION_CHECKLIST.md         # Checklist de implementação ✅
├── .env.example                        # Template de variáveis de ambiente ✅
├── docs/                               # Documentação técnica ✅
│   ├── README.md                       # Índice da documentação ✅
│   ├── architecture.md                 # Arquitetura detalhada ✅
│   ├── api-specification.md            # Especificação da API ✅
│   ├── database-schema.md              # Schema do Turso DB ✅
│   └── deployment-guide.md             # Guia de deploy ✅
├── setup/                              # Guias de setup ✅
│   ├── cloudflare-setup.md             # Como configurar Cloudflare ✅
│   ├── turso-setup.md                  # Como configurar Turso ✅
│   └── github-setup.md                 # Como configurar GitHub Actions ✅
├── src/                                # Código fonte (a implementar)
│   ├── index.ts
│   ├── types.ts
│   ├── lib/
│   │   ├── db.ts
│   │   ├── github.ts
│   │   ├── cloudflare.ts
│   │   └── utils.ts
│   └── handlers/
│       └── scheduled.ts
├── schema.sql                          # Schema do Turso DB (criar)
├── package.json                        # Dependências (criar)
├── tsconfig.json                       # TypeScript config (criar)
├── wrangler.toml                       # CF Worker config (criar)
└── .gitignore                          # Arquivos a ignorar (criar)
```

---

## 🚀 Fases de Implementação

### ✅ Fase 1: Planejamento (Completo)
- [x] Definir arquitetura do sistema
- [x] Criar estrutura de arquivos de planejamento
- [x] Documentar fluxo de rotação
- [x] Definir stack tecnológica (TypeScript + Hono)

### ✅ Fase 2: Documentação Técnica (Completo)
- [x] Arquitetura detalhada
- [x] Especificação da API
- [x] Schema do banco de dados
- [x] Guia de deployment
- [x] Guias de setup (Cloudflare, Turso, GitHub)

### 🔧 Fase 3: Setup de Infraestrutura
- [ ] Configurar domínio no Cloudflare
- [ ] Criar tunnels Galio e Borio
- [ ] Criar banco Turso
- [ ] Obter credenciais necessárias

### 💻 Fase 4: Implementação do Core Engine
- [ ] Setup projeto (package.json, tsconfig.json, wrangler.toml)
- [ ] Criar types TypeScript
- [ ] Implementar DB client (Turso)
- [ ] Implementar GitHub API integration
- [ ] Implementar Cloudflare DNS API
- [ ] Implementar rotation engine (CRON handler)
- [ ] Implementar entry point (Hono)

### 🧪 Fase 5: Testes e Debug
- [ ] Testar localmente com `wrangler dev`
- [ ] Validar health check
- [ ] Validar rotação de DNS
- [ ] Validar integração com GitHub Actions

### 🚢 Fase 6: Deploy em Produção
- [ ] Deploy para Cloudflare Workers
- [ ] Monitorar primeiras rotações
- [ ] Ajustar parâmetros conforme necessário

---

## 🎯 Prioridades

1. **Alta Prioridade:**
   - Sistema de rotação funcional
   - Health check confiável
   - Atualização de DNS sem erro

2. **Média Prioridade:**
   - UI de gerenciamento (fase 2)
   - Sistema de provisionamento automático de contas GitHub

3. **Baixa Prioridade:**
   - Integração com Gemini AI (mimetismo)
   - Dashboard avançado de monitoramento

---

## 🔐 Segurança

- Todos os comandos de shell são redirecionados para `/dev/null`
- Tokens são armazenados em environment variables/secrets
- Comandos são passados via Base64 encoding
- Logs das Actions não expõem informações sensíveis
- Rate limiting na API do GitHub
- Proteção contra brute-force na UI

---

## 📊 Métricas de Sucesso

- **Uptime do sistema:** > 99.5%
- **Tempo de rotação:** < 3 minutos (incluindo health check)
- **Taxa de falha de rotação:** < 1%
- **Tempo de cold start:** < 2 minutos
- **Overhead de DNS:** < 30 segundos (propagação)

---

## 🐛 Riscos e Mitigações

| Risco | Probabilidade | Impacto | Mitigação |
|-------|--------------|---------|-----------|
| GitHub Actions timeout | Média | Alto | Monitorar e ajustar commands |
| DNS propagation delay | Baixa | Médio | TTL=1 (Cloudflare proxied) |
| Turso DB downtime | Baixa | Alto | Implementar retry logic |
| API rate limit GitHub | Média | Médio | Usar múltiplas contas |
| Tunnel health check fails | Alta | Alto | Implementar graceful rollback |

---

## 📝 Próximos Passos

1. ✅ Criar documentação técnica detalhada (`docs/`)
2. ✅ Criar guias de setup (`setup/`)
3. ✅ Definir checklist de implementação (`IMPLEMENTATION_CHECKLIST.md`)
4. ⏳ Validar arquitetura com usuário
5. ⏳ Iniciar implementação após aprovação

---

## ⏱️ Status Atual

**Fase:** Planejamento Completo ✅

**Arquivos Criados:** 13 arquivos de documentação

**Próxima Etapa:**
- Aprovação da arquitetura
- Setup de infraestrutura (Cloudflare, Turso, GitHub)
- Implementação do Core Engine

---

## 🎉 Sumário

**Planejamento 100% completo!**

Todo o material necessário para implementação está pronto:
- ✅ Arquitetura documentada
- ✅ API especificada
- ✅ Database schema definido
- ✅ Guias de setup completos
- ✅ Checklist de implementação detalhado

**Pronto para:** Setup de infraestrutura e implementação do código.

---

## 🔗 Referências

- [Cloudflare Workers](https://developers.cloudflare.com/workers/)
- [Turso DB](https://turso.tech/)
- [GitHub Actions](https://docs.github.com/en/actions)
- [Cloudflare Tunnels](https://developers.cloudflare.com/cloudflare-one/connections/connect-apps/)
- [Hono Framework](https://hono.dev/)

---

**Última Atualização:** 23/03/2026
**Status:** ✅ Planejamento Completo
**Responsável:** OpenCode AI
**Arquivos de Documentação:** 13 arquivos criados
