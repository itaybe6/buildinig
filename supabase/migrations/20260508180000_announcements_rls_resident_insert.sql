-- Split announcements RLS: read for all tenant members; write for managers;
-- residents may INSERT only for buildings where they are listed on a unit, as themselves.

DROP POLICY IF EXISTS "tenant isolation" ON public.announcements;

CREATE POLICY "announcements tenant select" ON public.announcements
FOR SELECT
USING (
  EXISTS (
    SELECT 1
    FROM public.buildings b
    WHERE b.id = announcements.building_id
      AND b.business_profile_id = my_tenant_id()
  )
);

CREATE POLICY "announcements manager write" ON public.announcements
FOR ALL
USING (
  EXISTS (
    SELECT 1
    FROM public.buildings b
    WHERE b.id = announcements.building_id
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
    WHERE b.id = announcements.building_id
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

CREATE POLICY "announcements resident insert own building" ON public.announcements
FOR INSERT
WITH CHECK (
  my_role() = 'resident'::user_role
  AND created_by = my_profile_id()
  AND EXISTS (
    SELECT 1
    FROM public.units u
    WHERE u.building_id = announcements.building_id
      AND u.resident_profile_id = my_profile_id()
  )
);
