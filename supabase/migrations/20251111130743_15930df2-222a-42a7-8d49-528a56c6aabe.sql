-- Create enum for maintenance status
CREATE TYPE public.status_manutencao AS ENUM ('pendente', 'em_andamento', 'concluida', 'cancelada');

-- Create maintenance table
CREATE TABLE public.manutencoes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  placa TEXT NOT NULL,
  tipo_veiculo TEXT NOT NULL, -- 'viatura' or 'maquinario'
  veiculo_nome TEXT NOT NULL,
  descricao_problema TEXT NOT NULL,
  pecas_necessarias TEXT[],
  links_pecas TEXT[],
  status status_manutencao NOT NULL DEFAULT 'pendente',
  data_registro DATE NOT NULL DEFAULT CURRENT_DATE,
  data_conclusao DATE,
  custo_estimado NUMERIC(10, 2),
  custo_real NUMERIC(10, 2),
  observacoes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.manutencoes ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Authenticated users can view maintenance"
  ON public.manutencoes
  FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can insert maintenance"
  ON public.manutencoes
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update maintenance"
  ON public.manutencoes
  FOR UPDATE
  USING (true);

CREATE POLICY "Only admin and coordinator can delete maintenance"
  ON public.manutencoes
  FOR DELETE
  USING (is_admin_or_coordinator(auth.uid()));

-- Add trigger for updated_at
CREATE TRIGGER update_manutencoes_updated_at
  BEFORE UPDATE ON public.manutencoes
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();