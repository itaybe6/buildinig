-- Push device tokens (Expo) + in-app notifications for new resident service requests.

CREATE TABLE IF NOT EXISTS public.push_tokens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  expo_push_token text NOT NULL,
  platform text NOT NULL CHECK (platform IN ('ios', 'android')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (profile_id, expo_push_token)
);

CREATE INDEX IF NOT EXISTS push_tokens_profile_id_idx ON public.push_tokens (profile_id);

ALTER TABLE public.push_tokens ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "push_tokens_isolation" ON public.push_tokens;
CREATE POLICY "push_tokens_isolation" ON public.push_tokens
FOR ALL
USING (profile_id = my_profile_id())
WITH CHECK (profile_id = my_profile_id());

CREATE TABLE IF NOT EXISTS public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_profile_id uuid REFERENCES public.business_profiles(id) ON DELETE SET NULL,
  profile_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  type text NOT NULL,
  title text NOT NULL,
  body text,
  is_read boolean DEFAULT false,
  ref_id text,
  ref_table text,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS notifications_profile_unread_idx
  ON public.notifications (profile_id)
  WHERE COALESCE(is_read, false) = false;

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "notifications_select_own" ON public.notifications;
DROP POLICY IF EXISTS "notifications_update_own" ON public.notifications;

CREATE POLICY "notifications_select_own" ON public.notifications
FOR SELECT
USING (profile_id = my_profile_id());

CREATE POLICY "notifications_update_own" ON public.notifications
FOR UPDATE
USING (profile_id = my_profile_id())
WITH CHECK (profile_id = my_profile_id());

CREATE OR REPLACE FUNCTION public.notify_managers_on_service_request()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  bp_id uuid;
  reporter_role user_role;
BEGIN
  SELECT b.business_profile_id INTO bp_id
  FROM public.buildings b
  WHERE b.id = NEW.building_id;

  IF bp_id IS NULL THEN
    RETURN NEW;
  END IF;

  SELECT role INTO reporter_role
  FROM public.profiles
  WHERE id = NEW.reported_by;

  IF reporter_role IS DISTINCT FROM 'resident'::user_role THEN
    RETURN NEW;
  END IF;

  INSERT INTO public.notifications (
    business_profile_id,
    profile_id,
    type,
    title,
    body,
    is_read,
    ref_id,
    ref_table
  )
  SELECT
    bp_id,
    p.id,
    'service_request_new',
    'קריאת שירות חדשה',
    LEFT(BTRIM(COALESCE(NEW.title, '')), 500),
    false,
    NEW.id::text,
    'service_requests'
  FROM public.profiles p
  WHERE p.business_profile_id = bp_id
    AND p.role = 'manager'::user_role
    AND COALESCE(p.is_active, true);

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS tr_notify_managers_service_request ON public.service_requests;
CREATE TRIGGER tr_notify_managers_service_request
  AFTER INSERT ON public.service_requests
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_managers_on_service_request();

-- Realtime for unread badges (mobile): Dashboard → Database → Replication → enable `notifications`, or run:
-- ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
