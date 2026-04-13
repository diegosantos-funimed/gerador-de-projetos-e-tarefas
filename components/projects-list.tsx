"use client"

import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Empty } from "@/components/ui/empty"
import { FolderKanban, CheckCircle2, Circle } from "lucide-react"

interface Task {
  id: string
  completed: boolean
}

interface Project {
  id: string
  name: string
  description: string | null
  created_at: string
  tasks: Task[]
}

interface ProjectsListProps {
  projects: Project[]
}

export function ProjectsList({ projects }: ProjectsListProps) {
  if (projects.length === 0) {
    return (
      <Empty
        icon={FolderKanban}
        title="Nenhum projeto ainda"
        description="Crie seu primeiro projeto para começar a organizar suas tarefas."
      />
    )
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {projects.map((project) => {
        const totalTasks = project.tasks?.length || 0
        const completedTasks = project.tasks?.filter((t) => t.completed).length || 0
        const progress = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0

        return (
          <Link key={project.id} href={`/dashboard/projects/${project.id}`}>
            <Card className="h-full hover:border-primary/50 transition-colors cursor-pointer">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FolderKanban className="h-5 w-5 text-primary" />
                  {project.name}
                </CardTitle>
                {project.description && (
                  <CardDescription className="line-clamp-2">
                    {project.description}
                  </CardDescription>
                )}
              </CardHeader>
              <CardContent>
                <div className="flex flex-col gap-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground flex items-center gap-1">
                      {completedTasks === totalTasks && totalTasks > 0 ? (
                        <CheckCircle2 className="h-4 w-4 text-green-500" />
                      ) : (
                        <Circle className="h-4 w-4" />
                      )}
                      {totalTasks} {totalTasks === 1 ? "tarefa" : "tarefas"}
                    </span>
                    <span className="font-medium">
                      {completedTasks}/{totalTasks}
                    </span>
                  </div>
                  <Progress value={progress} className="h-2" />
                </div>
              </CardContent>
            </Card>
          </Link>
        )
      })}
    </div>
  )
}
