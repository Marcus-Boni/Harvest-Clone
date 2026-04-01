# Design: Hours Reminder Email System

**Date:** 2026-04-01  
**Status:** Approved  
**Author:** Marcus Boni

---

## Overview

Managers e admins do OptSolv Time precisam lembrar membros da equipe de submeter suas horas semanais — requisito crítico para pagamento correto. Esta feature adiciona envio de e-mail de lembrete manual (por usuário ou em massa) e agendamento automático configurável, integrado ao Resend já existente.

---

## Requisitos

- Manager/admin pode enviar lembrete para um usuário específico ou para toda a equipe/subordinados
- Manager/admin pode configurar um agendamento automático (dia da semana + horário + condição)
- O agendamento vem **desabilitado por padrão**
- E-mail usa template padrão com campo de nota opcional do manager
- A condição `not_submitted` filtra apenas quem ainda não submeteu o timesheet da semana atual
- Histórico de disparos acessível na UI
- Agendamento automático disparado via endpoint cron protegido por `CRON_SECRET`

---

## Banco de Dados

### Nova tabela: `reminderSchedule`

Configuração do agendamento automático. Uma linha por organização (gerenciada por admin/manager).

| Coluna | Tipo | Descrição |
|---|---|---|
| `id` | uuid PK | |
| `createdById` | FK → user.id | Quem criou/atualizou a configuração |
| `enabled` | boolean, default `false` | Toggle de habilitação |
| `daysOfWeek` | integer[] | Dias da semana: 0=domingo … 6=sábado |
| `hour` | integer (0–23) | Hora do disparo |
| `minute` | integer (0–59) | Minuto do disparo |
| `timezone` | text | Ex: `"America/Sao_Paulo"` |
| `condition` | enum `all \| not_submitted` | `all`: envia para todos; `not_submitted`: filtra quem não submeteu o timesheet da semana atual |
| `targetScope` | enum `all \| direct_reports` | `all` (admin): toda equipe ativa; `direct_reports` (manager): apenas subordinados diretos |
| `lastTriggeredAt` | timestamp, nullable | Usado para idempotência |
| `createdAt` | timestamp | |
| `updatedAt` | timestamp | |

### Nova tabela: `reminderLog`

Histórico de cada disparo, manual ou automático.

| Coluna | Tipo | Descrição |
|---|---|---|
| `id` | uuid PK | |
| `scheduleId` | FK → reminderSchedule, nullable | `null` se disparo manual sem agendamento |
| `triggeredBy` | enum `manual \| schedule` | Origem do disparo |
| `triggeredById` | FK → user.id, nullable | Quem clicou (manual); `null` se automático |
| `personalNote` | text, nullable | Nota opcional do manager |
| `recipientCount` | integer | Total de destinatários tentados |
| `failedCount` | integer | Total de falhas de entrega |
| `createdAt` | timestamp | |

---

## API Routes

### `POST /api/notifications/reminders`

Disparo manual de lembretes.

**Auth:** session obrigatória; role `admin` ou `manager`.

**Body (Zod):**
```ts
{
  userIds?: string[]   // se omitido, usa scope do actor
  note?: string        // nota opcional do manager
  scope?: 'all' | 'direct_reports'  // padrão: 'direct_reports' para manager, 'all' para admin
}
```

**Response:** `{ sent: number, failed: number, logId: string }`

---

### `GET /api/notifications/schedule`

Retorna a configuração atual. Cria um registro desabilitado se não existir.

**Auth:** session; role `admin` ou `manager`.

**Response:** objeto `reminderSchedule` completo.

---

### `PUT /api/notifications/schedule`

Atualiza a configuração de agendamento.

**Auth:** session; role `admin` ou `manager`.

**Body (Zod):**
```ts
{
  enabled: boolean
  daysOfWeek: number[]   // 0–6
  hour: number           // 0–23
  minute: number         // 0–59
  timezone: string
  condition: 'all' | 'not_submitted'
  targetScope: 'all' | 'direct_reports'
}
```

**Response:** objeto `reminderSchedule` atualizado.

---

### `GET /api/notifications/schedule/logs`

Lista histórico de disparos paginado.

**Auth:** session; role `admin` ou `manager`.

**Query params:** `?limit=20&offset=0`

**Response:** `{ data: reminderLog[], total: number }`

---

### `POST /api/cron/reminders`

Endpoint chamado pelo scheduler externo (GitHub Actions, Azure Scheduler, etc.).

**Auth:** `Authorization: Bearer ${CRON_SECRET}` (sem CRON_SECRET configurado → 503).

**Lógica:**
1. Carrega todos os `reminderSchedule` com `enabled = true`
2. Para cada um, verifica se `daysOfWeek` inclui o dia atual e `hour:minute` bate com o horário atual (tolerância: ±5 minutos)
3. Verifica idempotência: se `lastTriggeredAt` foi há menos de 50 minutos, pula
4. Resolve destinatários via `resolveReminderRecipients()`
5. Dispara e-mails em batch (Resend)
6. Salva `reminderLog`, atualiza `lastTriggeredAt`

**Response:** `{ triggered: number, skipped: number, totalSent: number, totalFailed: number }`

---

## Lógica de Resolução de Destinatários

Função utilitária compartilhada entre envio manual e cron:

```ts
resolveReminderRecipients({
  actorId: string,
  scope: 'all' | 'direct_reports',
  condition: 'all' | 'not_submitted',
  userIds?: string[]
}): Promise<{ id: string, name: string, email: string }[]>
```

