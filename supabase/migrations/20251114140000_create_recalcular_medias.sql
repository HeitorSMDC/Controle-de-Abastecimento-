-- supabase/migrations/20251114140000_create_recalcular_medias.sql

CREATE OR REPLACE FUNCTION recalcular_medias_veiculo(placa_veiculo TEXT)
RETURNS VOID AS $$
BEGIN
  -- Usamos um "Common Table Expression" (CTE) para organizar a lógica
  WITH calculos AS (
    SELECT
      id,
      -- LAG() busca o valor da 'odometro' da linha anterior
      -- A ordem (ORDER BY data, created_at) é crucial para garantir a sequência correta
      LAG(odometro, 1, odometro) OVER (ORDER BY data, created_at) as odometro_anterior,
      odometro,
      quantidade_litros,
      data,
      created_at
    FROM
      public.controle_abastecimento
    WHERE
      -- Filtra apenas para o veículo afetado
      placa = placa_veiculo
  ),
  novos_valores AS (
    SELECT
      id,
      -- Calcula a diferença de Km
      CASE
        -- Só calcula se o odômetro atual for maior que o anterior
        WHEN odometro > odometro_anterior THEN odometro - odometro_anterior
        ELSE NULL -- Se for menor ou igual (ex: erro de digitação), anula a distância
      END AS km_percorridos,
      
      -- Calcula a Média Km/L
      CASE
        -- Só calcula se a distância for válida e os litros forem positivos
        WHEN odometro > odometro_anterior AND quantidade_litros > 0 
        THEN (odometro - odometro_anterior) / quantidade_litros
        ELSE NULL
      END AS media_km_l
    FROM
      calculos
  )
  -- Atualiza a tabela principal
  UPDATE
    public.controle_abastecimento ca
  SET
    -- Define os novos valores calculados
    km_percorridos = nv.km_percorridos,
    media_km_l = nv.media_km_l
  FROM
    novos_valores nv
  WHERE
    -- Junta pela ID do registro
    ca.id = nv.id;
END;
$$ LANGUAGE plpgsql
-- SECURITY DEFINER permite que a função execute o UPDATE mesmo com RLS
SECURITY DEFINER
SET search_path = public;