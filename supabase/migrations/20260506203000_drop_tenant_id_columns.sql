-- Drop tenant_id from all public tables that still have it.
-- Prerequisites: business_profile_id exists on these rows; RLS uses business_profile_id + my_tenant_id().
-- Safe order: backfill -> update my_tenant_id() -> replace RLS -> DROP COLUMN CASCADE.

-- Backfill business_profile_id from tenant_id before dropping tenant_id
UPDATE public.profiles SET business_profile_id = tenant_id WHERE business_profile_id IS NULL AND tenant_id IS NOT NULL;
UPDATE public.units SET business_profile_id = tenant_id WHERE business_profile_id IS NULL AND tenant_id IS NOT NULL;
UPDATE public.service_requests SET business_profile_id = tenant_id WHERE business_profile_id IS NULL AND tenant_id IS NOT NULL;
UPDATE public.service_request_comments SET business_profile_id = tenant_id WHERE business_profile_id IS NULL AND tenant_id IS NOT NULL;
UPDATE public.announcements SET business_profile_id = tenant_id WHERE business_profile_id IS NULL AND tenant_id IS NOT NULL;
UPDATE public.payments SET business_profile_id = tenant_id WHERE business_profile_id IS NULL AND tenant_id IS NOT NULL;
UPDATE public.notifications SET business_profile_id = tenant_id WHERE business_profile_id IS NULL AND tenant_id IS NOT NULL;
UPDATE public.service_types SET business_profile_id = tenant_id WHERE business_profile_id IS NULL AND tenant_id IS NOT NULL;
UPDATE public.quote_requests SET business_profile_id = tenant_id WHERE business_profile_id IS NULL AND tenant_id IS NOT NULL;
UPDATE public.quotes SET business_profile_id = tenant_id WHERE business_profile_id IS NULL AND tenant_id IS NOT NULL;
UPDATE public.quote_signatures SET business_profile_id = tenant_id WHERE business_profile_id IS NULL AND tenant_id IS NOT NULL;

-- Session scope: same helper name, now reads business_profile_id
CREATE OR REPLACE FUNCTION public.my_tenant_id()
 RETURNS uuid
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT business_profile_id FROM public.profiles WHERE auth_user_id = auth.uid() LIMIT 1;
$function$;

-- RLS: expressions use business_profile_id instead of tenant_id
DROP POLICY IF EXISTS "tenant isolation" ON public.announcements;
CREATE POLICY "tenant isolation" ON public.announcements FOR ALL TO public USING ((business_profile_id = my_tenant_id()));

DROP POLICY IF EXISTS "manager sees all payments" ON public.payments;
DROP POLICY IF EXISTS "resident sees own payments" ON public.payments;
CREATE POLICY "manager sees all payments" ON public.payments FOR SELECT TO public USING (((business_profile_id = my_tenant_id()) AND (my_role() = ANY (ARRAY['manager'::user_role, 'super_admin'::user_role]))));
CREATE POLICY "resident sees own payments" ON public.payments FOR SELECT TO public USING (((business_profile_id = my_tenant_id()) AND (resident_id = my_profile_id())));

DROP POLICY IF EXISTS "manager sees tenant profiles" ON public.profiles;
CREATE POLICY "manager sees tenant profiles" ON public.profiles FOR SELECT TO public USING (((my_role() = 'super_admin'::user_role) OR (business_profile_id = my_tenant_id())));

DROP POLICY IF EXISTS "manager can update quote_request" ON public.quote_requests;
DROP POLICY IF EXISTS "manager sees all quote_requests" ON public.quote_requests;
DROP POLICY IF EXISTS "resident can insert quote_request" ON public.quote_requests;
DROP POLICY IF EXISTS "resident sees own quote_requests" ON public.quote_requests;
CREATE POLICY "manager can update quote_request" ON public.quote_requests FOR UPDATE TO public USING (((business_profile_id = my_tenant_id()) AND (my_role() = ANY (ARRAY['manager'::user_role, 'super_admin'::user_role]))));
CREATE POLICY "manager sees all quote_requests" ON public.quote_requests FOR SELECT TO public USING (((business_profile_id = my_tenant_id()) AND (my_role() = ANY (ARRAY['manager'::user_role, 'employee'::user_role, 'super_admin'::user_role]))));
CREATE POLICY "resident can insert quote_request" ON public.quote_requests FOR INSERT TO public WITH CHECK (((business_profile_id = my_tenant_id()) AND (my_role() = 'resident'::user_role)));
CREATE POLICY "resident sees own quote_requests" ON public.quote_requests FOR SELECT TO public USING (((business_profile_id = my_tenant_id()) AND (requested_by = my_profile_id())));

