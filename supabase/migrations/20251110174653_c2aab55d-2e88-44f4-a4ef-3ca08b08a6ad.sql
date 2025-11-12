-- Create enum for user roles
CREATE TYPE public.app_role AS ENUM ('admin', 'coordenador', 'usuario');

-- Create enum for vehicle/machinery status
CREATE TYPE public.status_type AS ENUM ('operante', 'inoperante', 'em_manutencao', 'em_reparo', 'reserva');

-- Create user_roles table for permission management
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  role app_role NOT NULL DEFAULT 'usuario',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, role)
);

-- Enable RLS on user_roles
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Create security definer function to check roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
    AND role = _role
  )
$$;

-- Create function to check if user is admin or coordinator
CREATE OR REPLACE FUNCTION public.is_admin_or_coordinator(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
    AND role IN ('admin', 'coordenador')
  )
$$;

-- Create profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL,
  nome TEXT NOT NULL,
  email TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

-- Enable RLS on profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Create drivers table (motoristas)
CREATE TABLE public.motoristas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  matricula TEXT NOT NULL UNIQUE,
  senha TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on motoristas
ALTER TABLE public.motoristas ENABLE ROW LEVEL SECURITY;

-- Create vehicles table (viaturas)
CREATE TABLE public.viaturas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  ano INTEGER NOT NULL,
  placa TEXT NOT NULL UNIQUE,
  cartao TEXT,
  status status_type NOT NULL DEFAULT 'operante',
  anotacoes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on viaturas
ALTER TABLE public.viaturas ENABLE ROW LEVEL SECURITY;

-- Create machinery table (maquinario)
CREATE TABLE public.maquinario (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  ano INTEGER NOT NULL,
  placa TEXT NOT NULL UNIQUE,
  cartao TEXT,
  status status_type NOT NULL DEFAULT 'operante',
  anotacoes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on maquinario
ALTER TABLE public.maquinario ENABLE ROW LEVEL SECURITY;

-- Create fuel control table (controle de abastecimento)
CREATE TABLE public.controle_abastecimento (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  data DATE NOT NULL,
  veiculo TEXT NOT NULL,
  placa TEXT NOT NULL,
  cartao TEXT,
  motorista TEXT NOT NULL,
  matricula TEXT NOT NULL,
  quantidade_litros DECIMAL(10, 2) NOT NULL,
  valor_reais DECIMAL(10, 2) NOT NULL,
  semana INTEGER NOT NULL,
  mes INTEGER NOT NULL,
  ano INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on controle_abastecimento
ALTER TABLE public.controle_abastecimento ENABLE ROW LEVEL SECURITY;

-- RLS Policies for user_roles
CREATE POLICY "Users can view their own role"
  ON public.user_roles FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all roles"
  ON public.user_roles FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can insert roles"
  ON public.user_roles FOR INSERT
  TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update roles"
  ON public.user_roles FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete roles"
  ON public.user_roles FOR DELETE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for profiles
CREATE POLICY "Users can view all profiles"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own profile"
  ON public.profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- RLS Policies for motoristas (only admin and coordinator can access)
CREATE POLICY "Only admin and coordinator can view drivers"
  ON public.motoristas FOR SELECT
  TO authenticated
  USING (public.is_admin_or_coordinator(auth.uid()));

CREATE POLICY "Only admin and coordinator can insert drivers"
  ON public.motoristas FOR INSERT
  TO authenticated
  WITH CHECK (public.is_admin_or_coordinator(auth.uid()));

CREATE POLICY "Only admin and coordinator can update drivers"
  ON public.motoristas FOR UPDATE
  TO authenticated
  USING (public.is_admin_or_coordinator(auth.uid()));

CREATE POLICY "Only admin and coordinator can delete drivers"
  ON public.motoristas FOR DELETE
  TO authenticated
  USING (public.is_admin_or_coordinator(auth.uid()));

-- RLS Policies for viaturas (all authenticated users can view and edit)
CREATE POLICY "Authenticated users can view vehicles"
  ON public.viaturas FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert vehicles"
  ON public.viaturas FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update vehicles"
  ON public.viaturas FOR UPDATE
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can delete vehicles"
  ON public.viaturas FOR DELETE
  TO authenticated
  USING (public.is_admin_or_coordinator(auth.uid()));

-- RLS Policies for maquinario (all authenticated users can view and edit)
CREATE POLICY "Authenticated users can view machinery"
  ON public.maquinario FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert machinery"
  ON public.maquinario FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update machinery"
  ON public.maquinario FOR UPDATE
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can delete machinery"
  ON public.maquinario FOR DELETE
  TO authenticated
  USING (public.is_admin_or_coordinator(auth.uid()));

-- RLS Policies for controle_abastecimento (all authenticated users can view and edit)
CREATE POLICY "Authenticated users can view fuel control"
  ON public.controle_abastecimento FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert fuel control"
  ON public.controle_abastecimento FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update fuel control"
  ON public.controle_abastecimento FOR UPDATE
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can delete fuel control"
  ON public.controle_abastecimento FOR DELETE
  TO authenticated
  USING (public.is_admin_or_coordinator(auth.uid()));

-- Create function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_motoristas_updated_at BEFORE UPDATE ON public.motoristas
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_viaturas_updated_at BEFORE UPDATE ON public.viaturas
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_maquinario_updated_at BEFORE UPDATE ON public.maquinario
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_controle_abastecimento_updated_at BEFORE UPDATE ON public.controle_abastecimento
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();