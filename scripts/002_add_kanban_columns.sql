-- Tabela de colunas do Kanban
CREATE TABLE IF NOT EXISTS kanban_columns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  color TEXT DEFAULT '#22c55e',
  position INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Adicionar coluna kanban_column_id na tabela tasks
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS kanban_column_id UUID REFERENCES kanban_columns(id) ON DELETE SET NULL;

-- Habilitar RLS para kanban_columns
ALTER TABLE kanban_columns ENABLE ROW LEVEL SECURITY;

-- Políticas para kanban_columns
DROP POLICY IF EXISTS "Users can view their own kanban columns" ON kanban_columns;
CREATE POLICY "Users can view their own kanban columns" ON kanban_columns
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own kanban columns" ON kanban_columns;
CREATE POLICY "Users can insert their own kanban columns" ON kanban_columns
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own kanban columns" ON kanban_columns;
CREATE POLICY "Users can update their own kanban columns" ON kanban_columns
  FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own kanban columns" ON kanban_columns;
CREATE POLICY "Users can delete their own kanban columns" ON kanban_columns
  FOR DELETE USING (auth.uid() = user_id);

-- Índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_kanban_columns_project_id ON kanban_columns(project_id);
CREATE INDEX IF NOT EXISTS idx_kanban_columns_user_id ON kanban_columns(user_id);
CREATE INDEX IF NOT EXISTS idx_tasks_kanban_column_id ON tasks(kanban_column_id);
