-- Proposed price from resident + RLS so residents can submit quote_requests safely.

ALTER TABLE public.quote_requests
  ADD COLUMN IF NOT EXISTS resident_proposed_amount numeric(14, 2);

COMMENT ON COLUMN public.quote_requests.resident_proposed_amount IS
  'Amount proposed by resident when submitting a quote request (within service price range).';

ALTER TABLE public.quote_requests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "quote_requests manager select" ON public.quote_requests;
CREATE POLICY "quote_requests manager select"
ON public.quote_requests FOR SELECT
USING (
  EXISTS (
    SELECT 1
    FROM public.buildings b
    WHERE b.id = quote_requests.building_id
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

DROP POLICY IF EXISTS "quote_requests manager update" ON public.quote_requests;
CREATE POLICY "quote_requests manager update"
ON public.quote_requests FOR UPDATE
USING (
  EXISTS (
    SELECT 1
    FROM public.buildings b
    WHERE b.id = quote_requests.building_id
      AND b.business_profile_id = my_tenant_id()
  )
  AND my_role() = ANY (
    ARRAY[
      'manager'::user_role,
      'employee'::user_role,
      'super_admin'::user_role
    ]
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.buildings b
    WHERE b.id = quote_requests.building_id
      AND b.business_profile_id = my_tenant_id()
  )
);

DROP POLICY IF EXISTS "quote_requests resident select own" ON public.quote_requests;
CREATE POLICY "quote_requests resident select own"
ON public.quote_requests FOR SELECT
USING (
  my_role() = 'resident'::user_role
  AND requested_by = my_profile_id()
  AND EXISTS (
    SELECT 1
    FROM public.buildings b
    WHERE b.id = quote_requests.building_id
      AND b.business_profile_id = my_tenant_id()
  )
);

DROP POLICY IF EXISTS "quote_requests resident insert own unit" ON public.quote_requests;
CREATE POLICY "quote_requests resident insert own unit"
ON public.quote_requests FOR INSERT
WITH CHECK (
  my_role() = 'resident'::user_role
  AND requested_by = my_profile_id()
  AND business_profile_id = my_tenant_id()
  AND EXISTS (
    SELECT 1
    FROM public.units u
    WHERE u.id = quote_requests.unit_id
      AND u.building_id = quote_requests.building_id
      AND u.resident_profile_id = my_profile_id()
  )
  AND EXISTS (
    SELECT 1
    FROM public.buildings b
    WHERE b.id = quote_requests.building_id
      AND b.business_profile_id = my_tenant_id()
  )
  AND (
    quote_requests.service_type_id IS NULL
    OR EXISTS (
      SELECT 1
      FROM public.service_types st
      WHERE st.id = quote_requests.service_type_id
        AND st.business_profile_id = quote_requests.business_profile_id
    )
  )
);
