"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
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
import { Plus, Star } from "lucide-react"

export type NoteType = "diary" | "reading" | "wiki"

const TYPE_LABELS: Record<NoteType, string> = {
  diary: "entrada no diário",
  reading: "leitura",
  wiki: "página wiki",
}

const schema = z.object({
  title: z.string().min(1, "Título obrigatório").max(200),
  content: z.string().max(10000).optional(),
  author: z.string().max(200).optional(),
  rating: z.number().min(1).max(5).nullable().optional(),
  entry_date: z.string().optional(),
})

type FormData = z.infer<typeof schema>

interface AddNoteFormProps {
  type: NoteType
  /** Se fornecido, abre em modo edição */
  editNote?: {
    id: string
    title: string
    content: string | null
    author: string | null
    rating: number | null
    entry_date: string | null
  }
  trigger?: React.ReactNode
  onSuccess?: () => void
}

export function AddNoteForm({ type, editNote, trigger, onSuccess }: AddNoteFormProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [hoverRating, setHoverRating] = useState(0)
  const router = useRouter()
  const isEdit = !!editNote

  const todayStr = new Date().toISOString().split("T")[0]

  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      title: editNote?.title ?? "",
      content: editNote?.content ?? "",
      author: editNote?.author ?? "",
      rating: editNote?.rating ?? null,
      entry_date: editNote?.entry_date ?? todayStr,
    },
  })

  async function onSubmit(data: FormData) {
    setLoading(true)
    try {
      const supabase = createClient()

      if (isEdit) {
        const { error } = await supabase
          .from("notes")
          .update({
            title: data.title,
            content: data.content || null,
            author: data.author || null,
            rating: data.rating ?? null,
            entry_date: type === "diary" ? data.entry_date || todayStr : null,
            updated_at: new Date().toISOString(),
          })
          .eq("id", editNote!.id)
        if (error) throw error
        toast.success("Nota atualizada!")
      } else {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) throw new Error("Não autenticado")
        const { error } = await supabase.from("notes").insert({
          user_id: user.id,
          type,
          title: data.title,
          content: data.content || null,
          author: data.author || null,
          rating: data.rating ?? null,
          entry_date: type === "diary" ? data.entry_date || todayStr : null,
        })
        if (error) throw error
        toast.success(`Nova ${TYPE_LABELS[type]} criada!`)
      }

      form.reset()
      setOpen(false)
      onSuccess?.()
      router.refresh()
    } catch {
      toast.error("Erro ao salvar nota")
    } finally {
      setLoading(false)
    }
  }

  const currentRating = form.watch("rating") ?? 0

  return (
    <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) form.reset({ title: editNote?.title ?? "", content: editNote?.content ?? "", author: editNote?.author ?? "", rating: editNote?.rating ?? null, entry_date: editNote?.entry_date ?? todayStr }) }}>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button size="sm">
            <Plus className="w-4 h-4 mr-1" />
            {type === "diary" && "Nova entrada"}
            {type === "reading" && "Nova leitura"}
            {type === "wiki" && "Nova página"}
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {isEdit ? "Editar" : "Criar"} {TYPE_LABELS[type]}
          </DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">

            {/* Data (diário) */}
            {type === "diary" && (
              <FormField
                control={form.control}
                name="entry_date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Data</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {/* Título */}
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    {type === "diary" && "Título (opcional)"}
                    {type === "reading" && "Título do livro / artigo"}
                    {type === "wiki" && "Título da página"}
                  </FormLabel>
                  <FormControl>
                    <Input
                      placeholder={
                        type === "diary"
                          ? "Como foi meu dia..."
                          : type === "reading"
                          ? "Ex: Atomic Habits"
                          : "Ex: Produtividade pessoal"
                      }
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Autor (leituras) */}
            {type === "reading" && (
              <FormField
                control={form.control}
                name="author"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Autor (opcional)</FormLabel>
                    <FormControl>
                      <Input placeholder="Ex: James Clear" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {/* Avaliação (leituras) */}
            {type === "reading" && (
              <FormField
                control={form.control}
                name="rating"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Avaliação</FormLabel>
                    <FormControl>
                      <div className="flex gap-1">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <button
                            key={star}
                            type="button"
                            onClick={() => field.onChange(field.value === star ? null : star)}
                            onMouseEnter={() => setHoverRating(star)}
                            onMouseLeave={() => setHoverRating(0)}
                            className="p-0.5 transition-transform hover:scale-110"
                          >
                            <Star
                              className="w-6 h-6"
                              fill={star <= (hoverRating || currentRating) ? "#eab308" : "none"}
                              stroke={star <= (hoverRating || currentRating) ? "#eab308" : "currentColor"}
                            />
                          </button>
                        ))}
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {/* Conteúdo */}
            <FormField
              control={form.control}
              name="content"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    {type === "diary" && "Conteúdo"}
                    {type === "reading" && "Resumo / Insights"}
                    {type === "wiki" && "Conteúdo"}
                  </FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder={
                        type === "diary"
                          ? "Escreva sobre seu dia, pensamentos, sentimentos..."
                          : type === "reading"
                          ? "O que aprendeu? Quais insights? Citações marcantes..."
                          : "Escreva o conteúdo desta página de conhecimento..."
                      }
                      className="resize-none"
                      rows={6}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

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
