-- Dropped from remote when applied; image for buildings is not used.
ALTER TABLE public.buildings
  DROP COLUMN IF EXISTS image_url;
