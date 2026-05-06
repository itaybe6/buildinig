-- Merge profiles.mobile_phone into profiles.phone, then drop column
UPDATE public.profiles
SET phone = COALESCE(
  NULLIF(btrim(COALESCE(mobile_phone, '')), ''),
  NULLIF(btrim(COALESCE(phone, '')), '')
);

ALTER TABLE public.profiles DROP COLUMN IF EXISTS mobile_phone;

-- Merge business_profiles.mobile_phone into contact_phone (preserve both values when distinct)
UPDATE public.business_profiles bp
SET contact_phone = CASE
  WHEN NULLIF(btrim(COALESCE(bp.contact_phone, '')), '') IS NOT NULL
    AND NULLIF(btrim(COALESCE(bp.mobile_phone, '')), '') IS NOT NULL
    AND btrim(bp.contact_phone) IS DISTINCT FROM btrim(bp.mobile_phone)
    THEN btrim(bp.contact_phone) || ' / ' || btrim(bp.mobile_phone)
  ELSE COALESCE(
    NULLIF(btrim(COALESCE(bp.contact_phone, '')), ''),
    NULLIF(btrim(COALESCE(bp.mobile_phone, '')), '')
  )
END;

ALTER TABLE public.business_profiles DROP COLUMN IF EXISTS mobile_phone;