**Passos:**
1. Se `userIds` fornecido → usa diretamente (fluxo manual individual)
2. Se `scope = 'direct_reports'` → busca `user` onde `managerId = actorId` e `isActive = true`
3. Se `scope = 'all'` → busca todos os `user` onde `isActive = true`
4. Se `condition = 'not_submitted'` → remove da lista quem tem `timesheet` com `status IN ('submitted', 'approved')` para o período da semana atual (formato `YYYY-Www`)
5. Retorna lista final

---

## Template de E-mail

Função `sendHoursReminderEmail` adicionada em `src/lib/email.ts`.

**Assunto:** `Lembrete: envie suas horas — semana [período]`

**Visual:** mesmo padrão existente — fundo `#0a0a0a`, branding laranja `#f97316`.

**Conteúdo:**
```
Olá, [nome],

[Se condition = not_submitted]
  Identificamos que você ainda não enviou suas horas referentes à semana [período].

[Se condition = all]
  Este é um lembrete para enviar suas horas referentes à semana [período].

[Se personalNote preenchida]
  ┌─────────────────────────────────────────┐
  │ Mensagem de [nome do manager]:          │
  │ "[nota]"                                │
  └─────────────────────────────────────────┘

[Botão CTA] → /dashboard/time

Enviado por [nome do manager/sistema] via OptSolv Time
```

**Envio em batch:** `resend.batch.send()` com chunks de 100, mesmo padrão de `sendReleaseNotesBatch`.

---

## UI — Página de People

Alterações aditivas à página existente de listagem de usuários (`/dashboard/people` ou equivalente).

### Header da página (admin/manager apenas)

Dois botões adicionais na barra de ações:

1. **"Lembrar toda a equipe"** — abre `ReminderBulkModal`:
   - Preview: "X pessoas serão notificadas"
   - Campo textarea: "Nota opcional (aparecerá no e-mail)"
   - Botão confirmar → `POST /api/notifications/reminders`

2. **"Agendamento automático"** — abre `ReminderScheduleDrawer` (Sheet lateral):
   - Toggle habilitado/desabilitado
   - Checkboxes de dias da semana
   - Inputs hora + minuto
   - Select de condição
   - Tabela com os últimos 5 disparos (do `reminderLog`)
   - Botão salvar → `PUT /api/notifications/schedule`

### Por linha de usuário (admin/manager apenas)

Botão de ícone (Bell) ao final da linha. Ao clicar: `ReminderSingleModal`:
- Nome do destinatário pré-preenchido (read-only)
- Campo de nota opcional
- Botão confirmar → `POST /api/notifications/reminders` com `{ userIds: [id], note }`

---

## Tratamento de Erros

| Situação | Comportamento |
|---|---|
| Resend inacessível | Retorna 502; `failedCount = recipientCount`; log salvo |
| Falhas parciais no batch | Retorna 200; `failedCount` registrado no log |
| `CRON_SECRET` ausente | `/api/cron/reminders` retorna 503 |
| Bearer inválido | `/api/cron/reminders` retorna 401 |
| Agendamento já disparado há < 50 min | Pula silenciosamente (idempotência) |
| Nenhum destinatário após filtros | Retorna 200 com `{ sent: 0, failed: 0 }` sem disparar e-mails |

---

## Variáveis de Ambiente

```env
# Adicionada ao .env.example
CRON_SECRET=      # segredo compartilhado entre a app e o scheduler externo
```

---

## Scheduler Externo — Exemplo GitHub Actions

```yaml
# .github/workflows/reminder-cron.yml
name: Hours Reminder Cron

on:
  schedule:
    - cron: '* * * * *'  # todo minuto — a app decide se deve disparar baseado na config
  workflow_dispatch:       # permite disparo manual para testes

jobs:
  trigger:
    runs-on: ubuntu-latest
    steps:
      - name: Trigger reminder cron
        run: |
          curl -f -X POST "${{ secrets.APP_URL }}/api/cron/reminders" \
            -H "Authorization: Bearer ${{ secrets.CRON_SECRET }}"
```

> `APP_URL` e `CRON_SECRET` configurados como secrets do repositório GitHub.

---

## Arquivos a Criar / Modificar

### Novos arquivos
- `src/app/api/notifications/reminders/route.ts`
- `src/app/api/notifications/schedule/route.ts`
- `src/app/api/notifications/schedule/logs/route.ts`
- `src/app/api/cron/reminders/route.ts`
- `src/components/people/ReminderBulkModal.tsx`
- `src/components/people/ReminderSingleModal.tsx`
- `src/components/people/ReminderScheduleDrawer.tsx`
- `src/lib/notifications/resolve-recipients.ts`
- `.github/workflows/reminder-cron.yml`

### Arquivos modificados
- `src/lib/db/schema.ts` — adicionar tabelas `reminderSchedule` e `reminderLog`
- `src/lib/email.ts` — adicionar `sendHoursReminderEmail`
- `src/app/(dashboard)/dashboard/people/page.tsx` (ou equivalente) — adicionar botões e modais
- `.env.example` — adicionar `CRON_SECRET`

---

## Fora do Escopo

- Notificações in-app (bell icon no header)
- E-mails de aprovação/rejeição de timesheet (feature separada)
- Configuração de múltiplos agendamentos simultâneos
- Personalização de template por manager
