-- Fix security warning: Set search_path for trigger function
DROP FUNCTION IF EXISTS public.update_updated_at_column() CASCADE;

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Recreate all triggers that use this function
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_motoristas_updated_at
  BEFORE UPDATE ON public.motoristas
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_viaturas_updated_at
  BEFORE UPDATE ON public.viaturas
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_maquinario_updated_at
  BEFORE UPDATE ON public.maquinario
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_controle_abastecimento_updated_at
  BEFORE UPDATE ON public.controle_abastecimento
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_manutencoes_updated_at
  BEFORE UPDATE ON public.manutencoes
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();