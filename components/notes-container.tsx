"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { toast } from "sonner"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { AddNoteForm } from "@/components/add-note-form"
import { BookOpen, FileText, Pencil, Search, Star, Trash2 } from "lucide-react"

interface Note {
  id: string
  type: "diary" | "reading" | "wiki"
  title: string
  content: string | null
  author: string | null
  rating: number | null
  entry_date: string | null
  created_at: string
}

interface NotesContainerProps {
  diary: Note[]
  readings: Note[]
  wiki: Note[]
}

function StarRating({ rating }: { rating: number | null }) {
  if (!rating) return null
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((s) => (
        <Star
          key={s}
          className="w-3.5 h-3.5"
          fill={s <= rating ? "#eab308" : "none"}
          stroke={s <= rating ? "#eab308" : "currentColor"}
        />
      ))}
    </div>
  )
}

function formatEntryDate(dateStr: string): string {
  const [y, m, d] = dateStr.split("-").map(Number)
  return new Date(y, m - 1, d).toLocaleDateString("pt-BR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  })
}

function NoteActions({ note }: { note: Note }) {
  const router = useRouter()

  async function handleDelete() {
    const supabase = createClient()
    const { error } = await supabase.from("notes").delete().eq("id", note.id)
    if (error) {
      toast.error("Erro ao excluir")
      return
    }
    toast.success("Nota excluída")
    router.refresh()
  }

  return (
    <div className="flex items-center gap-1 shrink-0">
      <AddNoteForm
        type={note.type}
        editNote={note}
        trigger={
          <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-foreground">
            <Pencil className="w-3.5 h-3.5" />
          </Button>
        }
      />
      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive">
            <Trash2 className="w-3.5 h-3.5" />
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir nota?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação é irreversível.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-white hover:bg-destructive/90"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

function EmptyState({ label }: { label: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <p className="text-muted-foreground">{label}</p>
    </div>
  )
}

export function NotesContainer({ diary, readings, wiki }: NotesContainerProps) {
  const [wikiSearch, setWikiSearch] = useState("")

  const filteredWiki = wiki.filter(
    (n) =>
      n.title.toLowerCase().includes(wikiSearch.toLowerCase()) ||
      (n.content ?? "").toLowerCase().includes(wikiSearch.toLowerCase())
  )

  return (
    <Tabs defaultValue="diary">
      <TabsList>
        <TabsTrigger value="diary" className="gap-1.5">
          <FileText className="w-4 h-4" /> Diário
        </TabsTrigger>
        <TabsTrigger value="reading" className="gap-1.5">
          <BookOpen className="w-4 h-4" /> Leituras
        </TabsTrigger>
        <TabsTrigger value="wiki" className="gap-1.5">
          <Search className="w-4 h-4" /> Wiki
        </TabsTrigger>
      </TabsList>

      {/* ── Diário ─────────────────────────────────────────────────────────── */}
      <TabsContent value="diary" className="mt-4">
        <div className="flex justify-end mb-4">
          <AddNoteForm type="diary" />
        </div>
        {diary.length === 0 ? (
          <EmptyState label="Nenhuma entrada no diário ainda." />
        ) : (
          <div className="space-y-4">
            {diary.map((note) => (
              <Card key={note.id}>
                <CardHeader className="pb-2 pt-4">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      {note.entry_date && (
                        <p className="text-xs text-muted-foreground capitalize mb-1">
                          {formatEntryDate(note.entry_date)}
                        </p>
                      )}
                      <CardTitle className="text-base">{note.title}</CardTitle>
                    </div>
                    <NoteActions note={note} />
                  </div>
                </CardHeader>
                {note.content && (
                  <CardContent className="pb-4">
                    <p className="text-sm text-muted-foreground whitespace-pre-wrap leading-relaxed">
                      {note.content}
                    </p>
                  </CardContent>
                )}
              </Card>
            ))}
          </div>
        )}
      </TabsContent>

      {/* ── Leituras ────────────────────────────────────────────────────────── */}
      <TabsContent value="reading" className="mt-4">
        <div className="flex justify-end mb-4">
          <AddNoteForm type="reading" />
        </div>
        {readings.length === 0 ? (
          <EmptyState label="Nenhuma leitura registrada ainda." />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {readings.map((note) => (
              <Card key={note.id} className="flex flex-col">
                <CardHeader className="pb-2 pt-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <CardTitle className="text-base leading-snug">{note.title}</CardTitle>
                      {note.author && (
                        <p className="text-xs text-muted-foreground mt-0.5">{note.author}</p>
                      )}
                      {note.rating && (
                        <div className="mt-1.5">
                          <StarRating rating={note.rating} />
                        </div>
                      )}
                    </div>
                    <NoteActions note={note} />
                  </div>
                </CardHeader>
                {note.content && (
                  <CardContent className="pb-4 flex-1">
                    <p className="text-sm text-muted-foreground whitespace-pre-wrap leading-relaxed line-clamp-5">
                      {note.content}
                    </p>
                  </CardContent>
                )}
              </Card>
            ))}
          </div>
        )}
      </TabsContent>

      {/* ── Wiki ────────────────────────────────────────────────────────────── */}
      <TabsContent value="wiki" className="mt-4">
        <div className="flex items-center justify-between gap-3 mb-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Buscar páginas..."
              className="pl-9"
              value={wikiSearch}
              onChange={(e) => setWikiSearch(e.target.value)}
            />
          </div>
          <AddNoteForm type="wiki" />
        </div>
        {filteredWiki.length === 0 ? (
          <EmptyState label={wikiSearch ? "Nenhuma página encontrada." : "Nenhuma página wiki criada ainda."} />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filteredWiki.map((note) => (
              <Card key={note.id} className="flex flex-col">
                <CardHeader className="pb-2 pt-4">
                  <div className="flex items-start justify-between gap-2">
                    <CardTitle className="text-base leading-snug">{note.title}</CardTitle>
                    <NoteActions note={note} />
                  </div>
                </CardHeader>
                {note.content && (
                  <CardContent className="pb-4 flex-1">
                    <p className="text-sm text-muted-foreground whitespace-pre-wrap leading-relaxed line-clamp-6">
                      {note.content}
                    </p>
                  </CardContent>
                )}
              </Card>
            ))}
          </div>
        )}
      </TabsContent>
    </Tabs>
  )
}
