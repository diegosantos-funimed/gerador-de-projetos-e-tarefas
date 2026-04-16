"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import {
  deriveKey,
  decryptText,
  generateSalt,
  makeVerificationToken,
  verifyMasterKey,
} from "@/lib/crypto"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Eye, EyeOff, KeyRound, Lock, LockOpen, ShieldCheck } from "lucide-react"
import { PasswordList, type DecryptedEntry } from "@/components/password-list"

// ── tipos ──────────────────────────────────────────────────────────────────

type VaultStatus = "setup" | "locked" | "unlocked"

interface RawEntry {
  id: string
  name: string
  login_encrypted: string
  password_encrypted: string
  notes_encrypted: string | null
  created_at: string
}

interface VaultConfig {
  salt: string
  verification_token: string
}

interface Props {
  vaultConfig: VaultConfig | null
  entries: RawEntry[]
}

// ── componente ─────────────────────────────────────────────────────────────

export function PasswordVault({ vaultConfig, entries }: Props) {
  const [status, setStatus] = useState<VaultStatus>(
    vaultConfig ? "locked" : "setup"
  )
  const [cryptoKey, setCryptoKey] = useState<CryptoKey | null>(null)
  const [decryptedEntries, setDecryptedEntries] = useState<DecryptedEntry[]>([])

  // Re-descriptografa entradas sempre que o servidor atualizar (router.refresh)
  useEffect(() => {
    if (!cryptoKey || status !== "unlocked") return
    ;(async () => {
      const result: DecryptedEntry[] = await Promise.all(
        entries.map(async (e) => ({
          id: e.id,
          name: e.name,
          login: await decryptText(e.login_encrypted, cryptoKey),
          password: await decryptText(e.password_encrypted, cryptoKey),
          notes: e.notes_encrypted
            ? await decryptText(e.notes_encrypted, cryptoKey)
            : null,
          created_at: e.created_at,
        }))
      )
      setDecryptedEntries(result)
    })()
  }, [entries, cryptoKey, status])

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Cofre de Senhas</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Suas senhas são criptografadas localmente — nem o servidor as vê.
          </p>
        </div>
        {status === "unlocked" && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setCryptoKey(null)
              setDecryptedEntries([])
              setStatus("locked")
            }}
          >
            <Lock className="w-4 h-4 mr-2" />
            Travar cofre
          </Button>
        )}
      </div>

      {status === "setup" && (
        <SetupScreen onSetup={handleSetup} />
      )}

      {status === "locked" && vaultConfig && (
        <UnlockScreen
          vaultConfig={vaultConfig}
          onUnlock={handleUnlock}
        />
      )}

      {status === "unlocked" && (
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground mb-4">
            <ShieldCheck className="inline w-4 h-4 mr-1 text-green-500" />
            Cofre aberto —{" "}
            <span className="font-medium text-foreground">
              {decryptedEntries.length}{" "}
              {decryptedEntries.length === 1 ? "senha" : "senhas"}
            </span>{" "}
            armazenadas.
          </p>
          <PasswordList entries={decryptedEntries} cryptoKey={cryptoKey!} />
        </div>
      )}
    </div>
  )

  // ── handlers ──────────────────────────────────────────────────────────────

  async function handleSetup(
    masterPassword: string
  ): Promise<{ error?: string }> {
    const supabase = createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return { error: "Não autenticado" }

    const salt = generateSalt()
    const key = await deriveKey(masterPassword, salt)
    const verification_token = await makeVerificationToken(key)

    const { error } = await supabase.from("password_vault_config").insert({
      user_id: user.id,
      salt,
      verification_token,
    })

    if (error) return { error: "Erro ao criar cofre" }

    setCryptoKey(key)
    setDecryptedEntries([])
    setStatus("unlocked")
    toast.success("Cofre criado! Guarde bem sua senha mestra.")
    return {}
  }

  async function handleUnlock(
    masterPassword: string
  ): Promise<{ error?: string }> {
    if (!vaultConfig) return { error: "Cofre não configurado" }

    let key: CryptoKey
    try {
      key = await deriveKey(masterPassword, vaultConfig.salt)
    } catch {
      return { error: "Erro ao derivar chave" }
    }

    const valid = await verifyMasterKey(key, vaultConfig.verification_token)
    if (!valid) return { error: "Senha mestra incorreta" }

    const decrypted: DecryptedEntry[] = await Promise.all(
      entries.map(async (e) => ({
        id: e.id,
        name: e.name,
        login: await decryptText(e.login_encrypted, key),
        password: await decryptText(e.password_encrypted, key),
        notes: e.notes_encrypted
          ? await decryptText(e.notes_encrypted, key)
          : null,
        created_at: e.created_at,
      }))
    )

    setCryptoKey(key)
    setDecryptedEntries(decrypted)
    setStatus("unlocked")
    return {}
  }
}

