-- Right to work by share code, languages with fluency, and a language tag on
-- the CV.
--
-- Why share codes. Storing an uploaded document and marking it "verified" is
-- not a right-to-work check and gives no statutory excuse: it records that
-- somebody sent a file. The Home Office online service is one of the three
-- methods that does count, and it is the right one for a platform - the
-- professional generates a share code, the checker views the result on gov.uk,
-- and what gets stored is the code, the date, who looked and what came back.
--
-- It is also less liability. Immigration documents are about the most
-- sensitive thing a spa platform could hold, and this stops holding them.
--
-- Why languages rather than nationality. Nationality is a protected
-- characteristic; putting it on a profile employers browse builds a
-- discrimination route into the product. Languages spoken is the question a
-- property actually needs answered, it is lawful to filter on, and in luxury
-- spa it is a genuine occupational requirement.

alter table public.candidate_profiles
  -- The nine-character code the professional generates at gov.uk/prove-right-to-work.
  add column if not exists right_to_work_share_code text,
  -- Needed to view the result; the checker enters it alongside the code.
  add column if not exists right_to_work_dob date,
  -- What the Home Office page actually said, in the checker's words, and who
  -- looked. This is the audit trail a statutory excuse rests on.
  add column if not exists right_to_work_check_outcome text,
  add column if not exists right_to_work_checked_by uuid references auth.users(id) on delete set null,
  -- British and Irish passport holders are checked another way; recording which
  -- method was used matters when somebody asks how a person was cleared.
  add column if not exists right_to_work_method text,
  -- The language a CV is written in. A therapist trained in Italy with a good
  -- CV in Italian should read as international experience, not poor English.
  add column if not exists cv_language text,
  -- Languages spoken, each with a fluency level:
  --   [{"code":"fr","label":"French","fluency":"fluent"}]
  -- The plain languages text[] column stays where it is: it was added long ago,
  -- never wired to anything, and dropping a column is not worth the risk for
  -- tidiness.
  add column if not exists language_skills jsonb not null default '[]'::jsonb;

comment on column public.candidate_profiles.right_to_work_share_code is
  'Home Office share code. The check is performed at gov.uk; this records which code was checked, not evidence in itself.';
comment on column public.candidate_profiles.right_to_work_method is
  'How right to work was established: share_code, passport (British/Irish), or idsp.';
comment on column public.candidate_profiles.language_skills is
  'Languages spoken with fluency. Never nationality - that is a protected characteristic and not a hiring criterion.';

-- Properties filter on language, so it needs an index that suits containment
-- rather than a scan of every profile.
create index if not exists idx_candidate_language_skills
  on public.candidate_profiles using gin (language_skills);

-- A share code is nine characters, and a typo is worth catching at the door
-- rather than at the Home Office page.
alter table public.candidate_profiles
  drop constraint if exists candidate_share_code_shape;
alter table public.candidate_profiles
  add constraint candidate_share_code_shape
  check (
    right_to_work_share_code is null
    or right_to_work_share_code ~ '^[A-Za-z0-9]{9}$'
  );

analyze public.candidate_profiles;
