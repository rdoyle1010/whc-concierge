-- A paid brand placement in the newsletter.
--
-- WHC already sells this: the Industry Feature product is described as "Brand
-- Spotlight plus newsletter and platform feature", and Partner Campaign
-- includes email visibility. Neither had anywhere to go - the newsletter's
-- featured section could only show professionals and properties already on the
-- platform, so a product house that had paid for a slot could not be given one.
--
-- Kept on the campaign rather than in a separate table: a sponsor belongs to
-- one issue, it is written at the same time as the issue, and a placement that
-- outlives the send it was bought for is a placement nobody remembers selling.

alter table public.campaigns
  add column if not exists sponsor_name text,
  add column if not exists sponsor_logo_url text,
  add column if not exists sponsor_headline text,
  add column if not exists sponsor_text text,
  add column if not exists sponsor_url text;

comment on column public.campaigns.sponsor_name is
  'Paid brand placement for this issue. Always rendered under a Sponsored label - paid placement has to be identifiable, and blurring it spends the trust that makes the slot worth buying.';

analyze public.campaigns;
