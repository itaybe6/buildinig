import { formatILS } from "./currency";

/** Parse DB decimal strings; empty / invalid → null */
function parseBound(raw: string | null | undefined): number | null {
  if (raw == null || raw === "") return null;
  const n = Number(String(raw).trim());
  return Number.isFinite(n) ? n : null;
}

export type ValidateResidentQuotePriceBounds = {
  priceMin: string | null;
  priceMax: string | null;
};

/**
 * Validates resident proposed amount against optional service price bounds.
 * If both bounds missing — only positive finite amounts allowed.
 */
export function validateResidentProposedAmount(
  proposed: number,
  bounds: ValidateResidentQuotePriceBounds
): { ok: true } | { ok: false; message: string } {
  if (!Number.isFinite(proposed) || proposed <= 0) {
    return { ok: false, message: "נא להזין מחיר חיובי." };
  }

  const min = parseBound(bounds.priceMin);
  const max = parseBound(bounds.priceMax);

  if (min != null && max != null && min > max) {
    return { ok: false, message: "טווח המחירים של השירות אינו תקין — פנה למנהל." };
  }

  if (min != null && proposed < min) {
    return {
      ok: false,
      message: `המחיר נמוך מדי. הסכום המינימלי הוא ${formatILS(min)}.`,
    };
  }
  if (max != null && proposed > max) {
    return {
      ok: false,
      message: `המחיר גבוה מדי. הסכום המקסימלי המותר הוא ${formatILS(max)}.`,
    };
  }

  return { ok: true };
}
