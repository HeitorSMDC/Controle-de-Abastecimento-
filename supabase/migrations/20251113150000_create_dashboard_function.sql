-- Remove a função antiga se ela existir, para garantir a recriação
DROP FUNCTION IF EXISTS get_dashboard_stats(int);

-- Cria a função atualizada
CREATE OR REPLACE FUNCTION get_dashboard_stats(ano_selecionado integer)
RETURNS jsonb
LANGUAGE plpgsql
AS $$
DECLARE
  stats jsonb;
BEGIN
  SELECT
    jsonb_build_object(
      -- Cálculos de totais (sem alteração)
      'total_gasto_ano',
      COALESCE(SUM(valor_reais), 0),
      'total_litros_ano',
      COALESCE(SUM(quantidade_litros), 0),
      'gasto_medio_por_litro',
      COALESCE(SUM(valor_reais) / NULLIF(SUM(quantidade_litros), 0), 0),
      
      -- ### ESTA É A CORREÇÃO ###
      -- Trocamos 'total_registros_ano' por 'media_km_l_frota'
      -- Usamos AVG() para calcular a média de todas as médias válidas (ignorando nulos ou zeros)
      'media_km_l_frota',
      COALESCE(AVG(media_km_l), 0),
      -- ### FIM DA CORREÇÃO ###

      'gastos_por_mes',
      (
        SELECT
          jsonb_agg(
            jsonb_build_object(
              'mes', mes_numero,
              'mes_nome', mes_nome,
              'total', total_gasto
            )
          )
        FROM (
          SELECT
            g.mes_numero,
            -- 'TMMonth' remove espaços em branco do nome do mês
            to_char(to_timestamp(g.mes_numero::text, 'MM'), 'TMMonth') AS mes_nome,
            COALESCE(SUM(ca.valor_reais), 0) AS total_gasto
          FROM
            generate_series(1, 12) AS g(mes_numero) -- Gera todos os 12 meses
          LEFT JOIN
            public.controle_abastecimento AS ca
            ON g.mes_numero = ca.mes AND ca.ano = ano_selecionado
          GROUP BY
            g.mes_numero
          ORDER BY
            g.mes_numero
        ) AS gastos_mensais
      ),

      'gastos_por_veiculo',
      (
        SELECT
          jsonb_agg(
            jsonb_build_object(
              'nome', veiculo,
              'total', total_gasto
            )
          )
        FROM (
          SELECT
            veiculo,
            SUM(valor_reais) AS total_gasto
          FROM
            public.controle_abastecimento
          WHERE
            ano = ano_selecionado
          GROUP BY
            veiculo
          ORDER BY
            total_gasto DESC
          LIMIT 10 -- Pega os 10 veículos com mais gastos
        ) AS gastos_veiculos
      )
    )
  INTO
    stats
  FROM
    public.controle_abastecimento
  WHERE
    ano = ano_selecionado
    -- Adicionamos esta condição para que o AVG() calcule apenas sobre registros válidos
    AND media_km_l IS NOT NULL AND media_km_l > 0; 

  RETURN stats;
END;
$$;