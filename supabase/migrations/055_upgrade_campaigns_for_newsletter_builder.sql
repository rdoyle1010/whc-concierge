alter table public.campaigns add column if not exists name text;
alter table public.campaigns add column if not exists description text;
alter table public.campaigns add column if not exists type text;
alter table public.campaigns add column if not exists target_audience text;
alter table public.campaigns add column if not exists content text;
alter table public.campaigns add column if not exists preheader text;
alter table public.campaigns add column if not exists header_image_url text;
alter table public.campaigns add column if not exists body_image_url text;
alter table public.campaigns add column if not exists cta_label text;
alter table public.campaigns add column if not exists cta_url text;
alter table public.campaigns add column if not exists footer_text text;
alter table public.campaigns add column if not exists layout_style text not null default 'editorial';

alter table public.campaigns alter column brand_name drop not null;
alter table public.campaigns alter column package drop not null;
alter table public.campaigns alter column start_date drop not null;
alter table public.campaigns alter column monthly_rate drop not null;

update public.campaigns set name=coalesce(name,brand_name,'Untitled campaign') where name is null;
update public.campaigns set type=coalesce(type,'Email') where type is null;
update public.campaigns set content=coalesce(content,notes) where content is null;

do $$ begin
  if not exists (select 1 from pg_constraint where conname='campaigns_layout_style_check') then
    alter table public.campaigns add constraint campaigns_layout_style_check check (layout_style in ('editorial','feature','simple'));
  end if;
end $$;

comment on table public.campaigns is 'Admin campaigns and WHC newsletters. Legacy sponsorship columns remain nullable for backward compatibility.';
