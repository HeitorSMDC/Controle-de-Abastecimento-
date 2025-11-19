-- supabase/migrations/20251120120000_add_top_limit_to_dashboard_stats.sql

-- 1. Remove todas as versões antigas
DROP FUNCTION IF EXISTS public.get_dashboard_stats(int);
DROP FUNCTION IF EXISTS public.get_dashboard_stats(text, integer, integer);
DROP FUNCTION IF EXISTS public.get_dashboard_stats(int, text, text, text);

-- 2. Recria a função com 5 argumentos, incluindo p_limit
CREATE OR REPLACE FUNCTION public.get_dashboard_stats(
  p_ano int,
  p_combustivel text DEFAULT NULL,
  p_placa text DEFAULT NULL,
  p_posto text DEFAULT NULL,
  p_limit int DEFAULT 5 -- NOVO PARÂMETRO
)
RETURNS jsonb
LANGUAGE plpgsql
AS $function$
DECLARE
  stats jsonb;
  v_total_gasto_ano NUMERIC(10, 2);
  v_total_litros_ano NUMERIC(10, 2);
  v_media_km_l_frota NUMERIC(10, 2);
  v_gastos_por_mes JSONB;
  v_gastos_por_veiculo JSONB;
  v_gastos_por_posto JSONB;
  
BEGIN
  -- 1. Cria a tabela temporária virtual com os dados filtrados
  CREATE TEMP TABLE dados_filtrados AS
  SELECT 
    ca.*
  FROM 
    public.controle_abastecimento ca
  LEFT JOIN public.viaturas v ON ca.placa = v.placa
  LEFT JOIN public.maquinario m ON ca.placa = m.placa
  WHERE 
    ca.ano = p_ano
    AND (p_placa IS NULL OR ca.placa = p_placa)
    AND (p_posto IS NULL OR ca.posto = p_posto)
    AND (
      p_combustivel IS NULL OR 
      (v.tipo_combustivel = p_combustivel OR m.tipo_combustivel = p_combustivel)
    );

  -- 2. CÁLCULO DOS KPIS ESCALARES
  SELECT 
    COALESCE(SUM(valor_reais), 0),
    COALESCE(SUM(quantidade_litros), 0),
    COALESCE(AVG(media_km_l), 0)
  INTO 
    v_total_gasto_ano, 
    v_total_litros_ano, 
    v_media_km_l_frota
  FROM 
    dados_filtrados
  WHERE media_km_l IS NOT NULL AND media_km_l > 0;
  
  -- 3. CÁLCULO DO GRÁFICO MENSAL (sem limite)
  WITH GASTOS_MENSAIS AS (
    SELECT
      g.mes_numero,
      CASE g.mes_numero
        WHEN 1 THEN 'Jan' WHEN 2 THEN 'Fev' WHEN 3 THEN 'Mar'
        WHEN 4 THEN 'Abr' WHEN 5 THEN 'Mai' WHEN 6 THEN 'Jun'
        WHEN 7 THEN 'Jul' WHEN 8 THEN 'Ago' WHEN 9 THEN 'Set'
        WHEN 10 THEN 'Out' WHEN 11 THEN 'Nov' WHEN 12 THEN 'Dez'
      END AS mes_nome,
      COALESCE(SUM(df.valor_reais), 0) AS total
    FROM 
      generate_series(1, 12) AS g(mes_numero)
    LEFT JOIN dados_filtrados df ON g.mes_numero = df.mes
    GROUP BY g.mes_numero
  )
  SELECT jsonb_agg(
    jsonb_build_object(
      'mes', mes_numero,
      'mes_nome', mes_nome,
      'total', total
    ) ORDER BY mes_numero
  )
  INTO v_gastos_por_mes
  FROM GASTOS_MENSAIS;

  -- 4. CÁLCULO DO GRÁFICO VEÍCULOS (APLICAÇÃO DO NOVO LIMITE)
  WITH GASTOS_VEICULOS AS (
    SELECT veiculo AS nome, SUM(valor_reais) AS total
    FROM dados_filtrados
    GROUP BY veiculo
    ORDER BY total DESC
    -- Aplica LIMIT se p_limit > 0
    LIMIT CASE WHEN p_limit > 0 THEN p_limit ELSE NULL END
  )
  SELECT jsonb_agg(
    jsonb_build_object(
      'nome', nome,
      'total', total
    )
  )
  INTO v_gastos_por_veiculo
  FROM GASTOS_VEICULOS;
  
  -- 5. CÁLCULO DO GRÁFICO POSTOS (APLICAÇÃO DO NOVO LIMITE)
  WITH GASTOS_POSTOS AS (
    SELECT posto AS nome, SUM(valor_reais) AS total
    FROM dados_filtrados
    WHERE posto IS NOT NULL
    GROUP BY posto
    ORDER BY total DESC
    -- Aplica LIMIT se p_limit > 0
    LIMIT CASE WHEN p_limit > 0 THEN p_limit ELSE NULL END
  )
  SELECT jsonb_agg(
    jsonb_build_object(
      'nome', nome,
      'total', total
    )
  )
  INTO v_gastos_por_posto
  FROM GASTOS_POSTOS;

  -- 6. CONSTRUÇÃO FINAL DO JSON 
  SELECT
    jsonb_build_object(
      'total_gasto_ano', v_total_gasto_ano,
      'total_litros_ano', v_total_litros_ano,
      'gasto_medio_por_litro', v_total_gasto_ano / NULLIF(v_total_litros_ano, 0),
      'media_km_l_frota', v_media_km_l_frota,
      'gastos_por_mes', v_gastos_por_mes,
      'gastos_por_veiculo', v_gastos_por_veiculo,
      'gastos_por_posto', v_gastos_por_posto
    )
  INTO stats;
  
  -- 7. Limpa a tabela temporária
  DROP TABLE dados_filtrados;

  RETURN stats;
END;
$function$;