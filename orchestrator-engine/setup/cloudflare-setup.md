# ☁️ Cloudflare Setup Guide

## Visão Geral

Guia detalhado para configurar Cloudflare: domínio, tunnels, DNS e API tokens para o Orchestrator Engine.

---

## 📋 Pré-requisitos

- [ ] Conta Cloudflare (plano Free é suficiente)
- [ ] Domínio `kill-kick.shop` registrado
- [ ] Acesso ao registrador do domínio

---

## 1. Registrar Domínio

### Passo 1: Adicionar Domínio no Cloudflare

1. Acesse: https://dash.cloudflare.com
2. Clique em "Add a Site" (ou "Add a domain")
3. Digite `kill-kick.shop`
4. Selecione plano **Free**
5. Clique em "Add Site"

### Passo 2: Atualizar Nameservers

Cloudflare vai fornecer 2 nameservers (ex: `alice.ns.cloudflare.com` e `bob.ns.cloudflare.com`).

**O que fazer:**
1. Copie os 2 nameservers fornecidos
2. Vá ao registrador do domínio (Namecheap, GoDaddy, etc.)
3. Encontre opção "Nameservers" ou "DNS"
4. Substitua os nameservers atuais pelos do Cloudflare
5. Salve as alterações

**Tempo de propagação:** 24-48 horas (geralmente < 2h)

### Passo 3: Verificar Status

No Cloudflare Dashboard:
- Status deve mudar para **"Active"** quando nameservers propagarem
- Você pode clicar em "Recheck nameservers" para atualizar

---

## 2. Obter Zone ID

**Zone ID** é identificador único do seu domínio.

### Passo 1: Navegar para o Domínio

1. No Dashboard, clique em `kill-kick.shop`
2. Verá dashboard do domínio

### Passo 2: Localizar Zone ID

1. Olhe para a **sidebar direita**
2. Encontre seção **"API"**
3. **Zone ID** está lá

Exemplo:
```
Zone ID: abc123def456789...
```

**Copiar e salvar** (vai ser usado no `.env`)

---

## 3. Criar Registro DNS CNAME

Este registro aponta `controller.kill-kick.shop` para o tunnel ativo.

### Passo 1: Acessar DNS

1. No Dashboard do domínio
2. Clique em **"DNS"** no menu lateral
3. Clique em **"Records"**

### Passo 2: Adicionar Registro

Clique em **"Add Record"**

Preencha:
| Campo | Valor |
|-------|-------|
| Type | `CNAME` |
| Name | `controller` |
| Target | `placeholder.cfargotunnel.com` *(temporário)* |
| Proxy status | ✅ **Proxied** (orange cloud) |
| TTL | `Auto` |

Clique em **"Save"**

**Nota:** `placeholder` será substituído pelo tunnel real durante operação.

---

## 4. Obter DNS Record ID

**DNS Record ID** é identificador único do registro CNAME.

### Opção A: Via API (Recomendado)

```bash
# Substitua pelos seus valores
curl -X GET "https://api.cloudflare.com/client/v4/zones/<ZONE_ID>/dns_records?name=controller.kill-kick.shop&type=CNAME" \
  -H "Authorization: Bearer <API_TOKEN>"
```

**Resposta:**
```json
{
  "success": true,
  "result": [{
    "id": "1234567890abcdef",
    "type": "CNAME",
    "name": "controller.kill-kick.shop",
    "content": "placeholder.cfargotunnel.com"
  }]
}
```

**Copie o `id`:** `1234567890abcdef`

### Opção B: Via Browser DevTools

1. Vá para DNS Records no dashboard
2. Abra DevTools (`F12`)
3. Vá para aba **"Network"**
4. Clique no registro `controller`
5. Filtre por `dns_records`
6. Clique na request
7. Vá para aba **"Response"**
8. Copie o `id` do JSON

---

## 5. Criar Cloudflare Tunnels

Tunnels permitem expor serviços sem IP público.

### Passo 1: Instalar cloudflared

```bash
# Linux/macOS
wget -q https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64 -O cloudflared
chmod +x cloudflared

# Ou via brew (macOS)
brew install cloudflare/cloudflare/cloudflared

# Windows
# Baixar de: https://github.com/cloudflare/cloudflared/releases
```

### Passo 2: Autenticar

```bash
./cloudflared tunnel login
```

1. Abre browser
2. Selecione domínio `kill-kick.shop`
3. Clique em "Authorize"

### Passo 3: Criar Tunnel Galio

```bash
./cloudflared tunnel create galio
```

**Output:**
```
Created tunnel galio with id: abc12345-6789-abcd-ef01-234567890abc
Your tunnel has been created! You can start it by running:
  cloudflared tunnel run galio
```

