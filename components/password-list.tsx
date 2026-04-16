"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
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
import { Copy, Eye, EyeOff, FileText, Search, Trash2 } from "lucide-react"
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
    <div className="flex items-center gap-1 min-w-0">
      <span className="font-mono text-sm flex-shrink-0">
        {visible ? password : "••••••••"}
      </span>
      <button
        onClick={() => setVisible((v) => !v)}
        className="flex-shrink-0 text-muted-foreground hover:text-foreground p-1 rounded"
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
        className="flex-shrink-0 text-muted-foreground hover:text-foreground p-1 rounded"
        title="Copiar senha"
      >
        <Copy className="w-3.5 h-3.5" />
      </button>
    </div>
  )
}

function NotePopover({ note }: { note: string }) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          className="flex-shrink-0 text-muted-foreground hover:text-foreground p-1 rounded"
          title="Ver nota"
        >
          <FileText className="w-4 h-4" />
        </button>
      </PopoverTrigger>
      <PopoverContent side="left" align="center" className="w-72">
        <p className="text-sm font-medium mb-1">Nota</p>
        <p className="text-sm text-muted-foreground whitespace-pre-wrap break-words">
          {note}
        </p>
      </PopoverContent>
    </Popover>
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

      {/* Tabela */}
      {filtered.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          {entries.length === 0
            ? "Nenhuma senha cadastrada ainda."
            : "Nenhum resultado para a busca."}
        </div>
      ) : (
        <div className="rounded-lg border overflow-hidden">
          {/* Cabeçalho */}
          <div className="grid grid-cols-[minmax(160px,1fr)_minmax(160px,1fr)_minmax(140px,1fr)_56px] items-center px-4 py-2 bg-muted/40 border-b text-xs text-muted-foreground font-medium uppercase tracking-wide">
            <span>Serviço</span>
            <span>Login</span>
            <span>Senha</span>
            <span />
          </div>

          {/* Linhas */}
          <div className="divide-y">
            {filtered.map((entry) => (
              <div
                key={entry.id}
                className="grid grid-cols-[minmax(160px,1fr)_minmax(160px,1fr)_minmax(140px,1fr)_56px] items-center px-4 py-3 hover:bg-muted/20 transition-colors"
              >
                {/* Serviço */}
                <div className="flex items-center gap-2.5 min-w-0 pr-4">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                    <span className="text-xs font-semibold text-primary uppercase">
                      {entry.name[0]}
                    </span>
                  </div>
                  <span className="font-medium truncate text-sm">
                    {entry.name}
                  </span>
                </div>

                {/* Login */}
                <div className="flex items-center gap-1 min-w-0 pr-4">
                  <span className="text-sm text-muted-foreground truncate">
                    {entry.login}
                  </span>
                  <button
                    onClick={() => copyToClipboard(entry.login, "Login")}
                    className="flex-shrink-0 text-muted-foreground hover:text-foreground p-1 rounded"
                    title="Copiar login"
                  >
                    <Copy className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Senha */}
                <PasswordCell password={entry.password} />

                {/* Ações */}
                <div className="flex items-center justify-end gap-0.5">
                  {entry.notes && <NotePopover note={entry.notes} />}

                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-muted-foreground hover:text-destructive h-8 w-8"
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
        </div>
      )}
    </div>
  )
}
