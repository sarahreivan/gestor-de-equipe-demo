
-- 1. Enum de papéis
CREATE TYPE public.app_role AS ENUM ('admin', 'colaborador');

-- 2. Tabela user_roles
CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- 3. Função has_role (security definer, evita recursão)
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- 4. Políticas user_roles
CREATE POLICY "users_read_own_roles"
  ON public.user_roles FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "admins_insert_roles"
  ON public.user_roles FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "admins_update_roles"
  ON public.user_roles FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "admins_delete_roles"
  ON public.user_roles FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- 5. Endurecer RLS nas tabelas de dados
-- Helper: drop todas políticas existentes
DO $$
DECLARE r record;
BEGIN
  FOR r IN
    SELECT schemaname, tablename, policyname
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename IN ('Pessoas','estagios','ferias','processos','estagios_temp','ferias_temp')
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I', r.policyname, r.schemaname, r.tablename);
  END LOOP;
END $$;

-- Revogar anon e garantir grants corretos
REVOKE ALL ON public."Pessoas" FROM anon;
REVOKE ALL ON public.estagios FROM anon;
REVOKE ALL ON public.ferias FROM anon;
REVOKE ALL ON public.processos FROM anon;
REVOKE ALL ON public.estagios_temp FROM anon, authenticated;
REVOKE ALL ON public.ferias_temp FROM anon, authenticated;

GRANT SELECT, INSERT, UPDATE, DELETE ON public."Pessoas" TO authenticated;
GRANT ALL ON public."Pessoas" TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.estagios TO authenticated;
GRANT ALL ON public.estagios TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.ferias TO authenticated;
GRANT ALL ON public.ferias TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.processos TO authenticated;
GRANT ALL ON public.processos TO service_role;
GRANT ALL ON public.estagios_temp TO service_role;
GRANT ALL ON public.ferias_temp TO service_role;

ALTER TABLE public."Pessoas" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.estagios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ferias ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.processos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.estagios_temp ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ferias_temp ENABLE ROW LEVEL SECURITY;

-- Macro: cria políticas padronizadas para tabelas de dados
-- SELECT/INSERT/UPDATE: admin OR colaborador; DELETE: admin
DO $$
DECLARE
  t text;
  tables text[] := ARRAY['Pessoas','estagios','ferias','processos'];
BEGIN
  FOREACH t IN ARRAY tables LOOP
    EXECUTE format($f$
      CREATE POLICY "auth_read_%1$s" ON public.%2$I FOR SELECT TO authenticated
      USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'colaborador'));
    $f$, replace(t,'"',''), t);

    EXECUTE format($f$
      CREATE POLICY "auth_insert_%1$s" ON public.%2$I FOR INSERT TO authenticated
      WITH CHECK (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'colaborador'));
    $f$, replace(t,'"',''), t);

    EXECUTE format($f$
      CREATE POLICY "auth_update_%1$s" ON public.%2$I FOR UPDATE TO authenticated
      USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'colaborador'))
      WITH CHECK (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'colaborador'));
    $f$, replace(t,'"',''), t);

    EXECUTE format($f$
      CREATE POLICY "admin_delete_%1$s" ON public.%2$I FOR DELETE TO authenticated
      USING (public.has_role(auth.uid(),'admin'));
    $f$, replace(t,'"',''), t);
  END LOOP;
END $$;
