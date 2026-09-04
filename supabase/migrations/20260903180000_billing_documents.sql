-- Purchase order references, so a property's finance team can file what it buys.
--
-- Hotels above a certain spend do not pay an invoice that carries no purchase
-- order - their accounts payable system rejects it and the payment sits in a
-- queue nobody is watching. The PO is issued by the property, not by us, so
-- the only sensible place for it is the property's own billing settings:
-- entered once, attached to everything they buy afterwards, printed on every
-- receipt.
--
-- It deliberately does not gate anything. A property that does not use POs
-- leaves it blank and never sees the field again.

alter table public.employer_profiles
  -- The reference the property's own system issued for spend with WHC.
  add column if not exists purchase_order_ref text,
  -- Where documents should go. Accounts payable is rarely the person who
  -- signed up, and a receipt sent to the spa manager's inbox is a receipt
  -- that never reaches finance.
  add column if not exists billing_email text,
  add column if not exists billing_address text;

comment on column public.employer_profiles.purchase_order_ref is
  'Purchase order reference issued by the property. Printed on receipts so their finance team can file the spend.';
comment on column public.employer_profiles.billing_email is
  'Accounts payable contact. Documents and payment queries go here, not to the signup address.';

analyze public.employer_profiles;
