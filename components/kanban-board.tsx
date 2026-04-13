"use client"

import { useState, useOptimistic, useTransition } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { MoreVertical, Trash2, Edit2, GripVertical, Loader2 } from "lucide-react"

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

interface KanbanBoardProps {
  tasks: Task[]
  columns: KanbanColumn[]
  projectId: string
}

export function KanbanBoard({ tasks, columns, projectId }: KanbanBoardProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [editingColumn, setEditingColumn] = useState<KanbanColumn | null>(null)
  const [editName, setEditName] = useState("")
  const [editColor, setEditColor] = useState("")
  const [draggingTask, setDraggingTask] = useState<string | null>(null)
  const [deletingTaskId, setDeletingTaskId] = useState<string | null>(null)

  const [optimisticTasks, updateOptimisticTasks] = useOptimistic(
    tasks,
    (state, update: { id: string; columnId?: string | null; completed?: boolean; delete?: boolean }) => {
      if (update.delete) {
        return state.filter((t) => t.id !== update.id)
      }
      return state.map((t) =>
        t.id === update.id 
          ? { 
              ...t, 
              kanban_column_id: update.columnId !== undefined ? update.columnId : t.kanban_column_id,
              completed: update.completed !== undefined ? update.completed : t.completed
            } 
          : t
      )
    }
  )

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

  async function updateColumn() {
    if (!editingColumn || !editName.trim()) return

    const supabase = createClient()
    await supabase
      .from("kanban_columns")
      .update({ name: editName.trim(), color: editColor })
      .eq("id", editingColumn.id)

    setEditingColumn(null)
    router.refresh()
  }

  async function deleteColumn(columnId: string) {
    const supabase = createClient()
    // Primeiro, move todas as tarefas dessa coluna para "sem coluna"
    await supabase
      .from("tasks")
      .update({ kanban_column_id: null })
      .eq("kanban_column_id", columnId)
    
    await supabase.from("kanban_columns").delete().eq("id", columnId)
    router.refresh()
  }

  async function moveTask(taskId: string, columnId: string | null) {
    startTransition(async () => {
      updateOptimisticTasks({ id: taskId, columnId })

      const supabase = createClient()
      await supabase
        .from("tasks")
        .update({ kanban_column_id: columnId, updated_at: new Date().toISOString() })
        .eq("id", taskId)

      router.refresh()
    })
  }

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
    setDeletingTaskId(taskId)
    startTransition(async () => {
      updateOptimisticTasks({ id: taskId, delete: true })

      const supabase = createClient()
      await supabase.from("tasks").delete().eq("id", taskId)

      setDeletingTaskId(null)
      router.refresh()
    })
  }

  function handleDragStart(taskId: string) {
    setDraggingTask(taskId)
  }

  function handleDragOver(e: React.DragEvent) {
    e.preventDefault()
  }

  function handleDrop(e: React.DragEvent, columnId: string | null) {
    e.preventDefault()
    if (draggingTask) {
      moveTask(draggingTask, columnId)
      setDraggingTask(null)
    }
  }

  function openEditDialog(column: KanbanColumn) {
    setEditingColumn(column)
    setEditName(column.name)
    setEditColor(column.color)
  }

  // Tarefas sem coluna (backlog)
  const unassignedTasks = optimisticTasks.filter(t => !t.kanban_column_id)

  // Ordenar colunas por posição
  const sortedColumns = [...columns].sort((a, b) => a.position - b.position)

  return (
    <div className="flex gap-4 w-full">
      {/* Coluna de Backlog (tarefas sem coluna) */}
      <div
        className="flex-1 min-w-0"
        onDragOver={handleDragOver}
        onDrop={(e) => handleDrop(e, null)}
      >
        <Card className="bg-muted/50 border-dashed">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-muted-foreground/30" />
              Backlog
              <span className="ml-auto text-muted-foreground text-xs">
                {unassignedTasks.length}
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent className="min-h-[200px]">
            <div className="flex flex-col gap-2">
              {unassignedTasks.map((task) => (
                <TaskCard
                  key={task.id}
                  task={task}
                  onDragStart={handleDragStart}
                  onToggle={toggleTask}
                  onDelete={deleteTask}
                  isPending={isPending}
                  isDeleting={deletingTaskId === task.id}
                />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Colunas personalizadas */}
      {sortedColumns.map((column) => {
        const columnTasks = optimisticTasks.filter(t => t.kanban_column_id === column.id)
        
        return (
          <div
            key={column.id}
            className="flex-1 min-w-0"
            onDragOver={handleDragOver}
            onDrop={(e) => handleDrop(e, column.id)}
          >
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <div 
                    className="w-3 h-3 rounded-full" 
                    style={{ backgroundColor: column.color }}
                  />
                  {column.name}
                  <span className="ml-auto text-muted-foreground text-xs">
                    {columnTasks.length}
                  </span>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-6 w-6">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => openEditDialog(column)}>
                        <Edit2 className="mr-2 h-4 w-4" />
                        Editar
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        onClick={() => deleteColumn(column.id)}
                        className="text-destructive"
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Excluir
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </CardTitle>
              </CardHeader>
              <CardContent className="min-h-[200px]">
                <div className="flex flex-col gap-2">
                  {columnTasks.map((task) => (
                    <TaskCard
                      key={task.id}
                      task={task}
                      onDragStart={handleDragStart}
                      onToggle={toggleTask}
                      onDelete={deleteTask}
                      isPending={isPending}
                      isDeleting={deletingTaskId === task.id}
                    />
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )
      })}

      {/* Dialog para editar coluna */}
      <Dialog open={!!editingColumn} onOpenChange={() => setEditingColumn(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Coluna</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-4 py-4">
            <Input
              placeholder="Nome da coluna"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
            />
            <div>
              <label className="text-sm font-medium mb-2 block">Cor</label>
              <div className="flex gap-2 flex-wrap">
                {colors.map((color) => (
                  <button
                    key={color}
                    type="button"
                    className={`w-8 h-8 rounded-full transition-all ${
                      editColor === color ? "ring-2 ring-offset-2 ring-primary" : ""
                    }`}
                    style={{ backgroundColor: color }}
                    onClick={() => setEditColor(color)}
                  />
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingColumn(null)}>
              Cancelar
            </Button>
            <Button onClick={updateColumn} disabled={!editName.trim()}>
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

interface TaskCardProps {
  task: Task
  onDragStart: (taskId: string) => void
  onToggle: (taskId: string, completed: boolean) => void
  onDelete: (taskId: string) => void
  isPending: boolean
  isDeleting: boolean
}

function TaskCard({ task, onDragStart, onToggle, onDelete, isPending, isDeleting }: TaskCardProps) {
  return (
    <div
      draggable
      onDragStart={() => onDragStart(task.id)}
      className={`group bg-background border rounded-lg p-3 cursor-grab active:cursor-grabbing hover:shadow-md transition-shadow ${
        task.completed ? "opacity-60" : ""
      }`}
    >
      <div className="flex items-start gap-2">
        <GripVertical className="h-4 w-4 text-muted-foreground mt-0.5 opacity-0 group-hover:opacity-100 transition-opacity" />
        <Checkbox
          checked={task.completed}
          onCheckedChange={(checked) => onToggle(task.id, checked as boolean)}
          disabled={isPending}
          className="mt-0.5"
        />
        <span className={`flex-1 text-sm ${task.completed ? "line-through text-muted-foreground" : ""}`}>
          {task.title}
        </span>
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive"
          onClick={() => onDelete(task.id)}
          disabled={isDeleting}
        >
          {isDeleting ? (
            <Loader2 className="h-3 w-3 animate-spin" />
          ) : (
            <Trash2 className="h-3 w-3" />
          )}
        </Button>
      </div>
    </div>
  )
}
