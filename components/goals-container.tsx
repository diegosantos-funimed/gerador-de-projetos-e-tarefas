"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { toast } from "sonner"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Input } from "@/components/ui/input"
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
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { AddGoalForm } from "@/components/add-goal-form"
import { CheckCircle2, Pencil, Trash2, TrendingUp } from "lucide-react"

interface KeyResult {
  id: string
  title: string
  current_value: number
  target_value: number
  unit: string | null
}

interface Goal {
  id: string
  title: string
  description: string | null
  period: "annual" | "quarterly" | "weekly"
  year: number
  quarter: number | null
  status: "active" | "completed" | "archived"
  progress: number
  color: string
  key_results: KeyResult[]
}

interface GoalsContainerProps {
  goals: Goal[]
  currentYear: number
}

const PERIOD_LABELS: Record<string, string> = {
  annual: "Anual",
  quarterly: "Trimestral",
  weekly: "Semanal",
}

const QUARTER_LABELS: Record<number, string> = {
  1: "Q1",
  2: "Q2",
  3: "Q3",
  4: "Q4",
}

function KrProgress({
  kr,
  goalId,
}: {
  kr: KeyResult
  goalId: string
}) {
  const router = useRouter()
  const [value, setValue] = useState(kr.current_value.toString())
  const [open, setOpen] = useState(false)
  const pct = kr.target_value > 0 ? Math.min(100, Math.round((kr.current_value / kr.target_value) * 100)) : 0

  async function save() {
    const num = parseFloat(value)
    if (isNaN(num)) return
    const supabase = createClient()
    const { error } = await supabase
      .from("key_results")
      .update({ current_value: num, updated_at: new Date().toISOString() })
      .eq("id", kr.id)
    if (error) {
      toast.error("Erro ao atualizar")
      return
    }

    // Recalcular progresso do goal com base nos KRs
    const { data: allKrs } = await supabase
      .from("key_results")
      .select("current_value, target_value")
      .eq("goal_id", goalId)

    if (allKrs && allKrs.length > 0) {
      const avg = allKrs.reduce((acc, k) => {
        const p = k.target_value > 0 ? Math.min(100, (k.current_value / k.target_value) * 100) : 0
        return acc + p
      }, 0) / allKrs.length
      await supabase.from("goals").update({ progress: Math.round(avg) }).eq("id", goalId)
    }

    toast.success("KR atualizado!")
    setOpen(false)
    router.refresh()
  }

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-xs">
        <span className="text-muted-foreground truncate flex-1 mr-2">{kr.title}</span>
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <button className="text-xs font-medium hover:underline shrink-0">
              {kr.current_value}/{kr.target_value}
              {kr.unit ? ` ${kr.unit}` : ""}
            </button>
          </PopoverTrigger>
          <PopoverContent className="w-52 p-3" align="end">
            <p className="text-xs font-medium mb-2">Atualizar progresso</p>
            <div className="flex gap-2">
              <Input
                type="number"
                value={value}
                onChange={(e) => setValue(e.target.value)}
                className="h-8 text-sm"
                onKeyDown={(e) => e.key === "Enter" && save()}
              />
              <Button size="sm" className="h-8" onClick={save}>OK</Button>
            </div>
          </PopoverContent>
        </Popover>
      </div>
      <Progress value={pct} className="h-1.5" />
    </div>
  )
}

