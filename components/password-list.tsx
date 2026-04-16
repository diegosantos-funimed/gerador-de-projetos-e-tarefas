"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { toast } from "sonner"
import { Badge } from "@/components/ui/badge"
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
import { Copy, Eye, EyeOff, Search, Trash2 } from "lucide-react"
import { AddPasswordForm } from "@/components/add-password-form"

export interface DecryptedEntry {
  id: string
  name: string
  login: string
  password: string
  notes?: string | null
  created_at: string
}

interface Props {
  entries: DecryptedEntry[]
  cryptoKey: CryptoKey
}

function copyToClipboard(text: string, label: string) {
  navigator.clipboard.writeText(text).then(
    () => toast.success(`${label} copiado!`),
    () => toast.error("Erro ao copiar")
  )
}

function PasswordCell({ password }: { password: string }) {
  const [visible, setVisible] = useState(false)
  return (
    <div className="flex items-center gap-1">
      <span className="font-mono text-sm">
        {visible ? password : "••••••••"}
      </span>
      <button
        onClick={() => setVisible((v) => !v)}
        className="text-muted-foreground hover:text-foreground p-1 rounded"
        title={visible ? "Ocultar" : "Revelar"}
      >
        {visible ? (
          <EyeOff className="w-3.5 h-3.5" />
        ) : (
          <Eye className="w-3.5 h-3.5" />
        )}
      </button>
      <button
        onClick={() => copyToClipboard(password, "Senha")}
        className="text-muted-foreground hover:text-foreground p-1 rounded"
        title="Copiar senha"
      >
        <Copy className="w-3.5 h-3.5" />
      </button>
    </div>
  )
}

export function PasswordList({ entries, cryptoKey }: Props) {
  const [search, setSearch] = useState("")
  const router = useRouter()

  const filtered = entries.filter((e) =>
    e.name.toLowerCase().includes(search.toLowerCase())
  )

  async function handleDelete(id: string) {
    const supabase = createClient()
    const { error } = await supabase
      .from("password_entries")
      .delete()
      .eq("id", id)

    if (error) {
      toast.error("Erro ao excluir")
      return
    }
    toast.success("Senha excluída")
    router.refresh()
  }

  return (
    <div className="space-y-4">
      {/* Barra superior */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nome…"
            className="pl-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <AddPasswordForm cryptoKey={cryptoKey} />
      </div>

      {/* Lista */}
      {filtered.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          {entries.length === 0
            ? "Nenhuma senha cadastrada ainda."
            : "Nenhum resultado para a busca."}
        </div>
      ) : (
        <div className="divide-y rounded-lg border">
          {filtered.map((entry) => (
            <div
              key={entry.id}
              className="flex items-center gap-4 px-4 py-3 hover:bg-muted/30 transition-colors"
            >
              {/* Avatar com inicial */}
              <div className="flex-shrink-0 w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center">
                <span className="text-sm font-semibold text-primary uppercase">
                  {entry.name[0]}
                </span>
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0 grid grid-cols-1 sm:grid-cols-3 gap-1 sm:gap-4">
                <div className="font-medium truncate">{entry.name}</div>

                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                  <span className="truncate">{entry.login}</span>
                  <button
                    onClick={() => copyToClipboard(entry.login, "Login")}
                    className="flex-shrink-0 hover:text-foreground p-1 rounded"
                    title="Copiar login"
                  >
                    <Copy className="w-3.5 h-3.5" />
                  </button>
                </div>

                <PasswordCell password={entry.password} />
              </div>

              {/* Ações */}
              <div className="flex items-center gap-1 flex-shrink-0">
                {entry.notes && (
                  <Badge variant="secondary" className="text-xs hidden sm:flex">
                    nota
                  </Badge>
                )}
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-muted-foreground hover:text-destructive"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Excluir senha?</AlertDialogTitle>
                      <AlertDialogDescription>
                        A senha de <strong>{entry.name}</strong> será excluída
                        permanentemente. Essa ação não pode ser desfeita.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancelar</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => handleDelete(entry.id)}
                        className="bg-destructive hover:bg-destructive/90"
                      >
                        Excluir
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
