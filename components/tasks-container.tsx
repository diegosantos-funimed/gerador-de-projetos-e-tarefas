"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { TasksList } from "@/components/tasks-list"
import { KanbanBoard } from "@/components/kanban-board"
import { ViewToggle } from "@/components/view-toggle"
import { AddTaskForm } from "@/components/add-task-form"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog"
import { Plus } from "lucide-react"

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

const colors = [
  "#22c55e", // green
  "#3b82f6", // blue
  "#f59e0b", // amber
  "#ef4444", // red
  "#8b5cf6", // violet
  "#ec4899", // pink
  "#06b6d4", // cyan
  "#84cc16", // lime
]

export function TasksContainer({ tasks, columns, projectId }: TasksContainerProps) {
  const router = useRouter()
  const [view, setView] = useState<"list" | "kanban">(() => {
    if (typeof window === "undefined") return "list"
    return (localStorage.getItem(`view-${projectId}`) as "list" | "kanban") ?? "list"
  })

  useEffect(() => {
    localStorage.setItem(`view-${projectId}`, view)
  }, [view, projectId])
  const [newColumnName, setNewColumnName] = useState("")
  const [newColumnColor, setNewColumnColor] = useState("#22c55e")
  const [isAddingColumn, setIsAddingColumn] = useState(false)

  async function addColumn() {
    if (!newColumnName.trim()) return

    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    await supabase.from("kanban_columns").insert({
      project_id: projectId,
      user_id: user.id,
      name: newColumnName.trim(),
      color: newColumnColor,
      position: columns.length,
    })

    setNewColumnName("")
    setNewColumnColor("#22c55e")
    setIsAddingColumn(false)
    router.refresh()
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-lg">Tarefas</CardTitle>
        <ViewToggle view={view} onViewChange={setView} />
      </CardHeader>
      <CardContent>
        <div className="flex items-top gap-2 mb-4">
          <div className="flex-1">
            <AddTaskForm projectId={projectId} />
          </div>
          {view === "kanban" && (
            <Dialog open={isAddingColumn} onOpenChange={setIsAddingColumn}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="shrink-0">
                  <Plus className="mr-2 h-4 w-4" />
                  Adicionar Coluna
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Nova Coluna</DialogTitle>
                </DialogHeader>
                <div className="flex flex-col gap-4 py-4">
                  <Input
                    placeholder="Nome da coluna"
                    value={newColumnName}
                    onChange={(e) => setNewColumnName(e.target.value)}
                  />
                  <div>
                    <label className="text-sm font-medium mb-2 block">Cor</label>
                    <div className="flex gap-2 flex-wrap">
                      {colors.map((color) => (
                        <button
                          key={color}
                          type="button"
                          className={`w-8 h-8 rounded-full transition-all ${
                            newColumnColor === color ? "ring-2 ring-offset-2 ring-primary" : ""
                          }`}
                          style={{ backgroundColor: color }}
                          onClick={() => setNewColumnColor(color)}
                        />
                      ))}
                    </div>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsAddingColumn(false)}>
                    Cancelar
                  </Button>
                  <Button onClick={addColumn} disabled={!newColumnName.trim()}>
                    Criar
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          )}
        </div>
        {view === "list" ? (
          <TasksList tasks={tasks} projectId={projectId} />
        ) : (
          <KanbanBoard tasks={tasks} columns={columns} projectId={projectId} />
        )}
      </CardContent>
    </Card>
  )
}
