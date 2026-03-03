# AdvCargo - Gestão Jurídica

Sistema web para advogados e escritórios de advocacia: processos, prazos, audiências, clientes, financeiro e relatórios.

## Tecnologias

- **Frontend:** React 18, Vite, Tailwind CSS, React Router, PWA
- **Backend:** Node.js, Express, Prisma
- **Banco:** PostgreSQL

## Requisitos

- Node.js 18+
- Docker e Docker Compose (para o PostgreSQL)

## HTTPS (uso exclusivo)

O sistema está configurado para **usar somente HTTPS**:

- **Produção:** Requisições HTTP são redirecionadas (301) para HTTPS. O header **Strict-Transport-Security (HSTS)** é enviado para o navegador exigir HTTPS.
- **Atrás de proxy (nginx, Cloudflare, etc.):** O backend confia no header `X-Forwarded-Proto`. Se for `http`, redireciona para `https`.
- **API em HTTPS local:** No `backend/.env` defina `USE_HTTPS=true`, `SSL_KEY_PATH` e `SSL_CERT_PATH` (caminhos para key e cert). Ex.: certificado autoassinado com `openssl req -x509 -newkey rsa:4096 -keyout key.pem -out cert.pem -days 365 -nodes`.
- **Frontend:** Em produção, sirva o frontend e a API sempre por HTTPS. Configure `FRONTEND_URL` e a URL da API (variável de ambiente no build) com `https://`.

## Instalação

### 1. Dependências do projeto

```bash
cd advcargo
npm install
cd backend && npm install
cd ../frontend && npm install
```

### 2. PostgreSQL com Docker

Na raiz do projeto, suba o banco:

```bash
docker compose up -d
```

Isso sobe o PostgreSQL na porta **5432** com:
- **Usuário:** postgres  
- **Senha:** postgres  
- **Banco:** advcargo  

O `backend/.env` já está configurado para essa conexão.

### 3. Banco de dados (Prisma)

Com o container rodando:

```bash
cd backend
npx prisma generate
npx prisma db push
npx prisma db seed   # opcional: usuário demo@advcargo.com.br / 123456
```

Para parar o banco: `docker compose down`. Os dados ficam no volume `advcargo_pgdata`.

### 4. Executar

Em um terminal (backend):

```bash
cd backend
npm run dev
```

Em outro (frontend):

```bash
cd frontend
npm run dev
```

- Frontend: http://localhost:5173  
- API: http://localhost:3001  

Ou na raiz: `npm run dev` (sobe backend e frontend juntos).

## Deploy na Vercel (usar os dados que já existem)

O frontend sobe na Vercel; o backend e o banco ficam em outros serviços. Para ter os **mesmos dados** (usuários demo, Hub Central, etc.) em produção:

### 1. Banco em produção (PostgreSQL na nuvem)

Crie um PostgreSQL em um destes (gratuito para começar):

