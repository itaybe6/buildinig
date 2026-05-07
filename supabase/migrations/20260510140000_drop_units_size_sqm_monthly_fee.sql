-- Per-unit size and monthly fee removed; building-level committee_fee remains.
ALTER TABLE public.units DROP COLUMN IF EXISTS size_sqm;
ALTER TABLE public.units DROP COLUMN IF EXISTS monthly_fee;
