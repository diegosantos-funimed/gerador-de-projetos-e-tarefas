import { createClient } from "@/lib/supabase/server"
import { GoalsContainer } from "@/components/goals-container"
import { AddGoalForm } from "@/components/add-goal-form"

export default async function ObjetivosPage() {
  const supabase = await createClient()
  const currentYear = new Date().getFullYear()

  const { data: goals } = await supabase
    .from("goals")
    .select(`
      id, title, description, period, year, quarter,
      status, progress, color,
      key_results (
        id, title, current_value, target_value, unit
      )
    `)
    .order("year", { ascending: false })
    .order("created_at", { ascending: false })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Objetivos de Vida</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Metas anuais, trimestrais e OKRs pessoais.
          </p>
        </div>
        <AddGoalForm />
      </div>

      <GoalsContainer
        goals={(goals ?? []) as Parameters<typeof GoalsContainer>[0]["goals"]}
        currentYear={currentYear}
      />
    </div>
  )
}
