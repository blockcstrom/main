# REGRAS DO SISTEMA (CORE MANDATES)

## 🏗️ ARQUITETURA & MODULARIDADE
- **SEM CÓDIGO MONOLÍTICO**: Cada funcionalidade deve residir em seu módulo específico (`api/`, `handlers/`, `lib/`, `ui/`).
- **MODULARIDADE COMO PILAR**: O sistema deve ser expansível sem a necessidade de reescrever o núcleo.
- **SEPARAÇÃO DE PREOCUPAÇÕES**: Lógica de negócio, persistência e interface devem ser estritamente separadas.

## 🛡️ SEGURANÇA MÁXIMA (ZERO TRUST)
- **SESSÕES HMAC**: Toda sessão deve ser assinada com HMAC-SHA256 usando segredos dinâmicos.
- **LOCKOUT RIGOROSO**: Bloqueio automático de IP por 30 minutos após 5 tentativas falhas.
- **PROTEÇÃO CSRF**: Exigência obrigatória do cabeçalho `X-Requested-With` em todas as operações de escrita.
- **BLINDAGEM DE SECRETS**: Nenhuma chave ou token em arquivos de configuração (`wrangler.jsonc`). Uso exclusivo de Secrets e `.dev.vars`.

## 🌑 MIMETISMO & STEALTH (SHADOW MODE)
- **OBSCURIDADE TOTAL**: Repositórios públicos devem parecer projetos de DevOps/CI genéricos e profissionais.
- **SHADOW INJECTION**: Comandos sensíveis devem ser injetados via Base64 e mascarados nos logs com `::add-mask::`.
- **RUIDO INOFENSIVO**: Workflows devem conter passos coerentes com o tema para disfarçar o tunelamento.

## 🚀 INFRAESTRUTURA & STABILIDADE
- **ZERO DOWNTIME**: O chaveamento de DNS só é permitido após confirmação de Healthcheck (200 OK) da nova VM.
- **ORDEM DE INICIALIZAÇÃO**: Upload de README.md deve preceder a criação de subpastas para garantir a integridade do repo.
- **CONTROLE DE TIME-OUTS**: Processos pesados devem ser otimizados (paralelismo) ou executados via `ctx.waitUntil`.

## 📝 DOCUMENTAÇÃO & FLUXO
- **INSTRUÇÕES TEMPORÁRIAS**: Sempre escrever diretrizes voláteis em `TMP.md`.
- **COMENTÁRIOS EXPLICATIVOS**: Todo código complexo deve ser precedido por um resumo de intenção.
- **LIMPEZA DE CÓDIGO**: Evitar saturação de lógica redundante ou bibliotecas desnecessárias.
