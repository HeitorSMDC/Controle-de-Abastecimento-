-- supabase/migrations/20251113140000_add_nf_fields_to_manutencao.sql

ALTER TABLE public.manutencoes
ADD COLUMN nf_numero TEXT NULL,
ADD COLUMN nf_data DATE NULL,
ADD COLUMN nf_fornecedor TEXT NULL;