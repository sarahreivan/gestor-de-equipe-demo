ALTER TABLE public.estagios
  ADD COLUMN IF NOT EXISTS data_renovacao date,
  ADD COLUMN IF NOT EXISTS renovacao_manual boolean NOT NULL DEFAULT false;