**Salvar:**
- **Tunnel ID:** `abc12345-6789-abcd-ef01-234567890abc`
- **Tunnel hostname:** `abc12345-6789-abcd-ef01-234567890abc.cfargotunnel.com`

### Passo 4: Criar Tunnel Borio

```bash
./cloudflared tunnel create borio
```

**Output:**
```
Created tunnel borio with id: def67890-1234-abcd-ef01-234567890def
Your tunnel has been created! You can start it by running:
  cloudflared tunnel run borio
```

**Salvar:**
- **Tunnel ID:** `def67890-1234-abcd-ef01-234567890def`
- **Tunnel hostname:** `def67890-1234-abcd-ef01-234567890def.cfargotunnel.com`

### Passo 5: Obter Tokens dos Tunnels

Tokens são usados para iniciar os tunnels sem autenticação interativa.

```bash
# Token Galio
./cloudflared tunnel token galio
```

Output:
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ...
```

```bash
# Token Borio
./cloudflared tunnel token borio
```

Output:
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ...
```

**Copiar e salvar ambos os tokens.**

---

## 6. Criar API Token

API Token é usado para atualizar DNS programaticamente.

### Passo 1: Acessar API Tokens

1. Acesse: https://dash.cloudflare.com/profile/api-tokens
2. Clique em **"Create Token"**

### Passo 2: Usar Template

1. Clique em **"Use template"**
2. Selecione: **"Edit Zone DNS"**

### Passo 3: Configurar Permissões

**Permissions:**
| Resource | Permission |
|----------|-----------|
| Zone | DNS → Edit |

**Zone Resources:**
```
Include → kill-kick.shop
```

**Client IP Address Filtering:** (opcional)
- Não necessário para desenvolvimento
- Recomendado para produção

### Passo 4: Continuar e Criar

1. Clique em **"Continue to summary"**
2. Revisar configurações
3. Clique em **"Create Token"**
4. **Copie o token gerado**

Formato:
```
Bearer abc123def456...
```

---

## 7. Atualizar DNS com Tunnel Real (Teste)

Depois de configurar o Orchestrator Engine, você pode testar se o tunnel está funcionando.

### Passo 1: Atualizar DNS Manualmente

```bash
curl -X PATCH "https://api.cloudflare.com/client/v4/zones/<ZONE_ID>/dns_records/<DNS_RECORD_ID>" \
  -H "Authorization: Bearer <API_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "type": "CNAME",
    "name": "controller",
    "content": "abc12345-6789-abcd-ef01-234567890abc.cfargotunnel.com",
    "ttl": 1,
    "proxied": true
  }'
```

### Passo 2: Verificar Propagação

```bash
dig controller.kill-kick.shop +short
```

Output:
```
abc12345-6789-abcd-ef01-234567890abc.cfargotunnel.com
```

### Passo 3: Testar Tunnel (se tiver serviço rodando)

```bash
curl https://controller.kill-kick.shop/health
```

---

## 8. Configurar Ingress do Tunnel (Opcional)

Se você quiser configurar routing específico do tunnel:

```bash
# Configurar ingress para Galio
./cloudflared tunnel route dns galio controller-galio.kill-kick.shop

# Configurar ingress para Borio
./cloudflared tunnel route dns borio controller-borio.kill-kick.shop
```

**Nota:** O Orchestrator Engine não usa isso, pois configura routing via stdin.

---

## 9. Troubleshooting

### Problema: Nameservers não propagam

**Solução:**
- Aguardar 24-48 horas
- Verificar se configurou corretamente no registrador
- Usar "Recheck nameservers" no Cloudflare

### Problema: API Token não funciona

**Solução:**
- Verificar se tem permissão "DNS → Edit"
- Verificar se Zone está "Include" para seu domínio
- Verificar se token não expirou

### Problema: Tunnel token inválido

**Solução:**
- Gerar novo token com `cloudflared tunnel token <tunnel>`
- Tokens expiram e devem ser regenerados periodicamente

### Problema: DNS não atualiza

**Solução:**
- Verificar se Zone ID está correto
- Verificar se DNS Record ID está correto
- Verificar se API Token tem permissões corretas

---

## 10. Checklist Final

- [ ] Domínio registrado no Cloudflare
- [ ] Nameservers propagados
- [ ] Zone ID obtido
- [ ] Registro CNAME `controller` criado
- [ ] DNS Record ID obtido
- [ ] Tunnel Galio criado
- [ ] Tunnel Borio criado
- [ ] Tokens dos tunnels obtidos
- [ ] API Token criado

---

**Última Atualização:** 23/03/2026
