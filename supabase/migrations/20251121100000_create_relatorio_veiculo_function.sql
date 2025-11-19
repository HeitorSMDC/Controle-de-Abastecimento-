-- supabase/migrations/20251121100000_create_relatorio_veiculo_function.sql

-- Remove a função antiga se existir
DROP FUNCTION IF EXISTS public.get_relatorio_veiculo(text, integer, integer, integer);

-- Cria a função RPC
CREATE OR REPLACE FUNCTION public.get_relatorio_veiculo(
  p_placa TEXT,      -- Placa do veículo (obrigatório)
  p_ano INT,         -- Ano (obrigatório)
  p_mes INT DEFAULT NULL,    -- Mês (opcional)
  p_semana INT DEFAULT NULL  -- Semana (opcional)
)
RETURNS jsonb
LANGUAGE plpgsql
-- SECURITY DEFINER permite-nos fazer SELECT em dados do sistema (como perfis)
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  relatorio jsonb;
  v_nome_veiculo TEXT;
  v_tipo_combustivel TEXT;
  v_odometro_inicial NUMERIC;
  v_total_gasto NUMERIC(10, 2);
  v_total_litros NUMERIC(10, 4);
  v_media_km_l NUMERIC(10, 4);
  v_km_percorridos NUMERIC(10, 2);
  v_registros_detalhes JSONB;
BEGIN
  -- 1. VERIFICAÇÃO DE SEGURANÇA
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Não autorizado. Por favor, faça login.';
  END IF;

  -- 2. BUSCA INFORMAÇÕES BÁSICAS DO VEÍCULO
  -- Tenta encontrar na viatura ou maquinário
  SELECT nome, tipo_combustivel INTO v_nome_veiculo, v_tipo_combustivel
  FROM viaturas WHERE placa = p_placa
  UNION ALL
  SELECT nome, tipo_combustivel FROM maquinario WHERE placa = p_placa
  LIMIT 1;

  IF v_nome_veiculo IS NULL THEN
    RAISE EXCEPTION 'Veículo com placa % não encontrado.', p_placa;
  END IF;

  -- 3. FILTRAGEM E CÁLCULO DE AGREGADOS
  -- Cria uma tabela temporária com os abastecimentos filtrados
  CREATE TEMP TABLE abastecimentos_filtrados AS
  SELECT
    id,
    data,
    odometro,
    km_percorridos,
    quantidade_litros,
    valor_reais,
    posto,
    media_km_l
  FROM
    public.controle_abastecimento
  WHERE
    placa = p_placa
    AND ano = p_ano
    AND (p_mes IS NULL OR mes = p_mes)
    AND (p_semana IS NULL OR semana = p_semana)
  ORDER BY
    data ASC, created_at ASC; -- Ordem cronológica é crucial

  -- 4. ODOMETRO INICIAL (O primeiro odometro válido no período filtrado)
  SELECT odometro INTO v_odometro_inicial
  FROM abastecimentos_filtrados
  WHERE odometro IS NOT NULL
  ORDER BY data ASC, id ASC
  LIMIT 1;

  -- 5. CÁLCULO DOS TOTAIS E MÉDIAS GLOBAIS DO PERÍODO
  SELECT
    COALESCE(SUM(valor_reais), 0),
    COALESCE(SUM(quantidade_litros), 0),
    COALESCE(AVG(media_km_l), 0)
  INTO
    v_total_gasto,
    v_total_litros,
    v_media_km_l
  FROM
    abastecimentos_filtrados
  WHERE
    media_km_l IS NOT NULL AND media_km_l > 0;

  -- 6. KM PERCORRIDOS TOTAIS
  -- Suma dos km_percorridos (só calculamos a soma dos valores válidos)
  SELECT COALESCE(SUM(km_percorridos), 0)
  INTO v_km_percorridos
  FROM abastecimentos_filtrados
  WHERE km_percorridos IS NOT NULL;
  
  -- 7. DETALHES DOS REGISTROS (para a tabela de impressão)
  SELECT jsonb_agg(
    jsonb_build_object(
      'data', to_char(data, 'DD/MM/YYYY'),
      'odometro', odometro,
      'litros', quantidade_litros,
      'valor_total', valor_reais,
      'posto', posto,
      'km_percorridos', km_percorridos,
      'media_km_l', media_km_l
    ) ORDER BY data ASC, id ASC
  )
  INTO v_registros_detalhes
  FROM abastecimentos_filtrados;

  -- 8. CONSTRUÇÃO FINAL DO JSON
  SELECT
    jsonb_build_object(
      'placa', p_placa,
      'nome_veiculo', v_nome_veiculo,
      'tipo_combustivel', v_tipo_combustivel,
      'filtros_aplicados', jsonb_build_object(
          'ano', p_ano,
          'mes', p_mes,
          'semana', p_semana
      ),
      'odometro_inicial', v_odometro_inicial,
      'total_gasto', v_total_gasto,
      'total_litros', v_total_litros,
      'media_km_l', v_media_km_l,
      'km_percorridos', v_km_percorridos,
      'registros', v_registros_detalhes
    )
  INTO relatorio;
  
  -- 9. Limpa a tabela temporária
  DROP TABLE abastecimentos_filtrados;

  RETURN relatorio;
END;
$$;