-- A file sold on its own, not only as part of a pack.
--
-- An editable audit toolkit is a product. It tells a spa director where they
-- are losing money, it is the natural first purchase for somebody not ready
-- to buy a document library, and folding it into one department pack is the
-- least valuable thing that can be done with it.
--
-- Two columns. A price, which being null means the file travels with packs
-- and is not sold separately, and a slug, which is what a checkout and an
-- order refer to. The slug goes in the same namespace as pack slugs on
-- purpose: an order already carries pack_slug, and entitlement already
-- resolves a buyer's slugs to the files they can download, so a file sold on
-- its own needs no new plumbing at either end.

alter table public.standards_attachments
  add column if not exists slug text,
  add column if not exists price_pence integer;

-- Null slugs do not collide, so a file that is never sold on its own needs no
-- slug at all.
create unique index if not exists standards_attachments_slug_idx
  on public.standards_attachments(slug)
  where slug is not null;

alter table public.standards_attachments
  drop constraint if exists standards_attachments_price_sane;
alter table public.standards_attachments
  add constraint standards_attachments_price_sane
  check (price_pence is null or price_pence between 100 and 500000);

-- A price with nothing to buy is a buy button that 404s.
alter table public.standards_attachments
  drop constraint if exists standards_attachments_priced_has_slug;
alter table public.standards_attachments
  add constraint standards_attachments_priced_has_slug
  check (price_pence is null or slug is not null);

comment on column public.standards_attachments.price_pence is
  'Set to sell this file on its own. Null means it travels with its packs only.';
comment on column public.standards_attachments.slug is
  'What a checkout and an order refer to. Shares the namespace with pack slugs.';
