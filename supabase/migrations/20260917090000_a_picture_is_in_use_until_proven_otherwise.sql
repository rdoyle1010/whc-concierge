-- Which stored pictures anything still points at.
--
-- The admin Pictures screen has a "delete the unused ones" sweep. It decided
-- what was unused by reading one table, platform_config, and treating every
-- file not mentioned there as rubbish. But site-images is a shared bucket:
-- brand logos, course photographs, blog pictures, company logos, property
-- photographs and candidate portraits all live in it, and every one of those
-- is referenced from its own table. So the sweep considered nearly every
-- picture on the platform unused, and deleting them was permanent.
--
-- Enumerating the tables in TypeScript would be the same bug with a longer
-- list: the next table with an image column would be invisible again, and the
-- symptom is somebody's photographs disappearing overnight.
--
-- So the question is asked of the database, which is the only thing that knows
-- what columns exist. This walks every text, varchar and jsonb column in the
-- public schema, finds anything containing the bucket name, and returns the
-- storage paths inside. A new table with an image column is covered the day it
-- is created, without anybody remembering to add it here.

create or replace function public.referenced_storage_paths(p_bucket text)
returns setof text
language plpgsql
security definer
set search_path = public
as $$
declare
  col record;
  stmt text;
begin
  if p_bucket is null or length(trim(p_bucket)) = 0 then
    return;
  end if;

  for col in
    select c.table_name, c.column_name
    from information_schema.columns c
    join information_schema.tables t
      on t.table_schema = c.table_schema and t.table_name = c.table_name
    where c.table_schema = 'public'
      and t.table_type = 'BASE TABLE'
      and c.data_type in ('text', 'character varying', 'jsonb', 'json')
  loop
    -- Every value in the column, cast to text, scanned for anything that looks
    -- like a path inside this bucket. regexp_matches with 'g' returns one row
    -- per match, so a jsonb blob holding six pictures yields all six.
    stmt := format(
      'select m[1] from %I t, lateral regexp_matches(coalesce(t.%I::text, %L), %L, %L) as m',
      col.table_name,
      col.column_name,
      '',
      -- <bucket>/<path>, stopping at whatever ends a URL in stored text.
      replace(p_bucket, '.', '\.') || '/([^"''\\ )\?]+)',
      'g'
    );
    begin
      return query execute stmt;
    exception when others then
      -- One unreadable column must not make the whole answer empty. An empty
      -- answer here means "nothing is in use", which is the exact reading that
      -- deleted the pictures in the first place.
      raise warning 'referenced_storage_paths: skipped %.%: %', col.table_name, col.column_name, sqlerrm;
    end;
  end loop;
end;
$$;

revoke all on function public.referenced_storage_paths(text) from public, anon, authenticated;
grant execute on function public.referenced_storage_paths(text) to service_role;
