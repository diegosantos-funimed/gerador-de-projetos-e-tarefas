"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { toast } from "sonner"
import { CheckCircle2, Circle, Flame } from "lucide-react"
import { Button } from "@/components/ui/button"

interface Habit {
  id: string
  name: string
  color: string
}

interface DashboardHabitsWidgetProps {
  habits: Habit[]
  todayLogs: Record<string, boolean>
  streaks: Record<string, number>
  today: string
}

export function DashboardHabitsWidget({
  habits,
  todayLogs,
  streaks,
  today,
}: DashboardHabitsWidgetProps) {
  const router = useRouter()
  const [loadingId, setLoadingId] = useState<string | null>(null)
  const [localLogs, setLocalLogs] = useState<Record<string, boolean>>(todayLogs)

  const completed = Object.values(localLogs).filter(Boolean).length
  const total = habits.length

  async function toggle(habitId: string) {
    setLoadingId(habitId)
    const supabase = createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return

    const done = localLogs[habitId]
    try {
      if (done) {
        const { error } = await supabase
          .from("habit_logs")
          .delete()
          .eq("habit_id", habitId)
          .eq("date", today)
          .eq("user_id", user.id)
        if (error) throw error
        setLocalLogs((prev) => ({ ...prev, [habitId]: false }))
      } else {
        const { error } = await supabase.from("habit_logs").insert({
          habit_id: habitId,
          user_id: user.id,
          date: today,
        })
        if (error) throw error
        setLocalLogs((prev) => ({ ...prev, [habitId]: true }))
      }
      router.refresh()
    } catch {
      toast.error("Erro ao atualizar hábito")
    } finally {
      setLoadingId(null)
    }
  }

  if (habits.length === 0) {
    return (
      <p className="text-sm text-muted-foreground py-4 text-center">
        Nenhum hábito cadastrado.
      </p>
    )
  }

  return (
    <div className="space-y-1">
      {/* Progress bar */}
      <div className="flex items-center justify-between text-xs text-muted-foreground mb-3">
        <span>
          {completed} de {total} concluídos
        </span>
        {completed === total && total > 0 && (
          <span className="text-green-500 font-medium">Dia perfeito! 🎉</span>
        )}
      </div>
      <div className="w-full h-1.5 bg-secondary rounded-full mb-4">
        <div
          className="h-1.5 rounded-full transition-all duration-300"
          style={{
            width: total > 0 ? `${(completed / total) * 100}%` : "0%",
            backgroundColor: completed === total && total > 0 ? "#22c55e" : "#6366f1",
          }}
        />
      </div>

      {habits.map((habit) => {
        const done = localLogs[habit.id] ?? false
        const streak = streaks[habit.id] ?? 0
        return (
          <div
            key={habit.id}
            className="flex items-center gap-2 py-1.5 px-2 rounded-md hover:bg-secondary/50 transition-colors group"
          >
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 shrink-0 p-0"
              disabled={loadingId === habit.id}
              onClick={() => toggle(habit.id)}
            >
              {done ? (
                <CheckCircle2 className="w-5 h-5" style={{ color: habit.color }} />
              ) : (
                <Circle className="w-5 h-5 text-muted-foreground" />
              )}
            </Button>
            <span
              className={`flex-1 text-sm truncate ${
                done ? "line-through text-muted-foreground" : ""
              }`}
            >
              {habit.name}
            </span>
            {streak > 0 && (
              <span className="flex items-center gap-0.5 text-xs text-orange-500 font-medium shrink-0">
                <Flame className="w-3 h-3" />
                {streak}
              </span>
            )}
          </div>
        )
      })}
    </div>
  )
}
