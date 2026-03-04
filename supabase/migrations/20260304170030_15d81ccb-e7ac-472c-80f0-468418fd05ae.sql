
-- Clients table
CREATE TABLE public.clients (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users NOT NULL,
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Vehicles table (separate from clients)
CREATE TABLE public.vehicles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID REFERENCES public.clients(id) ON DELETE CASCADE NOT NULL,
  brand TEXT NOT NULL,
  model TEXT NOT NULL,
  plate TEXT NOT NULL DEFAULT '',
  year TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Quotes table
CREATE TABLE public.quotes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users NOT NULL,
  client_id UUID REFERENCES public.clients(id) ON DELETE CASCADE NOT NULL,
  vehicle_id UUID REFERENCES public.vehicles(id) ON DELETE SET NULL,
  labor_cost NUMERIC NOT NULL DEFAULT 0,
  parts_markup NUMERIC NOT NULL DEFAULT 0,
  observations TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'pending',
  total NUMERIC NOT NULL DEFAULT 0,
  parts_total NUMERIC NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Quote parts table
CREATE TABLE public.quote_parts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  quote_id UUID REFERENCES public.quotes(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  price NUMERIC NOT NULL DEFAULT 0,
  image_url TEXT
);

-- Services table
CREATE TABLE public.services (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users NOT NULL,
  quote_id UUID REFERENCES public.quotes(id) ON DELETE CASCADE NOT NULL UNIQUE,
  client_id UUID REFERENCES public.clients(id) ON DELETE CASCADE NOT NULL,
  vehicle_id UUID REFERENCES public.vehicles(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'in_progress',
  scheduled_date DATE,
  deadline DATE,
  started_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE
);

-- Payments table
CREATE TABLE public.payments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  service_id UUID REFERENCES public.services(id) ON DELETE CASCADE NOT NULL,
  method TEXT NOT NULL DEFAULT 'pix',
  status TEXT NOT NULL DEFAULT 'pending',
  total_amount NUMERIC NOT NULL DEFAULT 0,
  paid_amount NUMERIC NOT NULL DEFAULT 0,
  remaining_amount NUMERIC NOT NULL DEFAULT 0,
  reminder_date DATE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Audit log table
CREATE TABLE public.audit_log (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users,
  entity_type TEXT NOT NULL,
  entity_id UUID NOT NULL,
  action TEXT NOT NULL,
  details JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quotes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quote_parts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;

-- RLS policies for clients
CREATE POLICY "Users can view own clients" ON public.clients FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Users can insert own clients" ON public.clients FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can update own clients" ON public.clients FOR UPDATE TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Users can delete own clients" ON public.clients FOR DELETE TO authenticated USING (user_id = auth.uid());

-- RLS policies for vehicles (via client ownership)
CREATE POLICY "Users can view own vehicles" ON public.vehicles FOR SELECT TO authenticated USING (client_id IN (SELECT id FROM public.clients WHERE user_id = auth.uid()));
CREATE POLICY "Users can insert own vehicles" ON public.vehicles FOR INSERT TO authenticated WITH CHECK (client_id IN (SELECT id FROM public.clients WHERE user_id = auth.uid()));
CREATE POLICY "Users can update own vehicles" ON public.vehicles FOR UPDATE TO authenticated USING (client_id IN (SELECT id FROM public.clients WHERE user_id = auth.uid()));
CREATE POLICY "Users can delete own vehicles" ON public.vehicles FOR DELETE TO authenticated USING (client_id IN (SELECT id FROM public.clients WHERE user_id = auth.uid()));

-- RLS policies for quotes
CREATE POLICY "Users can view own quotes" ON public.quotes FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Users can insert own quotes" ON public.quotes FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can update own quotes" ON public.quotes FOR UPDATE TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Users can delete own quotes" ON public.quotes FOR DELETE TO authenticated USING (user_id = auth.uid());

-- RLS policies for quote_parts (via quote ownership)
CREATE POLICY "Users can view own quote parts" ON public.quote_parts FOR SELECT TO authenticated USING (quote_id IN (SELECT id FROM public.quotes WHERE user_id = auth.uid()));
CREATE POLICY "Users can insert own quote parts" ON public.quote_parts FOR INSERT TO authenticated WITH CHECK (quote_id IN (SELECT id FROM public.quotes WHERE user_id = auth.uid()));
CREATE POLICY "Users can update own quote parts" ON public.quote_parts FOR UPDATE TO authenticated USING (quote_id IN (SELECT id FROM public.quotes WHERE user_id = auth.uid()));
CREATE POLICY "Users can delete own quote parts" ON public.quote_parts FOR DELETE TO authenticated USING (quote_id IN (SELECT id FROM public.quotes WHERE user_id = auth.uid()));

-- RLS policies for services
CREATE POLICY "Users can view own services" ON public.services FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Users can insert own services" ON public.services FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can update own services" ON public.services FOR UPDATE TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Users can delete own services" ON public.services FOR DELETE TO authenticated USING (user_id = auth.uid());

-- RLS policies for payments (via service ownership)
CREATE POLICY "Users can view own payments" ON public.payments FOR SELECT TO authenticated USING (service_id IN (SELECT id FROM public.services WHERE user_id = auth.uid()));
CREATE POLICY "Users can insert own payments" ON public.payments FOR INSERT TO authenticated WITH CHECK (service_id IN (SELECT id FROM public.services WHERE user_id = auth.uid()));
CREATE POLICY "Users can update own payments" ON public.payments FOR UPDATE TO authenticated USING (service_id IN (SELECT id FROM public.services WHERE user_id = auth.uid()));
CREATE POLICY "Users can delete own payments" ON public.payments FOR DELETE TO authenticated USING (service_id IN (SELECT id FROM public.services WHERE user_id = auth.uid()));

-- RLS policies for audit_log
CREATE POLICY "Users can view own audit log" ON public.audit_log FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Users can insert own audit log" ON public.audit_log FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
