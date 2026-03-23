# Orchestrator Engine v2.2

Cloudflare Worker para gerenciamento de GitHub Actions como VMs gratuitas com Cloudflare Tunnels.

## Estrutura

```
_main/
├── src/
│   ├── index.ts                   # Entry point
│   ├── lib/
│   │   ├── db.ts                  # Turso DB client
│   │   ├── github.ts              # GitHub API client
│   │   ├── cloudflare.ts          # Cloudflare API client
│   │   └── names.ts               # Gerador de nomes
│   ├── routes/
│   │   ├── register.ts            # POST /register
│   │   ├── health.ts              # GET /health
│   │   └── boot.ts                # POST /boot
│   ├── services/
│   │   ├── registration.ts        # Serviço de registro
│   │   └── boot.ts                # Serviço de A-Boot
│   └── types/
│       └── index.ts               # TypeScript types
├── package.json
├── wrangler.toml
├── tsconfig.json
└── .env.example
```

## Setup

```bash
cd _main
npm install
cp .env.example .env
# Editar .env com suas credenciais
npm run build
npm run dev
```

## Deploy

```bash
npm run deploy
```

## Documentação

- [Estrutura](../docs/worker/worker-structure.md)
- [Implementação](../docs/worker/worker-implementation.md)
- [Templates](../docs/worker/code-templates.md)
- [Setup](../docs/worker/project-setup.md)
