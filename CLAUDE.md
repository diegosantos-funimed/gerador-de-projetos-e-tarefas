# CLAUDE.md — Sistema de Gerenciamento Pessoal

Este arquivo orienta o Claude Code a entender o projeto, suas decisões técnicas e o roadmap planejado.

---

## Visão geral do projeto

Sistema de gerenciamento pessoal completo, desenvolvido em Next.js. O objetivo é centralizar produtividade, finanças, saúde, hábitos e conhecimento pessoal em uma única plataforma.

**Repositório:** https://github.com/diegosantos-funimed/gerador-de-projetos-e-tarefas  
**Deploy:** https://v0-gerador-de-projetos-e-tarefas.vercel.app

---

## Stack técnica

- **Framework:** Next.js 16 (App Router)
- **Linguagem:** TypeScript
- **UI:** React 19 + shadcn/ui + Radix UI + Tailwind CSS v4
- **Banco de dados:** PostgreSQL via Supabase
- **Auth:** Supabase Auth com middleware SSR (`@supabase/ssr`)
- **Forms:** React Hook Form + Zod
- **Gráficos:** Recharts
- **Notificações:** Sonner
- **Gerenciador de pacotes:** pnpm

---

## Estrutura de pastas

```
/
├── app/              # Rotas e páginas (App Router do Next.js)
├── components/       # Componentes reutilizáveis
├── hooks/            # Custom hooks
├── lib/              # Utilitários, cliente Supabase, helpers
│   └── supabase/     # Configuração do Supabase (client, server, middleware)
├── public/           # Assets estáticos
├── scripts/          # Scripts utilitários (ex: seeds, migrações)
├── styles/           # CSS global
├── middleware.ts     # Middleware de autenticação Supabase
```

---

## Autenticação

A autenticação é gerenciada pelo Supabase Auth com SSR. O `middleware.ts` intercepta todas as rotas (exceto assets estáticos) e atualiza a sessão do usuário via `updateSession`. Ao criar novas rotas protegidas, não é necessário adicionar lógica extra — o middleware já cobre tudo.

Para acessar o usuário autenticado:
- No **servidor** (Server Components, API routes): usar `createServerClient` de `@/lib/supabase/server`
- No **cliente** (Client Components): usar `createBrowserClient` de `@/lib/supabase/client`

---

## Módulos implementados

### ✅ Tarefas e Projetos
- Criação e gerenciamento de projetos
- Tarefas dentro de projetos
- Visualização em **lista** e **kanban**

### ✅ Finanças
- Registro de receitas e despesas com categoria, valor e data
- Cards de resumo: total de receitas, despesas e saldo do mês
- Filtro por mês/ano com navegação
- Gráfico de barras dos últimos 6 meses (Recharts)
- Listagem com exclusão de transações
- Banco de dados: tabela `transactions` no PostgreSQL via Supabase com RLS

---

## Roadmap de módulos futuros

A ordem abaixo reflete a prioridade de desenvolvimento combinada em conversa:

| Prioridade | Módulo | Descrição |
|---|---|---|
| 1 | **Hábitos** | Rastreador diário com streak, categorias e calendário de calor |
| 2 | **Dashboard Central** | Visão geral do dia: tarefas, hábitos, gastos, meta da semana |
| 3 | **Notas e Conhecimento** | Diário pessoal, resumos de leituras, wiki pessoal |
| 4 | **Objetivos de Vida** | Metas anuais/trimestrais, OKRs, revisões semanais |
| 5 | **CRM Pessoal** | Contatos importantes, aniversários, histórico de interações |
| 6 | **Agenda e Tempo** | Calendário, blocos de foco, Pomodoro |

### Módulos extras considerados
- **Saúde e Bem-estar:** sono, exercícios, humor, hidratação

---

## Convenções de código

- Componentes sempre em **PascalCase** dentro de `/components`
- Nomes de arquivos em **kebab-case** (ex: `task-card.tsx`)
- Server Components por padrão; usar `"use client"` apenas quando necessário (interatividade, hooks de estado)
- Validações de formulário sempre com **Zod** + **React Hook Form**
- Chamadas ao Supabase no servidor sempre que possível (evitar expor lógica no cliente)
- Feedback ao usuário via **Sonner** (`toast.success`, `toast.error`)
- Ícones via **lucide-react**

---

## Banco de dados (Supabase / PostgreSQL)

- Cada módulo tem suas próprias tabelas
- Sempre usar **Row Level Security (RLS)** para garantir que cada usuário acesse apenas seus dados
- Padrão de tabelas: incluir `id uuid`, `user_id uuid references auth.users`, `created_at`, `updated_at`
- Scripts de migração ficam em `/scripts`

---

## Padrões de UI

O projeto usa **shadcn/ui** como base. Ao criar novos componentes:

- Aproveitar os componentes já instalados (Dialog, Select, Tabs, Card, etc.)
- Manter consistência visual com o restante do sistema
- Preferir `Tabs` para alternar entre visualizações (ex: lista/kanban)
- Usar `Sheet` ou `Dialog` para formulários de criação/edição

---

## Comandos úteis

```bash
pnpm dev          # Servidor de desenvolvimento
pnpm build        # Build de produção
pnpm lint         # Lint do código
```

---

## Contexto adicional

- O projeto foi iniciado com **v0.dev** e continua sendo desenvolvido manualmente
- Deploy automático na Vercel a cada merge na branch `main`
- Ao adicionar novos módulos, seguir o padrão de rotas do App Router: `app/[modulo]/page.tsx`
