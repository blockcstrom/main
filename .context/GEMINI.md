# Gemini Context: Orchestrator Engine (Control Plane)

## Project Overview
O **Orchestrator** é o cérebro da infraestrutura de automação de lives 24/7. Ele gerencia o ciclo de vida das VMs Gateway e Sessions, garantindo alta disponibilidade e segurança máxima através de uma arquitetura modular em Cloudflare Workers.

### Tecnologias Principais
- **Cloudflare Workers**: Runtime serverless de baixa latência.
- **Turso DB (libSQL)**: Banco de dados distribuído para persistência de GAccounts e estado global.
- **HMAC-SHA256**: Autenticação robusta via cookies assinados.
- **GitHub Actions API**: Orquestração de workflows para provisionamento de infraestrutura.

## Entidades do Ecossistema

- **`GAccount`**: Conta GitHub cadastrada via UI. Cada conta possui 20 slots (1 para Gateway, 19 para Sessions). Dados (Username, Token, Repo) persistidos no Turso.
- **`Orchestrator`**: Worker que serve a UI Cyberpunk, gerencia o CRUD de contas e executa a "Engrenagem de Rotação" via `scheduled` cron.
- **`Gateway`**: VM servidora (Action) que mantém a infraestrutura base ativa.
- **`Session`**: VM efêmera (Action) responsável pelo streaming. Ciclo máximo de 6h (360 min).
- **`T-Galio` / `T-Borio`**: Túneis redundantes que se alternam a cada ~5h 50min para garantir cobertura 24/7 sem quedas.

## Fluxo de Operação (Engrenagem)
1. **Monitoramento**: O Worker verifica o tempo de vida da VM ativa a cada minuto.
2. **Rotação (340-350 min)**: Entre 5h 40min e 5h 50min, o Orchestrator seleciona uma `GAccount` com slots livres e dispara uma nova `Session` (T-Borio ou T-Galio).
3. **Overlap (10-20 min)**: A nova VM assume o tráfego enquanto a antiga encerra naturalmente ao atingir o limite de 6h do GitHub.

## Segurança e Blindagem
- **Secrets**: `TURSO_DB_URL`, `TOKEN`, `BASIC_AUTH_USER/PASS` são ocultos do código.
- **Proteção**: Anti-CSRF (`X-Requested-With`) e Rate Limiting por IP (Lockout de 30 min).
- **Interface**: Acesso restrito via Chave de Acesso com assinatura temporal.

## Comandos Úteis (Diretório `orchestrator/`)
- `npm run dev`: Teste local.
- `npm run deploy`: Publicação oficial.
- `npx wrangler secret put [NOME]`: Configuração de credenciais.
