"use client"

import { useState } from "react"
import { TasksList } from "@/components/tasks-list"
import { KanbanBoard } from "@/components/kanban-board"
import { ViewToggle } from "@/components/view-toggle"
import { AddTaskForm } from "@/components/add-task-form"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

interface Task {
  id: string
  title: string
  completed: boolean
  created_at: string
  kanban_column_id: string | null
}

interface KanbanColumn {
  id: string
  name: string
  color: string
  position: number
}

interface TasksContainerProps {
  tasks: Task[]
  columns: KanbanColumn[]
  projectId: string
}

export function TasksContainer({ tasks, columns, projectId }: TasksContainerProps) {
  const [view, setView] = useState<"list" | "kanban">("list")

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-lg">Tarefas</CardTitle>
        <ViewToggle view={view} onViewChange={setView} />
      </CardHeader>
      <CardContent>
        <AddTaskForm projectId={projectId} />
        {view === "list" ? (
          <TasksList tasks={tasks} projectId={projectId} />
        ) : (
          <KanbanBoard tasks={tasks} columns={columns} projectId={projectId} />
        )}
      </CardContent>
    </Card>
  )
}
