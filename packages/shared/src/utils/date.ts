import { format } from "date-fns";
import { he } from "date-fns/locale/he";

export function formatHebrewDate(
  input: Date | string | number,
  pattern = "d בMMMM yyyy"
): string {
  const d = input instanceof Date ? input : new Date(input);
  if (Number.isNaN(d.getTime())) return "";
  return format(d, pattern, { locale: he });
}

export function formatHebrewDateTime(input: Date | string | number): string {
  const d = input instanceof Date ? input : new Date(input);
  if (Number.isNaN(d.getTime())) return "";
  return format(d, "d בMMMM yyyy HH:mm", { locale: he });
}
