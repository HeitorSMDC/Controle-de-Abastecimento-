-- supabase/migrations/20251114120000_add_odometro_fields.sql

ALTER TABLE public.controle_abastecimento
ADD COLUMN odometro INTEGER NULL,
ADD COLUMN km_percorridos INTEGER NULL,
ADD COLUMN media_km_l DECIMAL(10, 2) NULL;

-- Adiciona um índice para otimizar a busca do último odômetro
CREATE INDEX idx_controle_abastecimento_placa_data 
ON public.controle_abastecimento (placa, data DESC);