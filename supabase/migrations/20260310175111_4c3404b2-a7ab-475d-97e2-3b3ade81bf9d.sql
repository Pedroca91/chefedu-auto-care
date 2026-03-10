
-- Enums
CREATE TYPE public.system_role AS ENUM ('super_admin');
CREATE TYPE public.shop_role AS ENUM ('admin', 'mechanic', 'financial');

-- Shops
CREATE TABLE public.shops (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  logo_url text,
  phone text NOT NULL DEFAULT '',
  whatsapp text NOT NULL DEFAULT '',
  address text NOT NULL DEFAULT '',
  email text NOT NULL DEFAULT '',
  primary_color text NOT NULL DEFAULT '348 100% 50%',
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.shops ENABLE ROW LEVEL SECURITY;

-- System roles
CREATE TABLE public.system_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role system_role NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, role)
);
ALTER TABLE public.system_roles ENABLE ROW LEVEL SECURITY;

-- Shop users
CREATE TABLE public.shop_users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id uuid NOT NULL REFERENCES public.shops(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role shop_role NOT NULL DEFAULT 'admin',
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(shop_id, user_id)
);
ALTER TABLE public.shop_users ENABLE ROW LEVEL SECURITY;

-- Add columns to existing tables
ALTER TABLE public.clients ADD COLUMN shop_id uuid REFERENCES public.shops(id) ON DELETE CASCADE;
ALTER TABLE public.clients ADD COLUMN email text NOT NULL DEFAULT '';
ALTER TABLE public.clients ADD COLUMN address text NOT NULL DEFAULT '';
ALTER TABLE public.vehicles ADD COLUMN observations text NOT NULL DEFAULT '';
ALTER TABLE public.quotes ADD COLUMN shop_id uuid REFERENCES public.shops(id) ON DELETE CASCADE;
ALTER TABLE public.services ADD COLUMN shop_id uuid REFERENCES public.shops(id) ON DELETE CASCADE;
ALTER TABLE public.payments ADD COLUMN shop_id uuid REFERENCES public.shops(id) ON DELETE CASCADE;
ALTER TABLE public.audit_log ADD COLUMN shop_id uuid REFERENCES public.shops(id) ON DELETE CASCADE;

-- Vehicle inspections
CREATE TABLE public.vehicle_inspections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  service_id uuid NOT NULL REFERENCES public.services(id) ON DELETE CASCADE,
  shop_id uuid NOT NULL REFERENCES public.shops(id) ON DELETE CASCADE,
  inspector_user_id uuid REFERENCES auth.users(id),
  notes text NOT NULL DEFAULT '',
  inspection_date timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.vehicle_inspections ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.inspection_photos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  inspection_id uuid NOT NULL REFERENCES public.vehicle_inspections(id) ON DELETE CASCADE,
  photo_url text NOT NULL,
  label text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.inspection_photos ENABLE ROW LEVEL SECURITY;

