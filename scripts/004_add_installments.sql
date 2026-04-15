-- Adiciona suporte a compras parceladas na tabela transactions
ALTER TABLE transactions
  ADD COLUMN IF NOT EXISTS installment_current INT,
  ADD COLUMN IF NOT EXISTS installment_total INT,
  ADD COLUMN IF NOT EXISTS installment_group_id UUID;

-- Índice para buscar todas as parcelas de um grupo
CREATE INDEX IF NOT EXISTS idx_transactions_installment_group ON transactions(installment_group_id);
