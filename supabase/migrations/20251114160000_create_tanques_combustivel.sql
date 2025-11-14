-- supabase/migrations/20251114160000_create_tanques_combustivel.sql

-- 1. Tabela para armazenar os Tanques
CREATE TABLE public.tanques (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  capacidade_litros NUMERIC(10, 2) NOT NULL,
  litros_atuais NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
  tipo_combustivel TEXT NOT NULL, -- Ex: 'Gasolina', 'Diesel'
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Habilita RLS
ALTER TABLE public.tanques ENABLE ROW LEVEL SECURITY;

-- Políticas de Acesso (RLS) para Tanques
CREATE POLICY "Utilizadores autenticados podem ver tanques"
  ON public.tanques FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Utilizadores autenticados podem criar tanques"
  ON public.tanques FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Utilizadores autenticados podem atualizar tanques"
  ON public.tanques FOR UPDATE
  TO authenticated
  USING (true);

CREATE POLICY "Apenas admin/coordenador pode apagar tanques"
  ON public.tanques FOR DELETE
  TO authenticated
  USING (public.is_admin_or_coordinator(auth.uid()));

-- Trigger para 'updated_at'
CREATE TRIGGER update_tanques_updated_at
  BEFORE UPDATE ON public.tanques
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();


-- 2. Tabela para Movimentações (Entradas e Saídas)
CREATE TYPE public.tipo_movimentacao_tanque AS ENUM ('entrada', 'saida');

CREATE TABLE public.tanque_movimentacoes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tanque_id UUID NOT NULL REFERENCES public.tanques(id) ON DELETE CASCADE,
  tipo tipo_movimentacao_tanque NOT NULL,
  litros NUMERIC(10, 2) NOT NULL,
  valor_reais NUMERIC(10, 2), -- Opcional, usado para 'entradas'
  data TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  responsavel_id UUID REFERENCES public.profiles(user_id), -- Quem fez a operação
  responsavel_nome TEXT,
  observacao TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
  -- Não precisa de 'updated_at' aqui, pois registos são imutáveis
);

-- Habilita RLS
ALTER TABLE public.tanque_movimentacoes ENABLE ROW LEVEL SECURITY;

-- Políticas de Acesso (RLS) para Movimentações
CREATE POLICY "Utilizadores autenticados podem ver movimentações"
  ON public.tanque_movimentacoes FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Utilizadores autenticados podem registar movimentações"
  ON public.tanque_movimentacoes FOR INSERT
  TO authenticated
  WITH CHECK (true);
  
-- (Não permitimos update ou delete de movimentações para manter o histórico)


-- 3. Função Trigger para atualizar 'litros_atuais' automaticamente
CREATE OR REPLACE FUNCTION public.atualizar_litros_tanque_trigger()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Se uma NOVA movimentação for INSERIDA
  IF TG_OP = 'INSERT' THEN
    IF NEW.tipo = 'entrada' THEN
      -- Adiciona litros ao tanque
      UPDATE public.tanques
      SET litros_atuais = litros_atuais + NEW.litros
      WHERE id = NEW.tanque_id;
    ELSIF NEW.tipo = 'saida' THEN
      -- Remove litros do tanque
      UPDATE public.tanques
      SET litros_atuais = litros_atuais - NEW.litros
      WHERE id = NEW.tanque_id;
    END IF;
  END IF;
  
  -- (Poderíamos adicionar lógica para TG_OP = 'DELETE' ou 'UPDATE' se fosse permitido)
  
  RETURN NEW;
END;
$$;

-- 4. Criar o Trigger
CREATE TRIGGER on_tanque_movimentacao_insert
  AFTER INSERT ON public.tanque_movimentacoes
  FOR EACH ROW
  EXECUTE FUNCTION public.atualizar_litros_tanque_trigger();