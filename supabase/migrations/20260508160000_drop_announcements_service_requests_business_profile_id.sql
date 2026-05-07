-- Tenant scope for these tables is via buildings.business_profile_id (FK building_id).

DROP POLICY IF EXISTS "tenant isolation" ON public.announcements;

DROP POLICY IF EXISTS "manager can update request" ON public.service_requests;
DROP POLICY IF EXISTS "manager sees all requests" ON public.service_requests;
DROP POLICY IF EXISTS "resident can insert request" ON public.service_requests;
DROP POLICY IF EXISTS "resident sees own requests" ON public.service_requests;

ALTER TABLE public.announcements DROP COLUMN IF EXISTS business_profile_id;
ALTER TABLE public.service_requests DROP COLUMN IF EXISTS business_profile_id;

CREATE POLICY "tenant isolation" ON public.announcements
FOR ALL
USING (
  EXISTS (
    SELECT 1
    FROM public.buildings b
    WHERE b.id = announcements.building_id
      AND b.business_profile_id = my_tenant_id()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.buildings b
    WHERE b.id = announcements.building_id
      AND b.business_profile_id = my_tenant_id()
  )
);

CREATE POLICY "manager sees all requests" ON public.service_requests
FOR SELECT
USING (
  EXISTS (
    SELECT 1
    FROM public.buildings b
    WHERE b.id = service_requests.building_id
      AND b.business_profile_id = my_tenant_id()
  )
  AND my_role() = ANY (
    ARRAY[
      'manager'::user_role,
      'employee'::user_role,
      'super_admin'::user_role
    ]
  )
);

CREATE POLICY "manager can update request" ON public.service_requests
FOR UPDATE
USING (
  EXISTS (
    SELECT 1
    FROM public.buildings b
    WHERE b.id = service_requests.building_id
      AND b.business_profile_id = my_tenant_id()
  )
  AND my_role() = ANY (
    ARRAY[
      'manager'::user_role,
      'employee'::user_role,
      'super_admin'::user_role
    ]
  )
);

CREATE POLICY "resident sees own requests" ON public.service_requests
FOR SELECT
USING (
  EXISTS (
    SELECT 1
    FROM public.buildings b
    WHERE b.id = service_requests.building_id
      AND b.business_profile_id = my_tenant_id()
  )
  AND reported_by = my_profile_id()
);

CREATE POLICY "resident can insert request" ON public.service_requests
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.buildings b
    WHERE b.id = service_requests.building_id
      AND b.business_profile_id = my_tenant_id()
  )
);
