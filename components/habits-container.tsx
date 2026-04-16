"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { toast } from "sonner"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { HabitHeatmap } from "@/components/habit-heatmap"
import { CheckCircle2, Circle, Flame, Trash2 } from "lucide-react"

interface Habit {
  id: string
  name: string
  description: string | null
  color: string
}

interface HabitsContainerProps {
  habits: Habit[]
  todayLogs: Record<string, boolean> // habit_id -> completed today
  streaks: Record<string, number> // habit_id -> streak count
  allLogs: Record<string, string[]> // habit_id -> array of date strings
  today: string // yyyy-mm-dd
}

export function HabitsContainer({
  habits,
  todayLogs,
  streaks,
  allLogs,
  today,
}: HabitsContainerProps) {
  const router = useRouter()
  const [loadingId, setLoadingId] = useState<string | null>(null)
  const [localLogs, setLocalLogs] = useState<Record<string, boolean>>(todayLogs)

  const completedToday = Object.values(localLogs).filter(Boolean).length
  const totalHabits = habits.length

  async function toggleHabit(habitId: string) {
    setLoadingId(habitId)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const done = localLogs[habitId]

    try {
      if (done) {
        // Remove log
        const { error } = await supabase
          .from("habit_logs")
          .delete()
          .eq("habit_id", habitId)
          .eq("date", today)
          .eq("user_id", user.id)
        if (error) throw error
        setLocalLogs((prev) => ({ ...prev, [habitId]: false }))
      } else {
        // Insert log
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

  async function deleteHabit(habitId: string) {
    const supabase = createClient()
    const { error } = await supabase.from("habits").delete().eq("id", habitId)
    if (error) {
      toast.error("Erro ao excluir hábito")
      return
    }
    toast.success("Hábito excluído")
    router.refresh()
  }

  if (habits.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <p className="text-muted-foreground text-lg">Nenhum hábito criado ainda.</p>
        <p className="text-muted-foreground text-sm mt-1">
          Clique em "Novo hábito" para começar a rastrear.
        </p>
      </div>
    )
  }

  return (
    <Tabs defaultValue="hoje">
      <TabsList>
        <TabsTrigger value="hoje">Hoje</TabsTrigger>
        <TabsTrigger value="historico">Histórico</TabsTrigger>
      </TabsList>

      {/* Hoje */}
      <TabsContent value="hoje" className="mt-4">
        <div className="mb-4 flex items-center gap-2">
          <span className="text-sm text-muted-foreground">
            {completedToday} de {totalHabits} concluídos hoje
          </span>
          {completedToday === totalHabits && totalHabits > 0 && (
            <Badge variant="secondary" className="text-xs">
              Dia perfeito! 🎉
            </Badge>
          )}
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {habits.map((habit) => {
            const done = localLogs[habit.id] ?? false
            const streak = streaks[habit.id] ?? 0

            return (
              <Card
                key={habit.id}
                className={`transition-all ${done ? "opacity-90" : ""}`}
                style={{ borderLeftColor: habit.color, borderLeftWidth: 4 }}
              >
                <CardContent className="pt-4 pb-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <p
                        className={`font-medium truncate ${done ? "line-through text-muted-foreground" : ""}`}
                      >
                        {habit.name}
                      </p>
                      {habit.description && (
                        <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                          {habit.description}
                        </p>
                      )}
                      {streak > 0 && (
                        <div className="flex items-center gap-1 mt-2 text-xs text-orange-500 font-medium">
                          <Flame className="w-3.5 h-3.5" />
                          {streak} {streak === 1 ? "dia" : "dias"} seguidos
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-muted-foreground hover:text-destructive"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Excluir hábito?</AlertDialogTitle>
                            <AlertDialogDescription>
                              Isso removerá o hábito e todo seu histórico. Ação irreversível.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => deleteHabit(habit.id)}
                              className="bg-destructive text-white hover:bg-destructive/90"
                            >
                              Excluir
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>

                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        disabled={loadingId === habit.id}
                        onClick={() => toggleHabit(habit.id)}
                      >
                        {done ? (
                          <CheckCircle2
                            className="w-6 h-6"
                            style={{ color: habit.color }}
                          />
                        ) : (
                          <Circle className="w-6 h-6 text-muted-foreground" />
                        )}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      </TabsContent>

      {/* Histórico (heatmap) */}
      <TabsContent value="historico" className="mt-4">
        <div className="grid gap-6">
          {habits.map((habit) => {
            const logs = allLogs[habit.id] ?? []
            const streak = streaks[habit.id] ?? 0
            const totalDone = logs.length

            return (
              <Card key={habit.id}>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base flex items-center gap-2">
                      <span
                        className="w-3 h-3 rounded-full shrink-0"
                        style={{ backgroundColor: habit.color }}
                      />
                      {habit.name}
                    </CardTitle>
                    <div className="flex items-center gap-3 text-sm text-muted-foreground">
                      {streak > 0 && (
                        <span className="flex items-center gap-1 text-orange-500 font-medium">
                          <Flame className="w-3.5 h-3.5" />
                          {streak}d
                        </span>
                      )}
                      <span>{totalDone} {totalDone === 1 ? "dia" : "dias"} no total</span>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <HabitHeatmap logs={logs} color={habit.color} />
                </CardContent>
              </Card>
            )
          })}
        </div>
      </TabsContent>
    </Tabs>
  )
}
