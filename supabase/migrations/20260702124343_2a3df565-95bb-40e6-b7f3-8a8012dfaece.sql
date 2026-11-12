
-- Férias: número do processo + exercício
ALTER TABLE public.ferias
  ADD COLUMN IF NOT EXISTS numero_processo text,
  ADD COLUMN IF NOT EXISTS exercicio integer;

-- Processos administrativos (reutiliza tabela existente):
-- adiciona campos livres para atender Contratação, Renovação e Desligamento
ALTER TABLE public.processos
  ADD COLUMN IF NOT EXISTS motivo text,
  ADD COLUMN IF NOT EXISTS observacoes text;
