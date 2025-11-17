-- Remove a função antiga para substituir pela nova versão mais poderosa
DROP FUNCTION IF EXISTS get_dashboard_stats(int);
DROP FUNCTION IF EXISTS get_dashboard_stats(int, text, text, text);

CREATE OR REPLACE FUNCTION get_dashboard_stats(
  p_ano int,
  p_combustivel text DEFAULT NULL, -- 'Gasolina', 'Diesel', etc.
  p_placa text DEFAULT NULL,       -- Placa específica
  p_posto text DEFAULT NULL        -- 'Posto Rota 28', etc.
)
RETURNS jsonb
LANGUAGE plpgsql
AS $$
DECLARE
  stats jsonb;
BEGIN
  -- Cria uma tabela temporária virtual com os dados filtrados para evitar repetição de código
  CREATE TEMP TABLE dados_filtrados AS
  SELECT 
    ca.*
  FROM 
    public.controle_abastecimento ca
  LEFT JOIN public.viaturas v ON ca.placa = v.placa
  LEFT JOIN public.maquinario m ON ca.placa = m.placa
  WHERE 
    ca.ano = p_ano
    -- Filtro de Placa
    AND (p_placa IS NULL OR ca.placa = p_placa)
    -- Filtro de Posto
    AND (p_posto IS NULL OR ca.posto = p_posto)
    -- Filtro de Combustível (verifica na viatura ou no maquinário)
    AND (
      p_combustivel IS NULL OR 
      (v.tipo_combustivel = p_combustivel OR m.tipo_combustivel = p_combustivel)
    );

  SELECT
    jsonb_build_object(
      -- TOTAIS
      'total_gasto_ano', COALESCE((SELECT SUM(valor_reais) FROM dados_filtrados), 0),
      'total_litros_ano', COALESCE((SELECT SUM(quantidade_litros) FROM dados_filtrados), 0),
      'gasto_medio_por_litro', COALESCE(
        (SELECT SUM(valor_reais) FROM dados_filtrados) / 
        NULLIF((SELECT SUM(quantidade_litros) FROM dados_filtrados), 0), 0
      ),
      'media_km_l_frota', COALESCE(
        (SELECT AVG(media_km_l) FROM dados_filtrados WHERE media_km_l > 0), 0
      ),

      -- GRÁFICO MENSAL (Garante os 12 meses)
      'gastos_por_mes', (
        SELECT jsonb_agg(
          jsonb_build_object(
            'mes', g.mes_numero,
            'mes_nome', 
              CASE g.mes_numero
                WHEN 1 THEN 'Jan' WHEN 2 THEN 'Fev' WHEN 3 THEN 'Mar'
                WHEN 4 THEN 'Abr' WHEN 5 THEN 'Mai' WHEN 6 THEN 'Jun'
                WHEN 7 THEN 'Jul' WHEN 8 THEN 'Ago' WHEN 9 THEN 'Set'
                WHEN 10 THEN 'Out' WHEN 11 THEN 'Nov' WHEN 12 THEN 'Dez'
              END,
            'total', COALESCE(SUM(df.valor_reais), 0)
          ) ORDER BY g.mes_numero
        )
        FROM generate_series(1, 12) AS g(mes_numero)
        LEFT JOIN dados_filtrados df ON g.mes_numero = df.mes
        GROUP BY g.mes_numero
      ),

      -- GRÁFICO VEÍCULOS (Top 5)
      'gastos_por_veiculo', (
        SELECT jsonb_agg(x) FROM (
          SELECT veiculo AS nome, SUM(valor_reais) AS total
          FROM dados_filtrados
          GROUP BY veiculo
          ORDER BY total DESC
          LIMIT 5
        ) x
      ),

      -- GRÁFICO POSTOS
      'gastos_por_posto', (
        SELECT jsonb_agg(x) FROM (
          SELECT posto AS nome, SUM(valor_reais) AS total
          FROM dados_filtrados
          WHERE posto IS NOT NULL
          GROUP BY posto
          ORDER BY total DESC
        ) x
      )
    )
  INTO stats;

  -- Limpa a tabela temporária
  DROP TABLE dados_filtrados;

  RETURN stats;
END;
$$;