ALTER TABLE public.estagios ADD COLUMN IF NOT EXISTS nome_estagiario TEXT;

GRANT SELECT, INSERT, UPDATE ON public.estagios TO authenticated;
GRANT ALL ON public.estagios TO service_role;
