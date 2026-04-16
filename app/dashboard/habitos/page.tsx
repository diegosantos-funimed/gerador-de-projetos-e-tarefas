import { createClient } from "@/lib/supabase/server"
import { AddHabitForm } from "@/components/add-habit-form"
import { HabitsContainer } from "@/components/habits-container"

function getTodayDate(): string {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, "0")
  const day = String(now.getDate()).padStart(2, "0")
  return `${year}-${month}-${day}`
}

function calcStreak(sortedDates: string[], today: string): number {
  if (sortedDates.length === 0) return 0

  const set = new Set(sortedDates)
  let streak = 0

  const parse = (d: string) => {
    const [y, m, dd] = d.split("-").map(Number)
    return new Date(y, m - 1, dd)
  }

  const fmt = (d: Date): string =>
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`

  let cursor = parse(today)

  // If today is not done, check from yesterday
  if (!set.has(today)) {
    cursor.setDate(cursor.getDate() - 1)
  }

  while (set.has(fmt(cursor))) {
    streak++
    cursor.setDate(cursor.getDate() - 1)
  }

  return streak
}

export default async function HabitosPage() {
  const supabase = await createClient()
  const today = getTodayDate()

  const { data: habits } = await supabase
    .from("habits")
    .select("id, name, description, color")
    .order("created_at", { ascending: true })

  if (!habits || habits.length === 0) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Hábitos</h1>
            <p className="text-muted-foreground text-sm mt-1">
              Rastreie seus hábitos diários e mantenha seu streak.
            </p>
          </div>
          <AddHabitForm />
        </div>
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <p className="text-muted-foreground text-lg">Nenhum hábito criado ainda.</p>
          <p className="text-muted-foreground text-sm mt-1">
            Clique em "Novo hábito" para começar a rastrear.
          </p>
        </div>
      </div>
    )
  }

  const habitIds = habits.map((h) => h.id)

  // Fetch logs from last 365 days
  const since = new Date()
  since.setDate(since.getDate() - 364)
  const sinceStr = `${since.getFullYear()}-${String(since.getMonth() + 1).padStart(2, "0")}-${String(since.getDate()).padStart(2, "0")}`

  const { data: logs } = await supabase
    .from("habit_logs")
    .select("habit_id, date")
    .in("habit_id", habitIds)
    .gte("date", sinceStr)
    .order("date", { ascending: true })

  // Group logs by habit_id
  const allLogs: Record<string, string[]> = {}
  const todayLogs: Record<string, boolean> = {}
  const streaks: Record<string, number> = {}

  for (const habit of habits) {
    allLogs[habit.id] = []
    todayLogs[habit.id] = false
  }

  for (const log of logs ?? []) {
    allLogs[log.habit_id] = [...(allLogs[log.habit_id] ?? []), log.date]
    if (log.date === today) {
      todayLogs[log.habit_id] = true
    }
  }

  for (const habit of habits) {
    streaks[habit.id] = calcStreak(allLogs[habit.id], today)
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-5xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Hábitos</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Rastreie seus hábitos diários e mantenha seu streak.
          </p>
        </div>
        <AddHabitForm />
      </div>

      <HabitsContainer
        habits={habits}
        todayLogs={todayLogs}
        streaks={streaks}
        allLogs={allLogs}
        today={today}
      />
    </div>
  )
}
