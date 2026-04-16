import Link from "next/link"
import { createClient } from "@/lib/supabase/server"
import { DashboardHabitsWidget } from "@/components/dashboard-habits-widget"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  CheckSquare,
  FolderKanban,
  TrendingUp,
  TrendingDown,
  Wallet,
  ArrowRight,
  Circle,
} from "lucide-react"

// ─── Helpers ────────────────────────────────────────────────────────────────

function getTodayString(): string {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`
}

function getGreeting(): string {
  const h = new Date().getHours()
  if (h < 12) return "Bom dia"
  if (h < 18) return "Boa tarde"
  return "Boa noite"
}

function formatCurrency(value: number): string {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })
}

function calcStreak(dates: string[], today: string): number {
  if (dates.length === 0) return 0
  const set = new Set(dates)
  const parse = (d: string) => {
    const [y, m, dd] = d.split("-").map(Number)
    return new Date(y, m - 1, dd)
  }
  const fmt = (d: Date) =>
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`
  let cursor = parse(today)
  if (!set.has(today)) cursor.setDate(cursor.getDate() - 1)
  let streak = 0
  while (set.has(fmt(cursor))) {
    streak++
    cursor.setDate(cursor.getDate() - 1)
  }
  return streak
}

// ─── Page ────────────────────────────────────────────────────────────────────

