/** מחזיר מספר בפורמט E.164 (+972…) או null אם הקלט לא נראה כמו טלפון ישראלי תקין */
export function normalizeIsraelPhoneToE164(input: string): string | null {
  const digits = input.trim().replace(/\D/g, "");
  if (digits.length < 9 || digits.length > 12) return null;

  if (digits.startsWith("972")) {
    const rest = digits.slice(3);
    if (rest.length === 9 && rest.startsWith("5")) return `+972${rest}`;
    return null;
  }

  if (digits.startsWith("0") && digits.length === 10 && digits[1] === "5") {
    return `+972${digits.slice(1)}`;
  }

  if (digits.length === 9 && digits.startsWith("5")) {
    return `+972${digits}`;
  }

  return null;
}

/** פורמט אחיד לשדה profiles.phone — 05xxxxxxxx */
export function normalizeIsraelPhoneLocalDigits(input: string): string | null {
  const e164 = normalizeIsraelPhoneToE164(input);
  if (!e164) return null;
  const d = e164.replace(/\D/g, "");
  if (!d.startsWith("972") || d.length !== 12) return null;
  const national = d.slice(3);
  if (national.length !== 9 || national[0] !== "5") return null;
  return `0${national}`;
}
