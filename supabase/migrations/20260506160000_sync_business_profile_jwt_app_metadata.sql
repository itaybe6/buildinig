-- Keep tenant scope on the Auth JWT: mirror profiles.business_profile_id into
-- auth.users.raw_app_meta_data so clients receive it in user.app_metadata on each session.

CREATE OR REPLACE FUNCTION public.sync_profile_business_to_auth_app_metadata()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  uid uuid;
  biz uuid;
BEGIN
  IF TG_OP = 'DELETE' THEN
    uid := OLD.auth_user_id;
    IF uid IS NOT NULL THEN
      UPDATE auth.users
      SET raw_app_meta_data = COALESCE(raw_app_meta_data, '{}'::jsonb) - 'business_profile_id'
      WHERE id = uid;
    END IF;
    RETURN OLD;
  END IF;

  uid := NEW.auth_user_id;
  biz := NEW.business_profile_id;

  IF uid IS NULL THEN
    RETURN NEW;
  END IF;

  UPDATE auth.users
  SET raw_app_meta_data =
    CASE
      WHEN biz IS NULL THEN
        COALESCE(raw_app_meta_data, '{}'::jsonb) - 'business_profile_id'
      ELSE
        COALESCE(raw_app_meta_data, '{}'::jsonb)
          || jsonb_build_object('business_profile_id', biz::text)
    END
  WHERE id = uid;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS sync_profile_business_to_auth_app_metadata ON public.profiles;

CREATE TRIGGER sync_profile_business_to_auth_app_metadata
  AFTER INSERT OR DELETE OR UPDATE OF business_profile_id, auth_user_id
  ON public.profiles
  FOR EACH ROW
  EXECUTE PROCEDURE public.sync_profile_business_to_auth_app_metadata();

-- One-time: existing users get the claim on next login refresh; app also reads DB row.
UPDATE auth.users AS u
SET raw_app_meta_data =
  COALESCE(u.raw_app_meta_data, '{}'::jsonb)
  || jsonb_build_object('business_profile_id', p.business_profile_id::text)
FROM public.profiles AS p
WHERE p.auth_user_id = u.id
  AND p.business_profile_id IS NOT NULL;