export default async function DashboardPage() {
  const supabase = await createClient()
  const today = getTodayString()
  const now = new Date()
  const year = now.getFullYear()
  const month = now.getMonth() + 1
  const monthStart = `${year}-${String(month).padStart(2, "0")}-01`
  const monthEnd = new Date(year, month, 0).toISOString().split("T")[0]

  const [
    { data: projects },
    { data: allTasks },
    { data: transactions },
    { data: habits },
    { data: habitLogs },
  ] = await Promise.all([
    supabase.from("projects").select("id, name").order("created_at", { ascending: false }),
    supabase
      .from("tasks")
      .select("id, title, completed, project_id, projects(name)")
      .order("created_at", { ascending: false }),
    supabase
      .from("transactions")
      .select("type, amount, description, category, date")
      .gte("date", monthStart)
      .lte("date", monthEnd)
      .order("date", { ascending: false }),
    supabase.from("habits").select("id, name, color").order("created_at", { ascending: true }),
    supabase
      .from("habit_logs")
      .select("habit_id, date")
      .gte("date", (() => {
        const d = new Date()
        d.setDate(d.getDate() - 364)
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`
      })()),
  ])

  // Projetos & Tarefas
  const projectList = projects ?? []
  const taskList = allTasks ?? []
  const pendingTasks = taskList.filter((t) => !t.completed)
  const completedTasks = taskList.filter((t) => t.completed)

  // Finanças
  const txList = transactions ?? []
  const totalIncome = txList
    .filter((t) => t.type === "income")
    .reduce((acc, t) => acc + Number(t.amount), 0)
  const totalExpenses = txList
    .filter((t) => t.type === "expense")
    .reduce((acc, t) => acc + Number(t.amount), 0)
  const balance = totalIncome - totalExpenses
  const recentTx = txList.slice(0, 4)

  // Hábitos
  const habitList = habits ?? []
  const logsByHabit: Record<string, string[]> = {}
  const todayLogs: Record<string, boolean> = {}
  const streaks: Record<string, number> = {}

  for (const h of habitList) {
    logsByHabit[h.id] = []
    todayLogs[h.id] = false
  }
  for (const log of habitLogs ?? []) {
    logsByHabit[log.habit_id] = [...(logsByHabit[log.habit_id] ?? []), log.date]
    if (log.date === today) todayLogs[log.habit_id] = true
  }
  for (const h of habitList) {
    streaks[h.id] = calcStreak(logsByHabit[h.id], today)
  }
  const habitsToday = Object.values(todayLogs).filter(Boolean).length

  const dateLabel = now.toLocaleDateString("pt-BR", {
    weekday: "long",
    day: "numeric",
    month: "long",
  })

  return (
    <div className="space-y-8">

      {/* Greeting */}
      <div>
        <h1 className="text-2xl font-bold capitalize">{getGreeting()}!</h1>
        <p className="text-muted-foreground text-sm capitalize mt-0.5">{dateLabel}</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Card>
          <CardContent className="pt-5 pb-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">
                  Projetos
                </p>
                <p className="text-3xl font-bold mt-1">{projectList.length}</p>
              </div>
              <FolderKanban className="w-5 h-5 text-muted-foreground mt-1" />
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              {completedTasks.length}/{taskList.length} tarefas concluídas
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-5 pb-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">
                  Pendentes
                </p>
                <p className="text-3xl font-bold mt-1">{pendingTasks.length}</p>
              </div>
              <CheckSquare className="w-5 h-5 text-muted-foreground mt-1" />
            </div>
            <p className="text-xs text-muted-foreground mt-2">tarefas em aberto</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-5 pb-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">
                  Saldo do mês
                </p>
                <p
                  className={`text-2xl font-bold mt-1 ${
                    balance >= 0 ? "text-green-500" : "text-red-500"
                  }`}
                >
                  {formatCurrency(balance)}
                </p>
              </div>
              <Wallet className="w-5 h-5 text-muted-foreground mt-1" />
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              {now.toLocaleString("pt-BR", { month: "long", year: "numeric" })}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-5 pb-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">
                  Hábitos hoje
                </p>
                <p className="text-3xl font-bold mt-1">
                  {habitsToday}
                  <span className="text-lg text-muted-foreground font-normal">
                    /{habitList.length}
                  </span>
                </p>
              </div>
              <CheckSquare className="w-5 h-5 text-muted-foreground mt-1" />
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              {habitList.length === 0
                ? "nenhum hábito cadastrado"
                : habitsToday === habitList.length
                ? "dia perfeito! 🎉"
                : `${habitList.length - habitsToday} restante(s)`}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Middle row */}
      <div className="grid gap-6 lg:grid-cols-2">

        {/* Hábitos do dia */}
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Hábitos do dia</CardTitle>
              <Link
                href="/dashboard/habitos"
                className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors"
              >
                Ver todos <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            <DashboardHabitsWidget
              habits={habitList}
              todayLogs={todayLogs}
              streaks={streaks}
              today={today}
            />
          </CardContent>
        </Card>

        {/* Finanças do mês */}
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Finanças do mês</CardTitle>
              <Link
                href="/dashboard/financas"
                className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors"
              >
                Ver detalhes <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="flex items-center gap-2 p-3 rounded-lg bg-green-500/10">
                <TrendingUp className="w-4 h-4 text-green-500 shrink-0" />
                <div>
                  <p className="text-xs text-muted-foreground">Receitas</p>
                  <p className="text-sm font-semibold text-green-500">
                    {formatCurrency(totalIncome)}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 p-3 rounded-lg bg-red-500/10">
                <TrendingDown className="w-4 h-4 text-red-500 shrink-0" />
                <div>
                  <p className="text-xs text-muted-foreground">Despesas</p>
                  <p className="text-sm font-semibold text-red-500">
                    {formatCurrency(totalExpenses)}
                  </p>
                </div>
              </div>
            </div>

            {recentTx.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-2">
                Nenhuma transação este mês.
              </p>
            ) : (
              <div className="space-y-2">
                {recentTx.map((tx, i) => (
                  <div key={i} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2 min-w-0">
                      <span
                        className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                          tx.type === "income" ? "bg-green-500" : "bg-red-500"
                        }`}
                      />
                      <span className="truncate text-muted-foreground">
                        {tx.description ?? tx.category}
                      </span>
                    </div>
                    <span
                      className={`font-medium shrink-0 ml-2 ${
                        tx.type === "income" ? "text-green-500" : "text-red-500"
                      }`}
                    >
                      {tx.type === "income" ? "+" : "-"}
                      {formatCurrency(Number(tx.amount))}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Tarefas pendentes */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Tarefas pendentes</CardTitle>
            <Link
              href="/dashboard/projetos"
              className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors"
            >
              Ver projetos <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          {pendingTasks.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              Nenhuma tarefa pendente. 🎉
            </p>
          ) : (
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {pendingTasks.slice(0, 9).map((task) => {
                // @ts-expect-error Supabase join type
                const projectName = task.projects?.name ?? "Projeto"
                return (
                  <div
                    key={task.id}
                    className="flex items-start gap-2 p-3 rounded-lg border bg-card hover:bg-secondary/40 transition-colors"
                  >
                    <Circle className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
                    <div className="min-w-0">
                      <p className="text-sm truncate">{task.title}</p>
                      <Badge variant="secondary" className="text-xs mt-1 font-normal">
                        {projectName}
                      </Badge>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
          {pendingTasks.length > 9 && (
            <p className="text-xs text-muted-foreground mt-3 text-center">
              +{pendingTasks.length - 9} tarefas adicionais
            </p>
          )}
        </CardContent>
      </Card>

    </div>
  )
}
