/** מגבלת בטיחות לכמות דירות בפעולת הוספה מהירה אחת */
export const BULK_ADD_UNITS_MAX = 400;

export type BulkGeneratedUnitRow = {
  unit_number: string;
  floor_number: number;
};

function padAptIndex(n: number, unitsPerFloor: number): string {
  const width = Math.max(2, String(unitsPerFloor).length);
  return String(n).padStart(width, "0");
}

/**
 * יוצר רשימת דירות לפי רשת קומות × דירות לקומה.
 * מספר דירה: `קומה-מספר` עם ריפוד (למשל 2-01 … 2-04).
 */
export function bulkGenerateUnitRows(params: {
  floorCount: number;
  unitsPerFloor: number;
  /** ברירת מחדל 1 */
  startFloor?: number;
}): BulkGeneratedUnitRow[] {
  const startFloor = params.startFloor ?? 1;
  const rows: BulkGeneratedUnitRow[] = [];
  for (let f = startFloor; f < startFloor + params.floorCount; f++) {
    for (let a = 1; a <= params.unitsPerFloor; a++) {
      rows.push({
        unit_number: `${f}-${padAptIndex(a, params.unitsPerFloor)}`,
        floor_number: f,
      });
    }
  }
  return rows;
}

export type ValidateAndGenerateBulkUnitsResult =
  | { ok: true; rows: BulkGeneratedUnitRow[]; total: number }
  | { ok: false; error: string };

export function validateAndGenerateBulkUnits(params: {
  floorCount: number;
  unitsPerFloor: number;
  startFloor?: number;
}): ValidateAndGenerateBulkUnitsResult {
  const fc = Math.floor(Number(params.floorCount));
  const upf = Math.floor(Number(params.unitsPerFloor));
  const sf =
    params.startFloor === undefined || params.startFloor === null
      ? 1
      : Math.floor(Number(params.startFloor));

  if (!Number.isFinite(fc) || fc < 1) {
    return { ok: false, error: "מספר קומות חייב להיות שלם של לפחות 1." };
  }
  if (!Number.isFinite(upf) || upf < 1) {
    return {
      ok: false,
      error: "מספר דירות לכל קומה חייב להיות שלם של לפחות 1.",
    };
  }
  if (!Number.isFinite(sf) || sf < 0) {
    return {
      ok: false,
      error: "קומת התחלה חייבת להיות מספר תקין (0 ומעלה).",
    };
  }

  const total = fc * upf;
  if (total > BULK_ADD_UNITS_MAX) {
    return {
      ok: false,
      error: `חריגה מהמגבלה: עד ${BULK_ADD_UNITS_MAX} דירות בפעולה אחת (ניסיון ליצור ${total}).`,
    };
  }

  const rows = bulkGenerateUnitRows({
    floorCount: fc,
    unitsPerFloor: upf,
    startFloor: sf,
  });
  return { ok: true, rows, total };
}

function normUnitNumber(s: string): string {
  return s.trim();
}

/**
 * כפילויות בתוך הרשימה המיוצרת, והתאמות למספרי דירה שכבר קיימים בבניין.
 */
export function analyzeBulkUnitNumberIssues(
  generated: BulkGeneratedUnitRow[],
  existingUnitNumbers: string[],
): {
  internalDuplicates: string[];
  conflictsWithExisting: string[];
} {
  const counts = new Map<string, number>();
  for (const r of generated) {
    const k = normUnitNumber(r.unit_number);
    counts.set(k, (counts.get(k) ?? 0) + 1);
  }
  const internalDuplicates = Array.from(counts.entries())
    .filter(([, c]) => c > 1)
    .map(([k]) => k);

  const existingSet = new Set(
    existingUnitNumbers.map((u) => normUnitNumber(u)).filter((u) => u.length > 0),
  );
  const conflictSet = new Set<string>();
  for (const r of generated) {
    const k = normUnitNumber(r.unit_number);
    if (k.length > 0 && existingSet.has(k)) {
      conflictSet.add(k);
    }
  }
  const conflictsWithExisting = Array.from(conflictSet).sort((a, b) =>
    a.localeCompare(b, undefined, { numeric: true, sensitivity: "base" }),
  );

  return { internalDuplicates, conflictsWithExisting };
}
