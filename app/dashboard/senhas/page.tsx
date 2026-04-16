import { createClient } from "@/lib/supabase/server"
import { PasswordVault } from "@/components/password-vault"

export default async function SenhasPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const [{ data: vaultConfig }, { data: entries }] = await Promise.all([
    supabase
      .from("password_vault_config")
      .select("salt, verification_token")
      .eq("user_id", user!.id)
      .maybeSingle(),

    supabase
      .from("password_entries")
      .select("id, name, login_encrypted, password_encrypted, notes_encrypted, created_at")
      .eq("user_id", user!.id)
      .order("name"),
  ])

  return (
    <div className="container mx-auto px-4 py-8">
      <PasswordVault
        vaultConfig={vaultConfig ?? null}
        entries={entries ?? []}
      />
    </div>
  )
}
