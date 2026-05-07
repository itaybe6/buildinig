-- Per-building payment collection & reminder settings (managers only).

CREATE TABLE public.payment_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  building_id uuid NOT NULL REFERENCES public.buildings(id) ON DELETE CASCADE,
  collection_day smallint NOT NULL DEFAULT 1,
  reminder_days_before smallint NOT NULL DEFAULT 3,
  reminder_message_template text,
  unpaid_alert_enabled boolean NOT NULL DEFAULT true,
  unpaid_alert_days_after smallint,
  bank_name text,
  bank_branch text,
  bank_account_number text,
  bank_account_owner text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT payment_settings_building_id_key UNIQUE (building_id),
  CONSTRAINT payment_settings_collection_day_check CHECK (collection_day >= 1 AND collection_day <= 28),
  CONSTRAINT payment_settings_reminder_days_check CHECK (reminder_days_before >= 0),
  CONSTRAINT payment_settings_unpaid_days_check CHECK (unpaid_alert_days_after IS NULL OR unpaid_alert_days_after >= 0)
);

CREATE INDEX payment_settings_building_id_idx ON public.payment_settings (building_id);

ALTER TABLE public.payment_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "manager tenant payment_settings" ON public.payment_settings;
CREATE POLICY "manager tenant payment_settings" ON public.payment_settings
FOR ALL
USING (
  EXISTS (
    SELECT 1
    FROM public.buildings b
    WHERE b.id = payment_settings.building_id
      AND b.business_profile_id = my_tenant_id()
  )
  AND my_role() = 'manager'::user_role
)
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.buildings b
    WHERE b.id = payment_settings.building_id
      AND b.business_profile_id = my_tenant_id()
  )
  AND my_role() = 'manager'::user_role
);

COMMENT ON TABLE public.payment_settings IS 'הגדרות גביה והתראות תשלום לכל בניין.';