DROP POLICY IF EXISTS "manager sees signatures" ON public.quote_signatures;
DROP POLICY IF EXISTS "resident can sign" ON public.quote_signatures;
CREATE POLICY "manager sees signatures" ON public.quote_signatures FOR SELECT TO public USING (((business_profile_id = my_tenant_id()) AND (my_role() = ANY (ARRAY['manager'::user_role, 'super_admin'::user_role]))));
CREATE POLICY "resident can sign" ON public.quote_signatures FOR INSERT TO public WITH CHECK (((business_profile_id = my_tenant_id()) AND (signed_by = my_profile_id())));

DROP POLICY IF EXISTS "manager manages quotes" ON public.quotes;
DROP POLICY IF EXISTS "resident sees own quotes" ON public.quotes;
CREATE POLICY "manager manages quotes" ON public.quotes FOR ALL TO public USING (((business_profile_id = my_tenant_id()) AND (my_role() = ANY (ARRAY['manager'::user_role, 'super_admin'::user_role]))));
CREATE POLICY "resident sees own quotes" ON public.quotes FOR SELECT TO public USING (((business_profile_id = my_tenant_id()) AND (request_id IN ( SELECT quote_requests.id FROM quote_requests WHERE (quote_requests.requested_by = my_profile_id())))));

DROP POLICY IF EXISTS "tenant isolation" ON public.service_request_comments;
CREATE POLICY "tenant isolation" ON public.service_request_comments FOR ALL TO public USING ((business_profile_id = my_tenant_id()));

DROP POLICY IF EXISTS "manager can update request" ON public.service_requests;
DROP POLICY IF EXISTS "manager sees all requests" ON public.service_requests;
DROP POLICY IF EXISTS "resident can insert request" ON public.service_requests;
DROP POLICY IF EXISTS "resident sees own requests" ON public.service_requests;
CREATE POLICY "manager can update request" ON public.service_requests FOR UPDATE TO public USING (((business_profile_id = my_tenant_id()) AND (my_role() = ANY (ARRAY['manager'::user_role, 'employee'::user_role, 'super_admin'::user_role]))));
CREATE POLICY "manager sees all requests" ON public.service_requests FOR SELECT TO public USING (((business_profile_id = my_tenant_id()) AND (my_role() = ANY (ARRAY['manager'::user_role, 'employee'::user_role, 'super_admin'::user_role]))));
CREATE POLICY "resident can insert request" ON public.service_requests FOR INSERT TO public WITH CHECK ((business_profile_id = my_tenant_id()));
CREATE POLICY "resident sees own requests" ON public.service_requests FOR SELECT TO public USING (((business_profile_id = my_tenant_id()) AND (reported_by = my_profile_id())));

DROP POLICY IF EXISTS "manager manages service_types" ON public.service_types;
DROP POLICY IF EXISTS "residents can view service_types" ON public.service_types;
CREATE POLICY "manager manages service_types" ON public.service_types FOR ALL TO public USING (((business_profile_id = my_tenant_id()) AND (my_role() = ANY (ARRAY['manager'::user_role, 'super_admin'::user_role]))));
CREATE POLICY "residents can view service_types" ON public.service_types FOR SELECT TO public USING ((business_profile_id = my_tenant_id()));

DROP POLICY IF EXISTS "tenant isolation" ON public.units;
CREATE POLICY "tenant isolation" ON public.units FOR ALL TO public USING ((business_profile_id = my_tenant_id()));

DROP POLICY IF EXISTS "business_profiles_select_super_or_tenant" ON public.business_profiles;
CREATE POLICY "business_profiles_select_super_or_tenant" ON public.business_profiles FOR SELECT TO public USING (((EXISTS ( SELECT 1 FROM profiles p WHERE ((p.auth_user_id = auth.uid()) AND (p.role = 'super_admin'::user_role)))) OR (id IN ( SELECT p.business_profile_id FROM profiles p WHERE ((p.auth_user_id = auth.uid()) AND (p.business_profile_id IS NOT NULL))))));

ALTER TABLE public.announcements DROP COLUMN IF EXISTS tenant_id CASCADE;
ALTER TABLE public.notifications DROP COLUMN IF EXISTS tenant_id CASCADE;
ALTER TABLE public.payments DROP COLUMN IF EXISTS tenant_id CASCADE;
ALTER TABLE public.profiles DROP COLUMN IF EXISTS tenant_id CASCADE;
ALTER TABLE public.quote_requests DROP COLUMN IF EXISTS tenant_id CASCADE;
ALTER TABLE public.quote_signatures DROP COLUMN IF EXISTS tenant_id CASCADE;
ALTER TABLE public.quotes DROP COLUMN IF EXISTS tenant_id CASCADE;
ALTER TABLE public.service_request_comments DROP COLUMN IF EXISTS tenant_id CASCADE;
ALTER TABLE public.service_requests DROP COLUMN IF EXISTS tenant_id CASCADE;
ALTER TABLE public.service_types DROP COLUMN IF EXISTS tenant_id CASCADE;
ALTER TABLE public.units DROP COLUMN IF EXISTS tenant_id CASCADE;
