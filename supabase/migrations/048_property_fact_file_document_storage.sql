-- Private document storage for Property Fact File attachments.
-- Employers manage documents under their employer id folder.
-- Confirmed candidates can read only document paths captured in their booking snapshot.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'property-fact-documents',
  'property-fact-documents',
  false,
  10485760,
  array['application/pdf','image/jpeg','image/png','image/webp','application/vnd.openxmlformats-officedocument.wordprocessingml.document']
)
on conflict (id) do update set
  public = false,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists property_fact_docs_employer_select on storage.objects;
create policy property_fact_docs_employer_select on storage.objects for select to authenticated using (
  bucket_id = 'property-fact-documents'
  and exists (
    select 1 from public.employer_profiles e
    where e.user_id = auth.uid()
      and split_part(storage.objects.name, '/', 1) = e.id::text
  )
);

drop policy if exists property_fact_docs_employer_insert on storage.objects;
create policy property_fact_docs_employer_insert on storage.objects for insert to authenticated with check (
  bucket_id = 'property-fact-documents'
  and exists (
    select 1 from public.employer_profiles e
    where e.user_id = auth.uid()
      and split_part(storage.objects.name, '/', 1) = e.id::text
  )
);

drop policy if exists property_fact_docs_employer_update on storage.objects;
create policy property_fact_docs_employer_update on storage.objects for update to authenticated using (
  bucket_id = 'property-fact-documents'
  and exists (
    select 1 from public.employer_profiles e
    where e.user_id = auth.uid()
      and split_part(storage.objects.name, '/', 1) = e.id::text
  )
) with check (
  bucket_id = 'property-fact-documents'
  and exists (
    select 1 from public.employer_profiles e
    where e.user_id = auth.uid()
      and split_part(storage.objects.name, '/', 1) = e.id::text
  )
);

drop policy if exists property_fact_docs_employer_delete on storage.objects;
create policy property_fact_docs_employer_delete on storage.objects for delete to authenticated using (
  bucket_id = 'property-fact-documents'
  and exists (
    select 1 from public.employer_profiles e
    where e.user_id = auth.uid()
      and split_part(storage.objects.name, '/', 1) = e.id::text
  )
);

drop policy if exists property_fact_docs_candidate_select on storage.objects;
create policy property_fact_docs_candidate_select on storage.objects for select to authenticated using (
  bucket_id = 'property-fact-documents'
  and exists (
    select 1
    from public.booking_arrival_packs bap
    join public.candidate_profiles c on c.id = bap.candidate_id
    cross join lateral jsonb_array_elements(coalesce(bap.snapshot->'documents', '[]'::jsonb)) d
    where c.user_id = auth.uid()
      and d->>'path' = storage.objects.name
  )
);
