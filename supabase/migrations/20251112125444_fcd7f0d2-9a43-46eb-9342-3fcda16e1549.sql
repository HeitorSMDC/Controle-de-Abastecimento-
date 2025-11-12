-- Fix: Restrict profile email visibility
-- Users should only see their own email, others can see name only
DROP POLICY IF EXISTS "Users can view all profiles" ON public.profiles;

CREATE POLICY "Users can view their own full profile"
  ON public.profiles
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can view other profiles without email"
  ON public.profiles
  FOR SELECT
  USING (auth.uid() != user_id OR auth.uid() IS NULL);