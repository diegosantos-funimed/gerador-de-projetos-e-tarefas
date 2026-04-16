-- Módulo de Notas e Conhecimento
-- Migration 009: Criar tabela notes

CREATE TABLE IF NOT EXISTS notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('diary', 'reading', 'wiki')),
  title TEXT NOT NULL,
  content TEXT,
  -- Campos específicos de leituras
  author TEXT,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  -- Data da entrada (diário)
  entry_date DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE notes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users manage own notes" ON notes;
CREATE POLICY "Users manage own notes" ON notes
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS notes_user_id_type_idx ON notes(user_id, type);
CREATE INDEX IF NOT EXISTS notes_user_id_created_at_idx ON notes(user_id, created_at DESC);
