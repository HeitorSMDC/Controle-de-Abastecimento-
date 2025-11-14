-- supabase/migrations/20251114173000_fix_profiles_rls_policy.sql

-- 1. Remove as duas políticas conflituosas que foram adicionadas
DROP POLICY IF EXISTS "Users can view their own full profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can view other profiles without email" ON public.profiles;

-- 2. Recria a política de "select" original que permite a leitura
-- Esta política é da tua migração inicial (...a6ad.sql) e estava correta.
CREATE POLICY "Users can view all profiles"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (true);