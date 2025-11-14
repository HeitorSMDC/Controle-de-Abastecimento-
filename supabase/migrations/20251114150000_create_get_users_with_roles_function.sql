-- supabase/migrations/20251114150000_create_get_users_with_roles_function.sql

-- Remove a função se ela já existir por algum teste anterior
DROP FUNCTION IF EXISTS public.get_users_with_roles(text, integer, integer);

-- Cria a função RPC
CREATE OR REPLACE FUNCTION public.get_users_with_roles(
  p_search_term TEXT,  -- Parâmetro para a busca
  p_page_limit INT,    -- Parâmetro para o limite de itens
  p_page_offset INT    -- Parâmetro para o "pulo" (página)
)
-- Define o que a função retorna: um conjunto de linhas (tabela)
RETURNS TABLE (
  id UUID,             -- O id da tabela 'profiles'
  user_id UUID,        -- O id da tabela 'auth.users' (de 'profiles')
  nome TEXT,
  email TEXT,
  user_role app_role,  -- O 'role' da tabela 'user_roles'
  total_count BIGINT   -- A contagem total para a paginação
)
LANGUAGE plpgsql
-- SECURITY DEFINER permite que a função execute com privilégios de admin
-- para poder ler as tabelas 'profiles' e 'user_roles'
SECURITY DEFINER
-- Define o search_path para evitar problemas de segurança com SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- 1. Verificação de Segurança
  -- Verifica se o utilizador que está a chamar a função tem o 'role' de 'admin'
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    -- Se não for admin, lança um erro (que o React Query irá apanhar)
    RAISE EXCEPTION 'Acesso negado. Apenas administradores podem ver os utilizadores.';
  END IF;

  -- 2. Query Principal (Se for Admin)
  -- Usamos "Common Table Expressions" (WITH) para organizar a lógica
  RETURN QUERY
  WITH filtered_users AS (
    SELECT
      p.id,
      p.user_id, -- Aqui resolvemos a ambiguidade: queremos o user_id da tabela profiles
      p.nome,
      p.email,
      ur.role AS user_role
    FROM
      public.profiles AS p
    -- Faz o JOIN com user_roles, usando 'aliases' (p e ur)
    JOIN
      public.user_roles AS ur ON p.user_id = ur.user_id -- Resolve a ambiguidade aqui também
    WHERE
      -- Lógica de busca: se o termo for vazio, ignora; senão, busca por nome ou email
      (p_search_term = '' OR p_search_term IS NULL OR p.nome ILIKE '%' || p_search_term || '%' OR p.email ILIKE '%' || p_search_term || '%')
  ),
  -- Contagem total (necessária para a paginação)
  counted_users AS (
    SELECT *, COUNT(*) OVER() AS total_count 
    FROM filtered_users
  )
  -- Seleção final com paginação
  SELECT *
  FROM counted_users
  ORDER BY
    nome -- Ordena por nome
  LIMIT
    p_page_limit -- Aplica o limite
  OFFSET
    p_page_offset; -- Aplica o "pulo" da página

END;
$$;