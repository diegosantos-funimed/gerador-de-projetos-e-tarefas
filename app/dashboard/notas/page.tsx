import { createClient } from "@/lib/supabase/server"
import { NotesContainer } from "@/components/notes-container"

export default async function NotasPage() {
  const supabase = await createClient()

  const { data: notes } = await supabase
    .from("notes")
    .select("id, type, title, content, author, rating, entry_date, created_at")
    .order("created_at", { ascending: false })

  const all = notes ?? []
  const diary = all.filter((n) => n.type === "diary")
  const readings = all.filter((n) => n.type === "reading")
  const wiki = all.filter((n) => n.type === "wiki")

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Notas e Conhecimento</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Diário pessoal, resumos de leituras e sua wiki de conhecimento.
        </p>
      </div>
      <NotesContainer diary={diary} readings={readings} wiki={wiki} />
    </div>
  )
}
