-- 1) handle_new_user: create profile only, no automatic role assignment
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO public.profiles (user_id, nome_completo)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'nome_completo', ''))
  ON CONFLICT (user_id) DO NOTHING;

  -- Only the hardcoded admin accounts receive a role automatically.
  -- All other users must be granted a role explicitly by an admin.
  IF lower(NEW.email) IN ('admin1@exemplo.com', 'admin2@exemplo.com') THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'admin'::app_role)
    ON CONFLICT (user_id, role) DO NOTHING;
  END IF;

  RETURN NEW;
END;
$function$;

-- 2) Lock down SECURITY DEFINER function execution.
-- has_role is used inside RLS policies (executed as the table owner), so
-- anon/authenticated do not need direct EXECUTE on it.
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO service_role;

-- handle_new_user / touch_updated_at are trigger functions only; no direct calls.
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.touch_updated_at() FROM PUBLIC, anon, authenticated;