-- Remove legacy tenant_id; scope by business_profile_id only.
-- Before dropping, backfill if columns still exist, e.g.:
--   UPDATE public.profiles SET business_profile_id = tenant_id WHERE business_profile_id IS NULL AND tenant_id IS NOT NULL;
--   UPDATE public.units SET business_profile_id = tenant_id WHERE business_profile_id IS NULL AND tenant_id IS NOT NULL;
-- (adjust per-table as needed)

alter table if exists public.profiles drop column if exists tenant_id;

alter table if exists public.units drop column if exists tenant_id;
alter table if exists public.service_requests drop column if exists tenant_id;
alter table if exists public.service_request_comments drop column if exists tenant_id;
alter table if exists public.announcements drop column if exists tenant_id;
alter table if exists public.payments drop column if exists tenant_id;
alter table if exists public.notifications drop column if exists tenant_id;
alter table if exists public.service_types drop column if exists tenant_id;
alter table if exists public.quote_requests drop column if exists tenant_id;
alter table if exists public.quotes drop column if exists tenant_id;
alter table if exists public.quote_signatures drop column if exists tenant_id;

drop function if exists public.my_tenant_id();
