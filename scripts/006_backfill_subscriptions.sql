-- =============================================================
-- BACKFILL: Assinaturas recorrentes anuais
--
-- Execute este script no SQL Editor do Supabase.
-- Ele faz duas coisas:
--   1. Agrupa assinaturas existentes por subscription_group_id
--   2. Gera entradas futuras (próximos 5 anos) para cada grupo
--
-- ATENÇÃO: rode 005_add_subscription_group.sql antes deste.
-- =============================================================

-- ---------------------------------------------------------------
-- Passo 1: atribuir subscription_group_id às assinaturas existentes
-- Critério de agrupamento: mesmo user_id + descrição + valor + dia do mês
-- (assinaturas iguais em meses diferentes viram um grupo só)
-- ---------------------------------------------------------------
DO $$
DECLARE
  rec   RECORD;
  gid   UUID;
BEGIN
  FOR rec IN
    SELECT DISTINCT
      user_id,
      description,
      amount,
      EXTRACT(MONTH FROM date)::int AS entry_month,
      EXTRACT(DAY   FROM date)::int AS entry_day
    FROM transactions
    WHERE category = 'Assinaturas'
      AND subscription_group_id IS NULL
  LOOP
    gid := gen_random_uuid();

    UPDATE transactions
    SET subscription_group_id = gid
    WHERE category            = 'Assinaturas'
      AND subscription_group_id IS NULL
      AND user_id             = rec.user_id
      AND description         = rec.description
      AND amount              = rec.amount
      AND EXTRACT(MONTH FROM date) = rec.entry_month
      AND EXTRACT(DAY   FROM date) = rec.entry_day;
  END LOOP;
END $$;

-- ---------------------------------------------------------------
-- Passo 2: para cada grupo, gerar os próximos 5 anos a partir
-- da entrada mais recente, pulando anos que já existam
-- ---------------------------------------------------------------
INSERT INTO transactions
  (user_id, type, amount, description, category, date, subscription_group_id)
SELECT
  g.user_id,
  g.type,
  g.amount,
  g.description,
  g.category,
  (g.max_date + (n || ' year')::interval)::date AS date,
  g.subscription_group_id
FROM (
  SELECT
    user_id,
    type,
    amount,
    description,
    category,
    subscription_group_id,
    MAX(date) AS max_date
  FROM transactions
  WHERE category = 'Assinaturas'
    AND subscription_group_id IS NOT NULL
  GROUP BY
    user_id, type, amount, description, category, subscription_group_id
) g
CROSS JOIN generate_series(1, 5) AS n
WHERE NOT EXISTS (
  SELECT 1
  FROM   transactions e
  WHERE  e.subscription_group_id = g.subscription_group_id
    AND  e.date = (g.max_date + (n || ' year')::interval)::date
);
