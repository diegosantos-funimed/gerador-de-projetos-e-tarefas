"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useForm, useFieldArray } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { createClient } from "@/lib/supabase/client"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Plus, Trash2 } from "lucide-react"

const PRESET_COLORS = [
  "#6366f1", "#8b5cf6", "#ec4899", "#f43f5e",
  "#f97316", "#eab308", "#22c55e", "#14b8a6",
]

const krSchema = z.object({
  title: z.string().min(1, "Obrigatório"),
  target_value: z.coerce.number().min(0),
  unit: z.string().max(20).optional(),
})

const schema = z.object({
  title: z.string().min(1, "Título obrigatório").max(200),
  description: z.string().max(500).optional(),
  period: z.enum(["annual", "quarterly", "weekly"]),
  year: z.coerce.number().min(2020).max(2099),
  quarter: z.coerce.number().min(1).max(4).nullable().optional(),
  color: z.string(),
  key_results: z.array(krSchema).optional(),
})

type FormData = z.infer<typeof schema>

interface AddGoalFormProps {
  editGoal?: {
    id: string
    title: string
    description: string | null
    period: "annual" | "quarterly" | "weekly"
    year: number
    quarter: number | null
    color: string
    progress: number
  }
  trigger?: React.ReactNode
}

export function AddGoalForm({ editGoal, trigger }: AddGoalFormProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const isEdit = !!editGoal
  const currentYear = new Date().getFullYear()

  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      title: editGoal?.title ?? "",
      description: editGoal?.description ?? "",
      period: editGoal?.period ?? "annual",
      year: editGoal?.year ?? currentYear,
      quarter: editGoal?.quarter ?? null,
      color: editGoal?.color ?? PRESET_COLORS[0],
      key_results: [],
    },
  })

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "key_results",
  })

  const period = form.watch("period")

  async function onSubmit(data: FormData) {
    setLoading(true)
    try {
      const supabase = createClient()

      if (isEdit) {
        const { error } = await supabase
          .from("goals")
          .update({
            title: data.title,
            description: data.description || null,
            period: data.period,
            year: data.year,
            quarter: data.period === "quarterly" ? data.quarter : null,
            color: data.color,
            updated_at: new Date().toISOString(),
          })
          .eq("id", editGoal!.id)
        if (error) throw error
        toast.success("Objetivo atualizado!")
      } else {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) throw new Error("Não autenticado")

        const { data: goal, error } = await supabase
          .from("goals")
          .insert({
            user_id: user.id,
            title: data.title,
            description: data.description || null,
            period: data.period,
            year: data.year,
            quarter: data.period === "quarterly" ? data.quarter : null,
            color: data.color,
          })
          .select("id")
          .single()

        if (error) throw error

        // Inserir key results
        if (data.key_results && data.key_results.length > 0) {
          const krs = data.key_results.map((kr) => ({
            goal_id: goal.id,
            user_id: user.id,
            title: kr.title,
            current_value: 0,
            target_value: kr.target_value,
            unit: kr.unit || null,
          }))
          await supabase.from("key_results").insert(krs)
        }

        toast.success("Objetivo criado!")
      }

      form.reset()
      setOpen(false)
      router.refresh()
    } catch {
      toast.error("Erro ao salvar objetivo")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button size="sm">
            <Plus className="w-4 h-4 mr-1" />
            Novo objetivo
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Editar" : "Criar"} objetivo</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Objetivo</FormLabel>
                  <FormControl>
                    <Input placeholder="Ex: Ler 24 livros, Economizar R$ 10.000..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Descrição (opcional)</FormLabel>
                  <FormControl>
                    <Textarea className="resize-none" rows={2} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-3">
              <FormField
                control={form.control}
                name="period"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Período</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="annual">Anual</SelectItem>
                        <SelectItem value="quarterly">Trimestral</SelectItem>
                        <SelectItem value="weekly">Semanal</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="year"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Ano</FormLabel>
                    <FormControl>
                      <Input type="number" min={2020} max={2099} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {period === "quarterly" && (
              <FormField
                control={form.control}
                name="quarter"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Trimestre</FormLabel>
                    <Select
                      onValueChange={(v) => field.onChange(Number(v))}
                      defaultValue={field.value?.toString()}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="1">Q1 (Jan–Mar)</SelectItem>
                        <SelectItem value="2">Q2 (Abr–Jun)</SelectItem>
                        <SelectItem value="3">Q3 (Jul–Set)</SelectItem>
                        <SelectItem value="4">Q4 (Out–Dez)</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            <FormField
              control={form.control}
              name="color"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Cor</FormLabel>
                  <FormControl>
                    <div className="flex flex-wrap gap-2">
                      {PRESET_COLORS.map((color) => (
                        <button
                          key={color}
                          type="button"
                          onClick={() => field.onChange(color)}
                          className={`w-7 h-7 rounded-full transition-transform ${
                            field.value === color
                              ? "scale-125 ring-2 ring-offset-2 ring-ring"
                              : "hover:scale-110"
                          }`}
                          style={{ backgroundColor: color }}
                        />
                      ))}
                    </div>
                  </FormControl>
                </FormItem>
              )}
            />

            {/* Key Results (somente criação) */}
            {!isEdit && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium">Key Results (opcional)</p>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => append({ title: "", target_value: 100, unit: "" })}
                  >
                    <Plus className="w-3.5 h-3.5 mr-1" />
                    Adicionar KR
                  </Button>
                </div>
                {fields.map((field, index) => (
                  <div key={field.id} className="flex gap-2 items-start p-3 border rounded-lg">
                    <div className="flex-1 space-y-2">
                      <FormField
                        control={form.control}
                        name={`key_results.${index}.title`}
                        render={({ field }) => (
                          <FormItem>
                            <FormControl>
                              <Input placeholder="Ex: Ler 24 livros" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <div className="grid grid-cols-2 gap-2">
                        <FormField
                          control={form.control}
                          name={`key_results.${index}.target_value`}
                          render={({ field }) => (
                            <FormItem>
                              <FormControl>
                                <Input type="number" placeholder="Meta (ex: 24)" {...field} />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name={`key_results.${index}.unit`}
                          render={({ field }) => (
                            <FormItem>
                              <FormControl>
                                <Input placeholder="Unidade (ex: livros)" {...field} />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-muted-foreground hover:text-destructive shrink-0 mt-1"
                      onClick={() => remove(index)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}

            <div className="flex justify-end gap-2 pt-1">
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? "Salvando..." : isEdit ? "Salvar" : "Criar"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