// ── telas de setup / desbloqueio ───────────────────────────────────────────

function SetupScreen({
  onSetup,
}: {
  onSetup: (pw: string) => Promise<{ error?: string }>
}) {
  const [password, setPassword] = useState("")
  const [confirm, setConfirm] = useState("")
  const [showPw, setShowPw] = useState(false)
  const [loading, setLoading] = useState(false)
  const [fieldError, setFieldError] = useState("")

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setFieldError("")

    if (password.length < 8) {
      setFieldError("A senha mestra deve ter pelo menos 8 caracteres.")
      return
    }
    if (password !== confirm) {
      setFieldError("As senhas não coincidem.")
      return
    }

    setLoading(true)
    const { error } = await onSetup(password)
    setLoading(false)
    if (error) setFieldError(error)
  }

  return (
    <div className="flex justify-center">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-2 flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
            <KeyRound className="h-7 w-7 text-primary" />
          </div>
          <CardTitle>Criar senha mestra</CardTitle>
          <CardDescription>
            Esta senha é usada para criptografar seus dados localmente.
            <strong className="block mt-1 text-foreground">
              Não é possível recuperá-la se você esquecer.
            </strong>
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1">
              <Label>Senha mestra</Label>
              <div className="relative">
                <Input
                  type={showPw ? "text" : "password"}
                  placeholder="Mínimo 8 caracteres"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pr-10"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPw((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="space-y-1">
              <Label>Confirmar senha mestra</Label>
              <Input
                type="password"
                placeholder="Repita a senha"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                required
              />
            </div>

            {fieldError && (
              <p className="text-sm text-destructive">{fieldError}</p>
            )}

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Criando cofre…" : "Criar cofre"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

function UnlockScreen({
  vaultConfig,
  onUnlock,
}: {
  vaultConfig: VaultConfig
  onUnlock: (pw: string) => Promise<{ error?: string }>
}) {
  const [password, setPassword] = useState("")
  const [showPw, setShowPw] = useState(false)
  const [loading, setLoading] = useState(false)
  const [fieldError, setFieldError] = useState("")

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setFieldError("")
    setLoading(true)
    const { error } = await onUnlock(password)
    setLoading(false)
    if (error) {
      setFieldError(error)
      setPassword("")
    }
  }

  return (
    <div className="flex justify-center">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-2 flex h-14 w-14 items-center justify-center rounded-full bg-muted">
            <LockOpen className="h-7 w-7 text-muted-foreground" />
          </div>
          <CardTitle>Cofre bloqueado</CardTitle>
          <CardDescription>
            Digite sua senha mestra para acessar as senhas salvas.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1">
              <Label>Senha mestra</Label>
              <div className="relative">
                <Input
                  type={showPw ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pr-10"
                  autoFocus
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPw((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {fieldError && (
              <p className="text-sm text-destructive">{fieldError}</p>
            )}

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Verificando…" : "Desbloquear"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
