-- Manager רז קריספין had no business_profile_id; JWT sync migration cannot fill claims without it.
-- Assign to org "עוצמה ניהול" (the tenant that has buildings in this project).
UPDATE public.profiles
SET business_profile_id = '524b742c-1a2c-494a-bb91-7383a7ffd779'
WHERE full_name = 'רז קריספין'
  AND role = 'manager'
  AND business_profile_id IS NULL;
