ALTER TABLE public."Pessoas"
  ADD COLUMN IF NOT EXISTS cargo text,
  ADD COLUMN IF NOT EXISTS email text,
  ADD COLUMN IF NOT EXISTS telefone text,
  ADD COLUMN IF NOT EXISTS data_admissao date,
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'Ativo',
  ADD COLUMN IF NOT EXISTS observacoes text,
  ADD COLUMN IF NOT EXISTS created_at timestamptz NOT NULL DEFAULT now(),
  ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();

-- Sincroniza status com a coluna `ativo` existente para os registros já cadastrados
UPDATE public."Pessoas"
   SET status = CASE
                   WHEN lower(coalesce(ativo, '')) IN ('sim', 'true', 't', '1', 'ativo') THEN 'Ativo'
                   WHEN lower(coalesce(ativo, '')) IN ('desligado', 'inativo', 'nao', 'não', 'false', 'f', '0') THEN 'Desligado'
                   ELSE 'Ativo'
                END
 WHERE status IS NULL OR status = 'Ativo';

-- Trigger de updated_at (a função touch_updated_at já existe no projeto)
DROP TRIGGER IF EXISTS pessoas_touch_updated_at ON public."Pessoas";
CREATE TRIGGER pessoas_touch_updated_at
  BEFORE UPDATE ON public."Pessoas"
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();