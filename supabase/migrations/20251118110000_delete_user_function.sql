-- supabase/migrations/20251118110000_delete_user_function.sql

-- 1. Remove a função antiga se existir
DROP FUNCTION IF EXISTS public.delete_user(uuid);

-- 2. Cria a função RPC para exclusão total de um utilizador (Admin apenas)
CREATE OR REPLACE FUNCTION public.delete_user(user_to_delete_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
BEGIN
  -- 1. Verificação de Segurança (Só admin pode chamar)
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Acesso negado. Apenas administradores podem apagar utilizadores.';
  END IF;

  -- 2. Prevenção de Auto-exclusão (Admin não pode apagar a si mesmo)
  IF auth.uid() = user_to_delete_id THEN
    RAISE EXCEPTION 'Não pode apagar a sua própria conta através desta função.';
  END IF;

  -- 3. Exclui da tabela profiles
  DELETE FROM public.profiles WHERE user_id = user_to_delete_id;

  -- 4. Exclui da tabela user_roles
  DELETE FROM public.user_roles WHERE user_id = user_to_delete_id;

  -- 5. Exclui do Supabase Auth (auth.users)
  PERFORM supabase_autodelete_user(user_to_delete_id);

END;
$$;