- [Neon](https://neon.tech)  
- [Vercel Postgres](https://vercel.com/storage/postgres)  
- [Supabase](https://supabase.com)  

Copie a **connection string** (ex.: `postgresql://user:pass@host/db?sslmode=require`).

### 2. Enviar schema e dados para o banco de produção

No seu PC, na pasta `backend`, use a URL do banco de produção **só para estes comandos**:

```bash
cd backend
set DATABASE_URL=postgresql://usuario:senha@host:5432/banco?sslmode=require
npx prisma db push
npx prisma db seed
```

(No PowerShell: `$env:DATABASE_URL="postgresql://..."; npx prisma db push; npx prisma db seed`.)

Assim as tabelas e os dados do seed (demo@advcargo.com.br, admin@hubcentral.com, vanderson@hubcentral.com, clientes, processos, etc.) ficam no banco de produção.

### 3. Backend em produção

Suba a API em [Railway](https://railway.app), [Render](https://render.com) ou similar:

- Defina a variável **DATABASE_URL** com a mesma connection string do passo 1.
- Defina **JWT_SECRET** e **FRONTEND_URL** (URL do frontend na Vercel, ex. `https://adv-cargo.vercel.app`).
- Comando de start: `npm start` (ou `node src/server.js`), raiz do backend.

Anote a URL da API (ex.: `https://advcargo-api.up.railway.app`).

### 4. Frontend na Vercel

No projeto na Vercel (conectado a este repositório):

1. **Settings → Environment Variables**
2. Adicione:
   - **Nome:** `VITE_API_URL`  
   - **Valor:** URL do backend (ex.: `https://advcargo-api.up.railway.app`)  
   - Marque **Production**, **Preview** e **Development** se quiser.
3. Faça um novo **Deploy** (Redeploy ou push no `main`).

O build do frontend usa `VITE_API_URL`; a aplicação na Vercel passará a usar a API e o banco de produção com os dados do seed.

**Resumo:** Banco (Neon/Vercel Postgres/Supabase) → `db push` + `db seed` com essa URL → Backend (Railway/Render) com a mesma `DATABASE_URL` → Frontend na Vercel com `VITE_API_URL` apontando para o backend.

## Funcionalidades

- **Processos:** Cadastro (número CNJ, partes, assunto, valor), timeline, status (Ativo, Arquivado, Suspenso, Encerrado)
- **Prazos:** Calendário por mês, prioridade (urgente/importante/rotina), notificações (24h, 48h, 7 dias)
- **Audiências:** Data, horário, local, tipo, check realizado/não realizado
- **Clientes:** Dados básicos, histórico de processos
- **Financeiro:** Honorários, despesas, receitas, saldo por período
- **Relatórios:** Processos por status, fluxo de caixa, produtividade; exportação TXT
- **Busca global:** Ctrl+K para buscar processos, clientes e prazos
- **Modo escuro** e layout responsivo (mobile-first)

## Sistema de defesa contra ameaças

O sistema inclui camadas de defesa e ferramentas para **rastrear, bloquear e responder** a ameaças:

### Camadas de defesa

1. **Lista de bloqueio (blocklist)**  
   IPs bloqueados são rejeitados com 403 antes de qualquer processamento. A lista é mantida em memória e no banco (`BlockedIp`); ao subir o servidor, os IPs do banco são carregados.

2. **Detecção de padrões de ataque**  
   Cada requisição à API (exceto `/api/health`) é analisada. Se for detectado padrão de **SQL injection**, **XSS**, **path traversal** ou **padrão suspeito** (ex.: acesso a `.env`, `wp-admin`), a requisição é bloqueada (403) e o evento é registrado em `ThreatLog`.

3. **Rate limiting**  
   Limite por IP (ex.: 300 requisições a cada 15 minutos). Excedendo o limite, a requisição retorna 429 e o evento é registrado em `AuditLog`.

4. **Headers de segurança**  
   `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, `X-XSS-Protection: 1; mode=block`; em produção também HSTS.

### API de segurança (somente usuário `dev`)

- `GET /api/security/blocked` — Lista IPs bloqueados (banco + memória)
- `POST /api/security/block` — Bloquear IP (body: `{ ip, reason? }`)
- `DELETE /api/security/block/:ip` — Desbloquear IP
- `GET /api/security/threats` — Últimas ameaças detectadas (`ThreatLog`)
- `GET /api/security/report` — Relatório (ameaças, logins falhos, rate limit, bloqueados)
- `GET /api/security/scan` — Scan de IPs suspeitos (sugestão de bloqueio por pontuação)

### Scripts de defesa (terminal, na pasta `backend`)

| Script | Uso | Descrição |
|--------|-----|-----------|
| `npm run security:block -- <IP> [motivo]` | Bloquear IP | Adiciona à blocklist (memória + banco) |
| `npm run security:unblock -- <IP>` | Desbloquear IP | Remove da blocklist |
| `npm run security:report -- [horas]` | Relatório | Ameaças, logins falhos, rate limit, bloqueados (padrão 24h) |
| `npm run security:scan -- [horas]` | Scan | IPs suspeitos com pontuação (sugestão de bloqueio) |
| `npm run security:export -- [horas] [json\|csv]` | Exportar | Exporta ameaças para `backend/exports/` (rastreamento/análise) |

Exemplos:

```bash
cd backend
npm run security:block -- 192.168.1.100 "tentativa sql injection"
npm run security:unblock -- 192.168.1.100
npm run security:report -- 48
npm run security:scan -- 24
npm run security:export -- 24 csv
```

A página **Defesa e ameaças** (menu lateral, usuário `dev`) permite ver o resumo, bloquear/desbloquear IPs pela interface e consultar as ameaças detectadas.

## Modelo de negócio (SaaS)

- Trial 14 dias sem cartão
- Planos: Individual (1 usuário), Equipe (até 5), Escritório (até 20)

## Licença

Projeto de demonstração.
