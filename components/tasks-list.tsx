"use client"

import { useState, useOptimistic, useTransition } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Checkbox } from "@/components/ui/checkbox"
import { Button } from "@/components/ui/button"
import { Empty } from "@/components/ui/empty"
import { Trash2, CheckSquare, Loader2 } from "lucide-react"

interface Task {
  id: string
  title: string
  completed: boolean
  created_at: string
  kanban_column_id?: string | null
}

interface TasksListProps {
  tasks: Task[]
  projectId: string
}

export function TasksList({ tasks, projectId }: TasksListProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const [optimisticTasks, updateOptimisticTasks] = useOptimistic(
    tasks,
    (state, update: { id: string; completed?: boolean; delete?: boolean }) => {
      if (update.delete) {
        return state.filter((t) => t.id !== update.id)
      }
      return state.map((t) =>
        t.id === update.id ? { ...t, completed: update.completed ?? t.completed } : t
      )
    }
  )

  async function toggleTask(taskId: string, completed: boolean) {
    startTransition(async () => {
      updateOptimisticTasks({ id: taskId, completed })

      const supabase = createClient()
      await supabase
        .from("tasks")
        .update({ completed, updated_at: new Date().toISOString() })
        .eq("id", taskId)

      router.refresh()
    })
  }

  async function deleteTask(taskId: string) {
    setDeletingId(taskId)
    
    startTransition(async () => {
      updateOptimisticTasks({ id: taskId, delete: true })

      const supabase = createClient()
      await supabase.from("tasks").delete().eq("id", taskId)

      setDeletingId(null)
      router.refresh()
    })
  }

  if (optimisticTasks.length === 0) {
    return (
      <div className="py-8">
        <Empty
          icon={CheckSquare}
          title="Nenhuma tarefa ainda"
          description="Adicione sua primeira tarefa acima."
        />
      </div>
    )
  }

  // Ordenar tarefas: não concluídas primeiro, depois por data de criação
  const sortedTasks = [...optimisticTasks].sort((a, b) => {
    if (a.completed !== b.completed) {
      return a.completed ? 1 : -1
    }
    return new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
  })

  return (
    <div className="divide-y">
      {sortedTasks.map((task) => (
        <div
          key={task.id}
          className="flex items-center gap-3 py-3 group"
        >
          <Checkbox
            id={`task-${task.id}`}
            checked={task.completed}
            onCheckedChange={(checked) => toggleTask(task.id, checked as boolean)}
            disabled={isPending}
          />
          <label
            htmlFor={`task-${task.id}`}
            className={`flex-1 cursor-pointer text-sm ${
              task.completed ? "line-through text-muted-foreground" : ""
            }`}
          >
            {task.title}
          </label>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive"
            onClick={() => deleteTask(task.id)}
            disabled={deletingId === task.id}
          >
            {deletingId === task.id ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Trash2 className="h-4 w-4" />
            )}
            <span className="sr-only">Deletar tarefa</span>
          </Button>
        </div>
      ))}
    </div>
  )
}
