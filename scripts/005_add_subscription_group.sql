-- Adiciona suporte a assinaturas recorrentes anuais
ALTER TABLE transactions
  ADD COLUMN IF NOT EXISTS subscription_group_id UUID;

-- Índice para buscar todas as ocorrências de uma assinatura
CREATE INDEX IF NOT EXISTS idx_transactions_subscription_group
  ON transactions(subscription_group_id);