function GoalCard({ goal }: { goal: Goal }) {
  const router = useRouter()

  async function deleteGoal() {
    const supabase = createClient()
    const { error } = await supabase.from("goals").delete().eq("id", goal.id)
    if (error) { toast.error("Erro ao excluir"); return }
    toast.success("Objetivo excluído")
    router.refresh()
  }

  async function toggleComplete() {
    const supabase = createClient()
    const newStatus = goal.status === "completed" ? "active" : "completed"
    const { error } = await supabase.from("goals").update({ status: newStatus }).eq("id", goal.id)
    if (error) { toast.error("Erro"); return }
    router.refresh()
  }

  const isCompleted = goal.status === "completed"

  return (
    <Card className={`flex flex-col transition-opacity ${isCompleted ? "opacity-70" : ""}`}
      style={{ borderLeftColor: goal.color, borderLeftWidth: 4 }}>
      <CardHeader className="pb-2 pt-4">
        <div className="flex items-start gap-2 justify-between">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <Badge variant="secondary" className="text-xs font-normal">
                {PERIOD_LABELS[goal.period]}
                {goal.period === "quarterly" && goal.quarter ? ` · ${QUARTER_LABELS[goal.quarter]}` : ""}
                {" · "}{goal.year}
              </Badge>
              {isCompleted && (
                <Badge className="text-xs bg-green-500/10 text-green-500 border-0">Concluído</Badge>
              )}
            </div>
            <CardTitle className={`text-base leading-snug ${isCompleted ? "line-through text-muted-foreground" : ""}`}>
              {goal.title}
            </CardTitle>
            {goal.description && (
              <p className="text-xs text-muted-foreground mt-1">{goal.description}</p>
            )}
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <Button
              variant="ghost"
              size="icon"
              className={`h-7 w-7 ${isCompleted ? "text-green-500" : "text-muted-foreground"} hover:text-green-500`}
              onClick={toggleComplete}
            >
              <CheckCircle2 className="w-4 h-4" />
            </Button>
            <AddGoalForm
              editGoal={goal}
              trigger={
                <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-foreground">
                  <Pencil className="w-3.5 h-3.5" />
                </Button>
              }
            />
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive">
                  <Trash2 className="w-3.5 h-3.5" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Excluir objetivo?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Todos os key results serão removidos. Ação irreversível.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                  <AlertDialogAction onClick={deleteGoal} className="bg-destructive text-white hover:bg-destructive/90">
                    Excluir
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pb-4 flex-1 space-y-3">
        {/* Progresso geral */}
        <div className="space-y-1">
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">Progresso geral</span>
            <span className="font-medium">{goal.progress}%</span>
          </div>
          <Progress value={goal.progress} className="h-2" style={{ "--progress-color": goal.color } as React.CSSProperties} />
        </div>

        {/* Key Results */}
        {goal.key_results.length > 0 && (
          <div className="space-y-2 pt-1 border-t">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Key Results</p>
            {goal.key_results.map((kr) => (
              <KrProgress key={kr.id} kr={kr} goalId={goal.id} />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <TrendingUp className="w-10 h-10 text-muted-foreground mb-3" />
      <p className="text-muted-foreground">Nenhum objetivo definido ainda.</p>
      <p className="text-xs text-muted-foreground mt-1">Crie seu primeiro objetivo acima.</p>
    </div>
  )
}

export function GoalsContainer({ goals, currentYear }: GoalsContainerProps) {
  const [year, setYear] = useState(currentYear)

  const filtered = goals.filter((g) => g.year === year)
  const annual = filtered.filter((g) => g.period === "annual")
  const quarterly = filtered.filter((g) => g.period === "quarterly")
  const weekly = filtered.filter((g) => g.period === "weekly")

  const active = filtered.filter((g) => g.status !== "archived")
  const avgProgress = active.length > 0
    ? Math.round(active.reduce((a, g) => a + g.progress, 0) / active.length)
    : 0

  return (
    <div className="space-y-6">
      {/* Filtro de ano + resumo */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => setYear((y) => y - 1)}>‹</Button>
          <span className="text-lg font-semibold w-14 text-center">{year}</span>
          <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => setYear((y) => y + 1)}>›</Button>
        </div>
        {active.length > 0 && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span>{active.length} {active.length === 1 ? "objetivo" : "objetivos"} ativos</span>
            <span>·</span>
            <span>{avgProgress}% de progresso médio</span>
          </div>
        )}
      </div>

      <Tabs defaultValue="annual">
        <TabsList>
          <TabsTrigger value="annual">Anuais <Badge variant="secondary" className="ml-1.5 text-xs">{annual.length}</Badge></TabsTrigger>
          <TabsTrigger value="quarterly">Trimestrais <Badge variant="secondary" className="ml-1.5 text-xs">{quarterly.length}</Badge></TabsTrigger>
          <TabsTrigger value="weekly">Semanais <Badge variant="secondary" className="ml-1.5 text-xs">{weekly.length}</Badge></TabsTrigger>
        </TabsList>

        {(["annual", "quarterly", "weekly"] as const).map((period) => {
          const list = period === "annual" ? annual : period === "quarterly" ? quarterly : weekly
          return (
            <TabsContent key={period} value={period} className="mt-4">
              {list.length === 0 ? (
                <EmptyState />
              ) : (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {list.map((goal) => <GoalCard key={goal.id} goal={goal} />)}
                </div>
              )}
            </TabsContent>
          )
        })}
      </Tabs>
    </div>
  )
}
