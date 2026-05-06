-- התחברות לפי טלפון + סיסמה בטבלה profiles (bcrypt). הסשן בדפדפן נשמר דרך Supabase JWT אחרי אימות בשרת.

CREATE EXTENSION IF NOT EXISTS pgcrypto;

ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS password_hash text;

COMMENT ON COLUMN public.profiles.password_hash IS 'bcrypt — אימות סיסמה מקומי';

CREATE UNIQUE INDEX IF NOT EXISTS profiles_phone_login_unique
ON public.profiles (phone)
WHERE phone IS NOT NULL;
