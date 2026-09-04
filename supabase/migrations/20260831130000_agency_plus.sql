-- Agency Plus: the frequent-employer subscription (blueprint phase 2).
-- £99/month buys a reduced 10% booking fee (vs 15%) and priority cover.
-- The professional keeps 100% of the agreed rate on every model.

ALTER TABLE employer_profiles ADD COLUMN IF NOT EXISTS agency_plus_active boolean DEFAULT false;
ALTER TABLE employer_profiles ADD COLUMN IF NOT EXISTS agency_plus_until timestamptz;

INSERT INTO commercial_settings(product_key,label,description,price_pence,billing_interval,is_active) VALUES
('agency_plus_monthly','Agency Plus','Monthly membership for frequent agency employers: reduced 10% booking fee, priority cover requests.',9900,'month',true)
ON CONFLICT (product_key) DO NOTHING;
