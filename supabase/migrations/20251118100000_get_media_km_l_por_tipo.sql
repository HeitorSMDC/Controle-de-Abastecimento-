-- supabase/migrations/20251118100000_get_media_km_l_por_tipo.sql

-- 1. Remove a função antiga se existir
DROP FUNCTION IF EXISTS get_media_km_l_por_tipo(text, integer);

-- 2. Cria a nova função RPC
CREATE OR REPLACE FUNCTION get_media_km_l_por_tipo(
  p_tipo_veiculo TEXT, -- 'viatura' ou 'maquinario'
  p_ano INTEGER
)
RETURNS TABLE (
  media NUMERIC
)
LANGUAGE plpgsql
AS $$
BEGIN
  -- Usa uma tabela temporária para identificar o tipo de veículo e calcular a média
  RETURN QUERY
  WITH veiculos_com_media AS (
    SELECT 
      ca.media_km_l,
      CASE
        WHEN v.placa IS NOT NULL THEN 'viatura'
        WHEN m.placa IS NOT NULL THEN 'maquinario'
        ELSE NULL -- Caso não encontre em nenhuma das tabelas (registro órfão, improvável)
      END AS tipo_calculado
    FROM 
      public.controle_abastecimento ca
    LEFT JOIN public.viaturas v ON ca.placa = v.placa
    LEFT JOIN public.maquinario m ON ca.placa = m.placa
    WHERE
      ca.ano = p_ano
      AND ca.media_km_l IS NOT NULL
      AND ca.media_km_l > 0
  )
  SELECT 
    -- COALESCE garante que o retorno seja 0 se não houver dados
    COALESCE(AVG(media_km_l), 0) AS media
  FROM 
    veiculos_com_media
  WHERE 
    -- Filtra pelo tipo que foi passado como parâmetro
    tipo_calculado = p_tipo_veiculo;
    
END;
$$;