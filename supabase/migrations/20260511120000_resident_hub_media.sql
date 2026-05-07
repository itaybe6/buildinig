-- Media attachments (videos) + Storage bucket for resident hub uploads +
-- Residents may SELECT all service requests for buildings where they hold a unit.

ALTER TABLE public.announcements
  ADD COLUMN IF NOT EXISTS video_urls text[] DEFAULT '{}'::text[];

ALTER TABLE public.service_requests
  ADD COLUMN IF NOT EXISTS video_urls text[] DEFAULT '{}'::text[];

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'resident-hub-media',
  'resident-hub-media',
  true,
  52428800,
  ARRAY[
    'image/jpeg',
    'image/png',
    'image/webp',
    'video/mp4',
    'video/quicktime',
    'video/webm'
  ]
)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "resident hub media tenant read" ON storage.objects;
CREATE POLICY "resident hub media tenant read"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'resident-hub-media'
  AND split_part(name, '/', 1) = my_tenant_id()::text
);

DROP POLICY IF EXISTS "resident hub media tenant upload" ON storage.objects;
CREATE POLICY "resident hub media tenant upload"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'resident-hub-media'
  AND split_part(name, '/', 1) = my_tenant_id()::text
  AND EXISTS (
    SELECT 1
    FROM public.buildings b
    WHERE b.id::text = split_part(name, '/', 2)
      AND b.business_profile_id = my_tenant_id()
      AND (
        my_role() = ANY (
          ARRAY[
            'manager'::user_role,
            'employee'::user_role,
            'super_admin'::user_role
          ]
        )
        OR (
          my_role() = 'resident'::user_role
          AND EXISTS (
            SELECT 1
            FROM public.units u
            WHERE u.building_id = b.id
              AND u.resident_profile_id = my_profile_id()
          )
        )
      )
  )
);

DROP POLICY IF EXISTS "resident sees building service requests" ON public.service_requests;
CREATE POLICY "resident sees building service requests"
ON public.service_requests
FOR SELECT
USING (
  my_role() = 'resident'::user_role
  AND EXISTS (
    SELECT 1
    FROM public.buildings b
    WHERE b.id = service_requests.building_id
      AND b.business_profile_id = my_tenant_id()
  )
  AND EXISTS (
    SELECT 1
    FROM public.units u
    WHERE u.building_id = service_requests.building_id
      AND u.resident_profile_id = my_profile_id()
  )
);
