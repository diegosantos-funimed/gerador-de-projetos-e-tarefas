# CLAUDE.md — Prumo

Este arquivo orienta o Claude Code a entender o projeto, suas decisões técnicas e o roadmap planejado.

---

## Visão geral do projeto

**Prumo** — sistema de gestão pessoal completo, desenvolvido em Next.js. O objetivo é centralizar produtividade, finanças, saúde, hábitos e conhecimento pessoal em uma única plataforma. Disponível como PWA (instalável em mobile e desktop).

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

### ✅ Tarefas e Projetos — `/dashboard/projetos`
- Criação e gerenciamento de projetos
- Tarefas dentro de projetos
- Visualização em **lista** e **kanban**

### ✅ Finanças — `/dashboard/financas`
- Registro de receitas e despesas com categoria, valor e data
- Cards de resumo: total de receitas, despesas e saldo do mês
- Filtro por mês/ano com navegação
- Gráfico de barras dos últimos 6 meses (Recharts)
- Listagem com exclusão de transações

### ✅ Hábitos — `/dashboard/habitos`
- Rastreador diário com check/uncheck por hábito
- Streak de dias consecutivos
- Calendário de calor (heatmap) dos últimos 365 dias

### ✅ Dashboard Central — `/dashboard`
- Saudação com data
- Cards de resumo: projetos, tarefas pendentes, saldo do mês, hábitos do dia
- Widget de hábitos interativo
- Mini-resumo de finanças com transações recentes
- Grid de tarefas pendentes com projeto de origem

### ✅ Notas e Conhecimento — `/dashboard/notas`
- Diário pessoal com entradas por data
- Resumos de leituras com autor e avaliação em estrelas
- Wiki pessoal com busca em tempo real

### ✅ Objetivos de Vida — `/dashboard/objetivos`
- Metas anuais, trimestrais e semanais
- Key Results com progresso numérico (OKRs)
- Progresso automático calculado pela média dos KRs
- Filtro por ano com navegação

---

## Roadmap de módulos futuros

| Prioridade | Módulo | Descrição |
|---|---|---|
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

### Padrão de layout de página (OBRIGATÓRIO)

O `app/dashboard/layout.tsx` já aplica `container mx-auto px-6 py-8 md:px-10 lg:px-16 max-w-7xl` ao `<main>`. **Nunca repetir** `container`, `px-*` ou `py-*` no root de uma página filha — isso dobra o padding.

Padrão correto para o root de toda página dentro de `/dashboard`:

```tsx
// ✅ Correto
return (
  <div className="space-y-6">
    <div className="flex items-center justify-between">
      <div>
        <h1 className="text-2xl font-bold">Título</h1>
        <p className="text-muted-foreground text-sm mt-1">Subtítulo</p>
      </div>
      <BotaoDeAção />
    </div>
    {/* conteúdo */}
  </div>
)

// ❌ Errado — duplica o container do layout
return (
  <div className="container mx-auto px-4 py-8">
    ...
  </div>
)
```

### Regra ao criar novo módulo (OBRIGATÓRIO)

Ao implementar qualquer novo módulo, **sempre** atualizar o Dashboard Central (`app/dashboard/page.tsx`) com um widget ou card de resumo do módulo. O dashboard deve refletir todos os módulos existentes.

Checklist ao criar um módulo novo:
1. Criar rota em `app/dashboard/[modulo]/page.tsx`
2. Criar script de migração em `scripts/0XX_create_[modulo].sql`
3. Adicionar item na nav em `components/dashboard-header.tsx`
4. **Adicionar card/widget no `app/dashboard/page.tsx`**
5. Atualizar a seção "Módulos implementados" neste CLAUDE.md

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
- Ao adicionar novos módulos, seguir o padrão de rotas do App Router: `app/dashboard/[modulo]/page.tsx`
