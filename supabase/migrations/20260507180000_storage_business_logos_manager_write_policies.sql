-- business-logos: allow authenticated writes (was read-only → upload failed with RLS).
-- Client uploads to path {business_profile_id}/... (see BusinessLogoUpload).

create policy "business_logos_manager_insert"
  on storage.objects
  for insert
  to authenticated
  with check (
    bucket_id = 'business-logos'
    and public.my_role() = 'manager'::public.user_role
    and public.my_tenant_id() is not null
    and (storage.foldername(name))[1] = public.my_tenant_id()::text
  );

create policy "business_logos_manager_update"
  on storage.objects
  for update
  to authenticated
  using (
    bucket_id = 'business-logos'
    and public.my_role() = 'manager'::public.user_role
    and public.my_tenant_id() is not null
    and (storage.foldername(name))[1] = public.my_tenant_id()::text
  )
  with check (
    bucket_id = 'business-logos'
    and public.my_role() = 'manager'::public.user_role
    and public.my_tenant_id() is not null
    and (storage.foldername(name))[1] = public.my_tenant_id()::text
  );

create policy "business_logos_manager_delete"
  on storage.objects
  for delete
  to authenticated
  using (
    bucket_id = 'business-logos'
    and public.my_role() = 'manager'::public.user_role
    and public.my_tenant_id() is not null
    and (storage.foldername(name))[1] = public.my_tenant_id()::text
  );

create policy "business_logos_super_admin_insert"
  on storage.objects
  for insert
  to authenticated
  with check (
    bucket_id = 'business-logos'
    and public.my_role() = 'super_admin'::public.user_role
  );

create policy "business_logos_super_admin_update"
  on storage.objects
  for update
  to authenticated
  using (
    bucket_id = 'business-logos'
    and public.my_role() = 'super_admin'::public.user_role
  )
  with check (
    bucket_id = 'business-logos'
    and public.my_role() = 'super_admin'::public.user_role
  );

create policy "business_logos_super_admin_delete"
  on storage.objects
  for delete
  to authenticated
  using (
    bucket_id = 'business-logos'
    and public.my_role() = 'super_admin'::public.user_role
  );
