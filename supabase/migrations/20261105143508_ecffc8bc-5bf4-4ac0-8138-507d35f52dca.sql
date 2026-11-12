GRANT SELECT, INSERT, UPDATE, DELETE ON public.processos TO authenticated;
GRANT ALL ON public.processos TO service_role;
ALTER TABLE public.processos ENABLE ROW LEVEL SECURITY;
CREATE POLICY auth_read_processos_v2 ON public.processos FOR SELECT TO authenticated USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'colaborador'));
CREATE POLICY auth_insert_processos_v2 ON public.processos FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'colaborador'));
CREATE POLICY auth_update_processos_v2 ON public.processos FOR UPDATE TO authenticated USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'colaborador')) WITH CHECK (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'colaborador'));
CREATE POLICY admin_delete_processos_v2 ON public.processos FOR DELETE TO authenticated USING (public.has_role(auth.uid(),'admin'));