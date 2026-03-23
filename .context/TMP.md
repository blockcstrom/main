# Instruções Finais de Blindagem e Deploy

Siga os comandos abaixo para configurar o Orchestrator com injeção de tokens direta (GitHub limpo).

---

## 1. 🔑 Configuração de Segredos (Execute um por um)

No terminal, dentro da pasta `orchestrator/`:

```bash
# Acesso e Banco
npx wrangler secret put BASIC_AUTH_USER
npx wrangler secret put BASIC_AUTH_PASS
npx wrangler secret put TURSO_DB_URL
npx wrangler secret put TURSO_DB_AUTH_TOKEN

# Cloudflare DNS Switcher
npx wrangler secret put CLOUDFLARE_ZONE_ID
npx wrangler secret put CLOUDFLARE_API_TOKEN
npx wrangler secret put DNS_RECORD_ID

# Túneis (IDs e Tokens)
npx wrangler secret put GALIO_TUNNEL_ID
npx wrangler secret put GALIO_TOKEN
npx wrangler secret put BORIO_TUNNEL_ID
npx wrangler secret put BORIO_TOKEN
```

### Valores do Galio:
- **ID**: `8329ea40-54b4-44f5-96b6-7b4c46ec0734.cfargotunnel.com`
- **Token**: `eyJhIjoiNjk2ZmRhZDE4YjUzMjIyYmY5YTA1OGQxMWIxZGM1NzEiLCJ0IjoiODMyOWVhNDAtNTRiNC00NGY1LTk2YjYtN2I0YzQ2ZWMwNzM0IiwicyI6Ik1EY3hPR1ExTkRjdFlUVXdOaTAwTXpBd0xXRTRORGd0TVRReE9HTXhZV0kyT1RNeCJ9`

### Valores do Borio:
- **ID**: `104d8f0b-3d5b-4d3c-859b-30a9345769af.cfargotunnel.com`
- **Token**: `eyJhIjoiNjk2ZmRhZDE4YjUzMjIyYmY5YTA1OGQxMWIxZGM1NzEiLCJ0IjoiMTA0ZDhmMGItM2Q1Yi00ZDNjLTg1OWItMzBhOTM0NTc2OWFmIiwicyI6Ik1XVmlaRGMwTnpZdFlUQmhPQzAwTnpWaExXRTBZamd0T0dKaFpqWXdZV1l5T1RsaiJ9`

---

## 2. 🛰️ Como descobrir o `DNS_RECORD_ID`

Substitua os valores abaixo e execute no terminal:

```bash
curl -X GET "https://api.cloudflare.com/client/v4/zones/eaeac238d3db6e1a04dca3276c7e3709/dns_records?name=gateway.kill-kick.shop" \
     -H "Authorization: Bearer cfut_v4Ihe1dQhYm9xA8FHmX265bL1pV8N0OOxPqoKw765940bfe7" \
     -H "Content-Type: application/json"
```
*Copie o `"id"` da resposta para configurar o `DNS_RECORD_ID`.*
d3a33acb3446ff69cc7d4a0638e7c863
---

## 3. 🚀 Deploy Final

```bash
cd orchestrator
npm run deploy
```

---

## ⚠️ Nota Importante (GitHub Actions)
Como estamos passando o token diretamente, o seu arquivo `session.yml` no GitHub deve estar preparado para ler o input `token`:

```yaml
# Trecho do seu session.yml
on:
  repository_dispatch:
    types: [session]

jobs:
  run:
    runs-on: ubuntu-latest
    steps:
      - name: Run Cloudflared
        run: |
          docker run cloudflare/cloudflared:latest tunnel --no-autoupdate run --token ${{ github.event.client_payload.token }}
```
