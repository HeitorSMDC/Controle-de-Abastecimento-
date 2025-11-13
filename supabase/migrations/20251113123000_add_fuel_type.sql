-- supabase/migrations/20251113123000_add_fuel_type.sql

-- Adiciona a coluna na tabela 'viaturas'
-- Define 'Gasolina' como padrão para os registos existentes
ALTER TABLE public.viaturas
ADD COLUMN tipo_combustivel TEXT NOT NULL DEFAULT 'Gasolina';

-- Adiciona a coluna na tabela 'maquinario'
-- Define 'Diesel' como padrão para os registos existentes
ALTER TABLE public.maquinario
ADD COLUMN tipo_combustivel TEXT NOT NULL DEFAULT 'Diesel';