import { createClient } from "@/lib/supabase/server"
import { ProjectsList } from "@/components/projects-list"
import { CreateProjectDialog } from "@/components/create-project-dialog"

export default async function DashboardPage() {
  const supabase = await createClient()
  
  const { data: projects } = await supabase
    .from("projects")
    .select(`
      *,
      tasks (
        id,
        completed
      )
    `)
    .order("created_at", { ascending: false })

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold">Meus Projetos</h1>
          <p className="text-muted-foreground mt-1">
            Gerencie seus projetos e acompanhe o progresso das tarefas
          </p>
        </div>
        <CreateProjectDialog />
      </div>

      <ProjectsList projects={projects || []} />
    </div>
  )
}
