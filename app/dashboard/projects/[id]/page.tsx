import { notFound } from "next/navigation"
import Link from "next/link"
import { createClient } from "@/lib/supabase/server"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { ArrowLeft } from "lucide-react"
import { TasksContainer } from "@/components/tasks-container"
import { ProjectActions } from "@/components/project-actions"

interface ProjectPageProps {
  params: Promise<{ id: string }>
}

export default async function ProjectPage({ params }: ProjectPageProps) {
  const { id } = await params
  const supabase = await createClient()

  const [projectResult, columnsResult] = await Promise.all([
    supabase
      .from("projects")
      .select(`
        *,
        tasks (
          id,
          title,
          completed,
          created_at,
          kanban_column_id
        )
      `)
      .eq("id", id)
      .single(),
    supabase
      .from("kanban_columns")
      .select("*")
      .eq("project_id", id)
      .order("position", { ascending: true })
  ])

  if (projectResult.error || !projectResult.data) {
    notFound()
  }

  const project = projectResult.data
  const columns = columnsResult.data || []

  const totalTasks = project.tasks?.length || 0
  const completedTasks = project.tasks?.filter((t: { completed: boolean }) => t.completed).length || 0
  const progress = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0

  return (
    <div>
      <div className="mb-6">
        <Button variant="ghost" size="sm" asChild className="mb-4">
          <Link href="/dashboard">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar aos projetos
          </Link>
        </Button>

        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold">{project.name}</h1>
            {project.description && (
              <p className="text-muted-foreground mt-2 max-w-2xl">
                {project.description}
              </p>
            )}
          </div>
          <ProjectActions project={project} />
        </div>
      </div>

      <Card className="mb-6">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">Progresso</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between text-sm mb-2">
            <span className="text-muted-foreground">
              {completedTasks} de {totalTasks} {totalTasks === 1 ? "tarefa concluída" : "tarefas concluídas"}
            </span>
            <span className="font-medium">{Math.round(progress)}%</span>
          </div>
          <Progress value={progress} className="h-3" />
        </CardContent>
      </Card>

      <TasksContainer 
        tasks={project.tasks || []} 
        columns={columns} 
        projectId={project.id} 
      />
    </div>
  )
}
