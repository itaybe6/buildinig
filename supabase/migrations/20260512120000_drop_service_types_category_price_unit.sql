-- Drop category and price_unit from service_types (redundant business fields).
ALTER TABLE public.service_types DROP COLUMN IF EXISTS category;
ALTER TABLE public.service_types DROP COLUMN IF EXISTS price_unit;
