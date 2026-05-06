-- אודות העסק — טקסט ציבורי שניתן לעריכה על ידי המנהל (ווב / מובייל).
alter table public.business_profiles
  add column if not exists about text;

comment on column public.business_profiles.about is
  'Public-facing business description / about text editable by manager.';
