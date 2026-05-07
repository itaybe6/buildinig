-- דמי ועד בית חודשיים לדירה (ש״ח), נקבעים בעת יצירת בניין על ידי סופר־אדמין.
ALTER TABLE public.buildings
  ADD COLUMN IF NOT EXISTS committee_fee numeric(12, 2) NOT NULL DEFAULT 0;

COMMENT ON COLUMN public.buildings.committee_fee IS 'דמי ועד בית — סכום חודשי לדירה (ש״ח).';
