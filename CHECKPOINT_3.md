# WHC Concierge - Checkpoint 3

This checkpoint records the database repair confirmed during the two-way
messaging test on 14 August 2026.

## Messaging repair

- Removes the orphaned `on_message_sent` trigger from `public.messages`.
- The trigger belonged to the retired `message_threads` design and caused
  every new message to fail after that table was removed.
- No users, applications, matches or messages are deleted.
- Employer-to-talent and talent-to-employer messages were both tested
  successfully in the Netlify deploy preview.

## Supabase

The repair was applied manually to the test Supabase project and is recorded
as migration `032_remove_legacy_message_trigger.sql` so the repository and
database history remain aligned.
