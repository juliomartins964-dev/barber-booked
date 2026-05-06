
-- Roles enum and table
CREATE TYPE public.app_role AS ENUM ('cliente', 'barbeiro');

CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

CREATE POLICY "Users view own roles" ON public.user_roles FOR SELECT TO authenticated USING (auth.uid() = user_id);

-- Profiles
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  nome TEXT NOT NULL DEFAULT '',
  telefone TEXT,
  foto_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Profiles readable by authenticated" ON public.profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users update own profile" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id);
CREATE POLICY "Users insert own profile" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);

-- Trigger to create profile + role on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_role app_role;
BEGIN
  INSERT INTO public.profiles (id, nome, telefone)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'nome', ''),
    NEW.raw_user_meta_data->>'telefone'
  );

  v_role := COALESCE((NEW.raw_user_meta_data->>'tipo')::app_role, 'cliente'::app_role);
  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, v_role);

  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- updated_at helper
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;

CREATE TRIGGER profiles_updated_at BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Serviços
CREATE TABLE public.servicos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  duracao_minutos INTEGER NOT NULL CHECK (duracao_minutos > 0),
  preco NUMERIC(10,2) NOT NULL CHECK (preco >= 0),
  ativo BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.servicos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Servicos readable by authenticated" ON public.servicos FOR SELECT TO authenticated USING (true);
CREATE POLICY "Barbeiros manage servicos insert" ON public.servicos FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(),'barbeiro'));
CREATE POLICY "Barbeiros manage servicos update" ON public.servicos FOR UPDATE TO authenticated USING (public.has_role(auth.uid(),'barbeiro'));
CREATE POLICY "Barbeiros manage servicos delete" ON public.servicos FOR DELETE TO authenticated USING (public.has_role(auth.uid(),'barbeiro'));

-- Limites agenda
CREATE TABLE public.limites_agenda (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  barbeiro_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  dia_semana SMALLINT NOT NULL CHECK (dia_semana BETWEEN 0 AND 6),
  limite_clientes INTEGER NOT NULL DEFAULT 0 CHECK (limite_clientes >= 0),
  hora_inicio TIME NOT NULL DEFAULT '09:00',
  hora_fim TIME NOT NULL DEFAULT '19:00',
  UNIQUE (barbeiro_id, dia_semana)
);

ALTER TABLE public.limites_agenda ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Limites readable by authenticated" ON public.limites_agenda FOR SELECT TO authenticated USING (true);
CREATE POLICY "Barbeiro manages own limites insert" ON public.limites_agenda FOR INSERT TO authenticated WITH CHECK (auth.uid() = barbeiro_id AND public.has_role(auth.uid(),'barbeiro'));
CREATE POLICY "Barbeiro manages own limites update" ON public.limites_agenda FOR UPDATE TO authenticated USING (auth.uid() = barbeiro_id AND public.has_role(auth.uid(),'barbeiro'));
CREATE POLICY "Barbeiro manages own limites delete" ON public.limites_agenda FOR DELETE TO authenticated USING (auth.uid() = barbeiro_id AND public.has_role(auth.uid(),'barbeiro'));

-- Agendamentos
CREATE TYPE public.agendamento_status AS ENUM ('pendente','confirmado','em_andamento','concluido','cancelado');

CREATE TABLE public.agendamentos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cliente_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  barbeiro_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  servico_id UUID NOT NULL REFERENCES public.servicos(id),
  data DATE NOT NULL,
  hora TIME NOT NULL,
  status agendamento_status NOT NULL DEFAULT 'pendente',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (barbeiro_id, data, hora)
);

ALTER TABLE public.agendamentos ENABLE ROW LEVEL SECURITY;

CREATE INDEX idx_ag_barbeiro_data ON public.agendamentos(barbeiro_id, data);
CREATE INDEX idx_ag_cliente ON public.agendamentos(cliente_id);

CREATE POLICY "Cliente ve seus agendamentos" ON public.agendamentos FOR SELECT TO authenticated
USING (auth.uid() = cliente_id OR auth.uid() = barbeiro_id);

CREATE POLICY "Cliente cria agendamento" ON public.agendamentos FOR INSERT TO authenticated
WITH CHECK (auth.uid() = cliente_id);

CREATE POLICY "Cliente cancela seu agendamento" ON public.agendamentos FOR UPDATE TO authenticated
USING (auth.uid() = cliente_id OR auth.uid() = barbeiro_id);

CREATE POLICY "Cliente deleta seu agendamento" ON public.agendamentos FOR DELETE TO authenticated
USING (auth.uid() = cliente_id);