-- Security definer functions
CREATE OR REPLACE FUNCTION public.is_super_admin(_user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$ SELECT EXISTS (SELECT 1 FROM public.system_roles WHERE user_id = _user_id AND role = 'super_admin') $$;

CREATE OR REPLACE FUNCTION public.get_user_shop_ids(_user_id uuid)
RETURNS SETOF uuid LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$ SELECT shop_id FROM public.shop_users WHERE user_id = _user_id $$;

CREATE OR REPLACE FUNCTION public.is_shop_member(_user_id uuid, _shop_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$ SELECT EXISTS (SELECT 1 FROM public.shop_users WHERE user_id = _user_id AND shop_id = _shop_id) $$;

CREATE OR REPLACE FUNCTION public.has_shop_role(_user_id uuid, _shop_id uuid, _role shop_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$ SELECT EXISTS (SELECT 1 FROM public.shop_users WHERE user_id = _user_id AND shop_id = _shop_id AND role = _role) $$;

CREATE OR REPLACE FUNCTION public.is_shop_admin(_user_id uuid, _shop_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$ SELECT EXISTS (SELECT 1 FROM public.shop_users WHERE user_id = _user_id AND shop_id = _shop_id AND role = 'admin') $$;

CREATE OR REPLACE FUNCTION public.auto_assign_super_admin()
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE _email text;
BEGIN
  SELECT email INTO _email FROM auth.users WHERE id = auth.uid();
  IF _email = 'pedrohcarvalho1997@gmail.com' THEN
    INSERT INTO public.system_roles (user_id, role) VALUES (auth.uid(), 'super_admin') ON CONFLICT (user_id, role) DO NOTHING;
  END IF;
END;
$$;

CREATE OR REPLACE FUNCTION public.get_user_id_by_email(_email text)
RETURNS uuid LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$ SELECT id FROM auth.users WHERE email = _email LIMIT 1 $$;

-- Drop old RLS policies
DROP POLICY IF EXISTS "Users can view own clients" ON public.clients;
DROP POLICY IF EXISTS "Users can insert own clients" ON public.clients;
DROP POLICY IF EXISTS "Users can update own clients" ON public.clients;
DROP POLICY IF EXISTS "Users can delete own clients" ON public.clients;
DROP POLICY IF EXISTS "Users can view own quotes" ON public.quotes;
DROP POLICY IF EXISTS "Users can insert own quotes" ON public.quotes;
DROP POLICY IF EXISTS "Users can update own quotes" ON public.quotes;
DROP POLICY IF EXISTS "Users can delete own quotes" ON public.quotes;
DROP POLICY IF EXISTS "Users can view own services" ON public.services;
DROP POLICY IF EXISTS "Users can insert own services" ON public.services;
DROP POLICY IF EXISTS "Users can update own services" ON public.services;
DROP POLICY IF EXISTS "Users can delete own services" ON public.services;
DROP POLICY IF EXISTS "Users can view own payments" ON public.payments;
DROP POLICY IF EXISTS "Users can insert own payments" ON public.payments;
DROP POLICY IF EXISTS "Users can update own payments" ON public.payments;
DROP POLICY IF EXISTS "Users can delete own payments" ON public.payments;
DROP POLICY IF EXISTS "Users can view own audit log" ON public.audit_log;
DROP POLICY IF EXISTS "Users can insert own audit log" ON public.audit_log;
DROP POLICY IF EXISTS "Users can view own vehicles" ON public.vehicles;
DROP POLICY IF EXISTS "Users can insert own vehicles" ON public.vehicles;
DROP POLICY IF EXISTS "Users can update own vehicles" ON public.vehicles;
DROP POLICY IF EXISTS "Users can delete own vehicles" ON public.vehicles;
DROP POLICY IF EXISTS "Users can view own quote parts" ON public.quote_parts;
DROP POLICY IF EXISTS "Users can insert own quote parts" ON public.quote_parts;
DROP POLICY IF EXISTS "Users can update own quote parts" ON public.quote_parts;
DROP POLICY IF EXISTS "Users can delete own quote parts" ON public.quote_parts;

-- New RLS policies
CREATE POLICY "View system roles" ON public.system_roles FOR SELECT TO authenticated USING (user_id = auth.uid() OR public.is_super_admin(auth.uid()));

CREATE POLICY "View shops" ON public.shops FOR SELECT TO authenticated USING (public.is_super_admin(auth.uid()) OR id IN (SELECT public.get_user_shop_ids(auth.uid())));
CREATE POLICY "Insert shops" ON public.shops FOR INSERT TO authenticated WITH CHECK (public.is_super_admin(auth.uid()));
CREATE POLICY "Update shops" ON public.shops FOR UPDATE TO authenticated USING (public.is_super_admin(auth.uid()) OR public.is_shop_admin(auth.uid(), id));
CREATE POLICY "Delete shops" ON public.shops FOR DELETE TO authenticated USING (public.is_super_admin(auth.uid()));

CREATE POLICY "View shop users" ON public.shop_users FOR SELECT TO authenticated USING (public.is_super_admin(auth.uid()) OR shop_id IN (SELECT public.get_user_shop_ids(auth.uid())));
CREATE POLICY "Insert shop users" ON public.shop_users FOR INSERT TO authenticated WITH CHECK (public.is_super_admin(auth.uid()) OR public.is_shop_admin(auth.uid(), shop_id));
CREATE POLICY "Update shop users" ON public.shop_users FOR UPDATE TO authenticated USING (public.is_super_admin(auth.uid()) OR public.is_shop_admin(auth.uid(), shop_id));
CREATE POLICY "Delete shop users" ON public.shop_users FOR DELETE TO authenticated USING (public.is_super_admin(auth.uid()) OR public.is_shop_admin(auth.uid(), shop_id));

CREATE POLICY "View clients" ON public.clients FOR SELECT TO authenticated USING (public.is_super_admin(auth.uid()) OR shop_id IN (SELECT public.get_user_shop_ids(auth.uid())));
CREATE POLICY "Insert clients" ON public.clients FOR INSERT TO authenticated WITH CHECK (shop_id IN (SELECT public.get_user_shop_ids(auth.uid())));
CREATE POLICY "Update clients" ON public.clients FOR UPDATE TO authenticated USING (shop_id IN (SELECT public.get_user_shop_ids(auth.uid())));
CREATE POLICY "Delete clients" ON public.clients FOR DELETE TO authenticated USING (shop_id IN (SELECT public.get_user_shop_ids(auth.uid())));

CREATE POLICY "View vehicles" ON public.vehicles FOR SELECT TO authenticated USING (public.is_super_admin(auth.uid()) OR client_id IN (SELECT id FROM public.clients WHERE shop_id IN (SELECT public.get_user_shop_ids(auth.uid()))));
CREATE POLICY "Insert vehicles" ON public.vehicles FOR INSERT TO authenticated WITH CHECK (client_id IN (SELECT id FROM public.clients WHERE shop_id IN (SELECT public.get_user_shop_ids(auth.uid()))));
CREATE POLICY "Update vehicles" ON public.vehicles FOR UPDATE TO authenticated USING (client_id IN (SELECT id FROM public.clients WHERE shop_id IN (SELECT public.get_user_shop_ids(auth.uid()))));
CREATE POLICY "Delete vehicles" ON public.vehicles FOR DELETE TO authenticated USING (client_id IN (SELECT id FROM public.clients WHERE shop_id IN (SELECT public.get_user_shop_ids(auth.uid()))));

CREATE POLICY "View quotes" ON public.quotes FOR SELECT TO authenticated USING (public.is_super_admin(auth.uid()) OR shop_id IN (SELECT public.get_user_shop_ids(auth.uid())));
CREATE POLICY "Insert quotes" ON public.quotes FOR INSERT TO authenticated WITH CHECK (shop_id IN (SELECT public.get_user_shop_ids(auth.uid())));
CREATE POLICY "Update quotes" ON public.quotes FOR UPDATE TO authenticated USING (shop_id IN (SELECT public.get_user_shop_ids(auth.uid())));
CREATE POLICY "Delete quotes" ON public.quotes FOR DELETE TO authenticated USING (shop_id IN (SELECT public.get_user_shop_ids(auth.uid())));

CREATE POLICY "View quote parts" ON public.quote_parts FOR SELECT TO authenticated USING (public.is_super_admin(auth.uid()) OR quote_id IN (SELECT id FROM public.quotes WHERE shop_id IN (SELECT public.get_user_shop_ids(auth.uid()))));
CREATE POLICY "Insert quote parts" ON public.quote_parts FOR INSERT TO authenticated WITH CHECK (quote_id IN (SELECT id FROM public.quotes WHERE shop_id IN (SELECT public.get_user_shop_ids(auth.uid()))));
CREATE POLICY "Update quote parts" ON public.quote_parts FOR UPDATE TO authenticated USING (quote_id IN (SELECT id FROM public.quotes WHERE shop_id IN (SELECT public.get_user_shop_ids(auth.uid()))));
CREATE POLICY "Delete quote parts" ON public.quote_parts FOR DELETE TO authenticated USING (quote_id IN (SELECT id FROM public.quotes WHERE shop_id IN (SELECT public.get_user_shop_ids(auth.uid()))));

CREATE POLICY "View services" ON public.services FOR SELECT TO authenticated USING (public.is_super_admin(auth.uid()) OR shop_id IN (SELECT public.get_user_shop_ids(auth.uid())));
CREATE POLICY "Insert services" ON public.services FOR INSERT TO authenticated WITH CHECK (shop_id IN (SELECT public.get_user_shop_ids(auth.uid())));
CREATE POLICY "Update services" ON public.services FOR UPDATE TO authenticated USING (shop_id IN (SELECT public.get_user_shop_ids(auth.uid())));
CREATE POLICY "Delete services" ON public.services FOR DELETE TO authenticated USING (shop_id IN (SELECT public.get_user_shop_ids(auth.uid())));

CREATE POLICY "View payments" ON public.payments FOR SELECT TO authenticated USING (public.is_super_admin(auth.uid()) OR shop_id IN (SELECT public.get_user_shop_ids(auth.uid())));
CREATE POLICY "Insert payments" ON public.payments FOR INSERT TO authenticated WITH CHECK (shop_id IN (SELECT public.get_user_shop_ids(auth.uid())));
CREATE POLICY "Update payments" ON public.payments FOR UPDATE TO authenticated USING (shop_id IN (SELECT public.get_user_shop_ids(auth.uid())));
CREATE POLICY "Delete payments" ON public.payments FOR DELETE TO authenticated USING (shop_id IN (SELECT public.get_user_shop_ids(auth.uid())));

CREATE POLICY "View audit log" ON public.audit_log FOR SELECT TO authenticated USING (public.is_super_admin(auth.uid()) OR shop_id IN (SELECT public.get_user_shop_ids(auth.uid())));
CREATE POLICY "Insert audit log" ON public.audit_log FOR INSERT TO authenticated WITH CHECK (shop_id IN (SELECT public.get_user_shop_ids(auth.uid())));

CREATE POLICY "View inspections" ON public.vehicle_inspections FOR SELECT TO authenticated USING (public.is_super_admin(auth.uid()) OR shop_id IN (SELECT public.get_user_shop_ids(auth.uid())));
CREATE POLICY "Insert inspections" ON public.vehicle_inspections FOR INSERT TO authenticated WITH CHECK (shop_id IN (SELECT public.get_user_shop_ids(auth.uid())));
CREATE POLICY "Update inspections" ON public.vehicle_inspections FOR UPDATE TO authenticated USING (shop_id IN (SELECT public.get_user_shop_ids(auth.uid())));
CREATE POLICY "Delete inspections" ON public.vehicle_inspections FOR DELETE TO authenticated USING (shop_id IN (SELECT public.get_user_shop_ids(auth.uid())));

CREATE POLICY "View inspection photos" ON public.inspection_photos FOR SELECT TO authenticated USING (public.is_super_admin(auth.uid()) OR inspection_id IN (SELECT id FROM public.vehicle_inspections WHERE shop_id IN (SELECT public.get_user_shop_ids(auth.uid()))));
CREATE POLICY "Insert inspection photos" ON public.inspection_photos FOR INSERT TO authenticated WITH CHECK (inspection_id IN (SELECT id FROM public.vehicle_inspections WHERE shop_id IN (SELECT public.get_user_shop_ids(auth.uid()))));
CREATE POLICY "Delete inspection photos" ON public.inspection_photos FOR DELETE TO authenticated USING (inspection_id IN (SELECT id FROM public.vehicle_inspections WHERE shop_id IN (SELECT public.get_user_shop_ids(auth.uid()))));

-- Storage buckets
INSERT INTO storage.buckets (id, name, public) VALUES ('inspection-photos', 'inspection-photos', true);
INSERT INTO storage.buckets (id, name, public) VALUES ('shop-logos', 'shop-logos', true);

CREATE POLICY "Upload inspection photos" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'inspection-photos');
CREATE POLICY "View inspection photos storage" ON storage.objects FOR SELECT USING (bucket_id = 'inspection-photos');
CREATE POLICY "Delete inspection photos storage" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'inspection-photos');
CREATE POLICY "Upload shop logos" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'shop-logos');
CREATE POLICY "View shop logos" ON storage.objects FOR SELECT USING (bucket_id = 'shop-logos');
CREATE POLICY "Delete shop logos" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'shop-logos');
