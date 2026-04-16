-- =============================================================
-- Módulo de Senhas — criptografia AES-256-GCM client-side
-- Execute no SQL Editor do Supabase
-- =============================================================

-- Configuração do cofre por usuário (salt + token de verificação)
-- A senha mestra NUNCA é armazenada — apenas o salt e um token
-- criptografado usado para verificar se a senha digitada está correta.
CREATE TABLE IF NOT EXISTS password_vault_config (
  user_id          UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  salt             TEXT NOT NULL,               -- PBKDF2 salt (base64)
  verification_token TEXT NOT NULL,             -- plaintext conhecido, cifrado com a chave derivada
  created_at       TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE password_vault_config ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users manage own vault config" ON password_vault_config;
CREATE POLICY "Users manage own vault config" ON password_vault_config
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Entradas de senha (login e senha criptografados no cliente)
CREATE TABLE IF NOT EXISTS password_entries (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id             UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name                TEXT NOT NULL,            -- nome do serviço (não criptografado)
  login_encrypted     TEXT NOT NULL,            -- AES-GCM + base64
  password_encrypted  TEXT NOT NULL,            -- AES-GCM + base64
  notes_encrypted     TEXT,                     -- opcional, AES-GCM + base64
  created_at          TIMESTAMPTZ DEFAULT NOW(),
  updated_at          TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE password_entries ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users view own passwords" ON password_entries;
CREATE POLICY "Users view own passwords" ON password_entries
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users insert own passwords" ON password_entries;
CREATE POLICY "Users insert own passwords" ON password_entries
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users update own passwords" ON password_entries;
CREATE POLICY "Users update own passwords" ON password_entries
  FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users delete own passwords" ON password_entries;
CREATE POLICY "Users delete own passwords" ON password_entries
  FOR DELETE USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_password_entries_user_id ON password_entries(user_id);
CREATE INDEX IF NOT EXISTS idx_password_entries_name    ON password_entries(user_id, name);
