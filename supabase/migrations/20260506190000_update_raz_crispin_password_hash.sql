-- bcrypt hash for Raz Crispin phone login (bcryptjs cost 10); checked in /api/auth/login.
UPDATE public.profiles
SET password_hash = '$2b$10$lL.BnpDRcM7hnmOyTP7uKuYNDRI1VE7ZL4eKrncuXCDwqca5G8ORi'
WHERE phone = '0501234567'
  AND full_name = 'רז קריספין';
