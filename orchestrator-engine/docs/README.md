# 📚 Orchestrator Engine - Documentation

Bem-vindo à documentação técnica completa do Orchestrator Engine.

---

## 📑 Índice de Documentação

### Documentação Principal

1. **[Architecture](architecture.md)** - Arquitetura detalhada do sistema
   - Visão geral dos componentes
   - Fluxo de rotação de tunnels
   - Diagramas de arquitetura
   - Considerações de performance
   - Riscos e mitigações

2. **[API Specification](api-specification.md)** - Especificação da API
   - Endpoints HTTP
   - Requests/Responses
   - Rate limiting
   - Error codes

3. **[Database Schema](database-schema.md)** - Schema do Turso DB
   - Estrutura das tabelas
   - Queries comuns
   - Migrações
   - Considerações de performance

4. **[Deployment Guide](deployment-guide.md)** - Guia de deploy
   - Pré-requisitos
   - Setup completo passo-a-passo
   - Deploy local e produção
   - Troubleshooting

### Guias de Setup

5. **[Cloudflare Setup](../setup/cloudflare-setup.md)** - Configuração Cloudflare
   - Registrar domínio
   - Criar tunnels
   - Configurar DNS
   - Obter API tokens

6. **[Turso Setup](../setup/turso-setup.md)** - Configuração Turso
   - Instalar CLI
   - Criar banco
   - Executar schema
   - Backup e restore

7. **[GitHub Setup](../setup/github-setup.md)** - Configuração GitHub
   - Criar repositório
   - Configurar workflows
   - Gerar tokens
   - Testar integração

---

## 🚀 Como Começar

### Se você quer entender o sistema:
Comece com **[Architecture](architecture.md)** para ter uma visão geral.

### Se você quer implementar:
Siga a ordem:
1. **[Cloudflare Setup](../setup/cloudflare-setup.md)**
2. **[Turso Setup](../setup/turso-setup.md)**
3. **[GitHub Setup](../setup/github-setup.md)**
4. **[Deployment Guide](deployment-guide.md)**

### Se você quer deploy:
Vá direto para **[Deployment Guide](deployment-guide.md)**

---

## 📋 Estrutura do Projeto

```
orchestrator-engine/
├── planner.md                      # Planejamento geral
├── IMPLEMENTATION_CHECKLIST.md     # Checklist de implementação
├── .env.example                    # Template de environment variables
├── README.md                       # Documentação original
├── docs/                           # Documentação técnica (este diretório)
│   ├── architecture.md             # Arquitetura do sistema
│   ├── api-specification.md        # Especificação da API
│   ├── database-schema.md          # Schema do Turso DB
│   └── deployment-guide.md        # Guia de deploy
└── setup/                          # Guias de setup
    ├── cloudflare-setup.md         # Configuração Cloudflare
    ├── turso-setup.md              # Configuração Turso
    └── github-setup.md             # Configuração GitHub
```

---

## 🎯 Stack Tecnológico

- **Runtime:** Cloudflare Workers
- **Framework:** Hono (TypeScript)
- **Database:** Turso (libSQL)
- **CI/CD:** GitHub Actions
- **Networking:** Cloudflare Tunnels
- **DNS:** Cloudflare DNS

---

## 📖 Conceitos Principais

### O que é o Orchestrator Engine?

Um sistema de orquestração que mantém uma "VM" (GitHub Action) sempre ativa através de rotação automática, usando Cloudflare Tunnels para exposição de serviços.

### Como funciona?

1. **CRON Trigger:** Worker roda a cada 1 minuto
2. **State Check:** Verifica última rotação
3. **Decision:** Se passado o tempo, inicia rotação
4. **Dispatch:** Dispara nova GitHub Action
5. **Health Check:** Aguarda tunnel ficar online
6. **DNS Update:** Aponta domínio para novo tunnel
7. **State Update:** Atualiza estado no Turso DB

### Por que 15 minutos de overlap?

- GitHub Actions têm cold start (~1-2 min)
- Health check loop leva até 2.5 min
- DNS propagation é instantânea (proxied)
- Overlap garante zero downtime

---

## 🔒 Segurança

- Tokens armazenados em environment variables
- Comandos totalmente silenciados (`2>/dev/null`)
- Base64 encoding para comandos shell
- Nenhum log expõe informações sensíveis
- Rate limiting em APIs externas

---

## 📊 Métricas de Sucesso

- **Uptime:** > 99.5%
- **Rotation Latency:** < 3 minutos
- **Health Check Success:** > 95%
- **Cold Start:** < 2 minutos

---

## 🐛 Troubleshooting

### Worker não roda CRON
- Verificar configuration no `wrangler.toml`
- Verificar logs com `wrangler tail`

### DNS não atualiza
- Verificar API Token
- Verificar Zone ID
- Verificar DNS Record ID

### Health check falha
- Verificar se tunnel está rodando
- Verificar token do tunnel
- Verificar logs da GitHub Action

---

## 📝 Contribuindo

Esta documentação é parte do planejamento inicial. Para contribuir:

1. Leia os documentos existentes
2. Entenda a arquitetura proposta
3. Siga os padrões de documentação
4. Teste instruções antes de alterar

---

## 🔗 Links Úteis

- [Cloudflare Workers](https://developers.cloudflare.com/workers/)
- [Turso DB](https://turso.tech/)
- [GitHub Actions](https://docs.github.com/en/actions)
- [Cloudflare Tunnels](https://developers.cloudflare.com/cloudflare-one/connections/connect-apps/)
- [Hono Framework](https://hono.dev/)

---

## ⏱️ Timeline de Implementação

| Fase | Descrição | Status |
|------|-----------|--------|
| 1 | Planejamento | ✅ Completo |
| 2 | Documentação | ✅ Completo |
| 3 | Setup Infraestrutura | ⏳ Pendente |
| 4 | Implementação Core | ⏳ Pendente |
| 5 | Testing | ⏳ Pendente |
| 6 | Deploy | ⏳ Pendente |

---

**Última Atualização:** 23/03/2026
**Versão:** 1.0.0
**Status:** Planejamento completo
