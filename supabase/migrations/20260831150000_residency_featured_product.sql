-- Featured residency listings become a paid product (£99 / 30 days),
-- bought by the professional from their Residency page. The admin Feature
-- button remains as an explicit no-charge override for direct deals.

ALTER TABLE residency_profiles ADD COLUMN IF NOT EXISTS featured_until timestamptz;

INSERT INTO commercial_settings(product_key,label,description,price_pence,billing_interval,is_active) VALUES
('residency_featured','Featured Residency Listing','30 days at the top of the Residency marketplace with the Featured badge.',9900,'one_off',true)
ON CONFLICT (product_key) DO NOTHING;
