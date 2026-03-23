# Projeto: Orchestrator Engine (Control Plane)

Este documento documenta a arquitetura modular e a evolução histórica do sistema de infraestrutura para manutenção de VMs Gateway 24/7 com troca automática de túneis.

---

## 🏗️ Arquitetura Modular (Base Estrutural)

O sistema segue o princípio de **Responsabilidade Única (SRP)** e **Separação de Preocupações**, garantindo segurança e escalabilidade.

### 📁 Organização de Pastas e Módulos:

- **`.context/`**: Repositório centralizado de documentação e planejamento.
- **`orchestrator/src/`**: Núcleo do Control Plane (Cloudflare Worker).
  - **`index.ts`**: Entry point. Middleware de autenticação via **Cookies HMAC-SHA256** e auto-migração de DB.
  - **`api/router.ts`**: Gerenciamento de rotas, proteção CSRF e lógica de login.
  - **`handlers/scheduled.ts`**: Orquestrador de infraestrutura. Gerencia a rotação inteligente (340-350 min) e o **Healthcheck Ativo** antes de virar o DNS.
  - **`lib/github-init.ts`**: Motor de Provisionamento Automático. Cria repositórios e aplica mimetismo digital.
  - **`lib/cloudflare.ts`**: Integração com a API da Cloudflare para o chaveamento dinâmico de CNAME (Galio/Borio).
  - **`ui/template.ts`**: Dashboard Cyberpunk com barra de progresso para provisionamento em tempo real.
  - **`lib/utils.ts`**: Utilitários de criptografia, assinatura de sessão e cliente LibSQL.

---

## 🚀 Funcionalidades de Elite Implementadas

### 1. Rotação com Zero Downtime
- **Ciclo Inteligente**: Disparo automático entre 340 e 350 minutos (jitter aleatório) para evitar padrões.
- **Sentinela de Healthcheck**: O Worker monitora o novo túnel até ele responder `200 OK`. O DNS só é trocado após confirmação de vida da nova VM.
- **DNS Switcher**: API Cloudflare altera o alvo do CNAME dinamicamente entre os IDs de túnel (Galio/Borio).

### 2. Provisionamento "One-Click" (Mimetismo Digital)
- **Automação de Repositórios**: O sistema aceita apenas o `ghp_token`. Identifica o dono, cria um repositório com nome técnico profissional (`env-metadata-xxxx`) e popula instantaneamente.
- **Shadow Mode (Base64 Injection)**: Injeta os comandos de tunelamento dentro de workflows camuflados (`build.yml`, `ci-tests.yml`, etc.). O código do repositório parece um projeto de DevOps legítimo.
- **Estabilidade de Upload**: Sistema sequencial e paralelo para garantir que o `README.md` e os 4 workflows sejam criados sem bloqueios da API do GitHub.

### 3. Blindagem e Segurança
- **Sessions HMAC**: Sessões assinadas impedem falsificação de cookies.
- **Anti-BruteForce**: Bloqueio rigoroso de 30 minutos após 5 tentativas falhas de login.
- **Obscuridade**: Repositórios públicos sem segredos salvos; tokens são injetados via payload de disparo cifrado em Base64.

---

## ⏱️ Histórico de Evolução Recente

1.  **Fase de Controle**: Implementação do Chaveador de DNS e lógica de Healthcheck no `scheduled.ts`.
2.  **Fase de Camuflagem**: Criação do módulo `github-init.ts` para mimetismo de repositórios.
3.  **Fase de Performance**: Otimização de uploads e transição para o modelo de provisionamento simplificado e estável.
4.  **Fase de Interface**: Evolução do Dashboard para suporte ao provisionamento automático com barra de progresso.

---

## 🛠️ Próximos Passos
- Monitoramento de logs de background na UI.
- Expansão do acervo de nomes de repositórios para maior variabilidade.
