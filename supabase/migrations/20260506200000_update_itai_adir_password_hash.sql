-- bcrypt (bcryptjs cost 10) for phone+password login via profiles.password_hash
UPDATE public.profiles
SET password_hash = '$2b$10$lPYEBgBIkaaqZPmiBPnHrOdNN1g/JeOx/QmPSmifmoxejwfsvK5SO'
WHERE id IN (
  'd52e1714-fbc8-4a30-b2b9-0e9275c074dc',
  'e021df79-4c9c-4ca3-a7bb-31b3ba5a6766'
);
