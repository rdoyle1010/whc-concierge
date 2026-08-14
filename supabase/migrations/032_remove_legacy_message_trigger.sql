-- 032: Remove the final trigger from the retired message_threads design.
--
-- Migration 023 removed message_threads after the application moved to the
-- direct sender_id/recipient_id messages model. The live database retained
-- this trigger because its PL/pgSQL function dependency was not removed by
-- DROP TABLE ... CASCADE. Every new message therefore failed while trying
-- to update a table that no longer exists.

BEGIN;

DROP TRIGGER IF EXISTS on_message_sent ON public.messages;

COMMIT;
