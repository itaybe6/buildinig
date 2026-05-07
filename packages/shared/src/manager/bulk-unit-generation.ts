/** מגבלת בטיחות לכמות דירות בפעולת הוספה מהירה אחת */
export const BULK_ADD_UNITS_MAX = 400;

export type BulkGeneratedUnitRow = {
  unit_number: string;
  floor_number: number;
};

/**
 * יוצר רשימת דירות לפי טווח קומות (כולל) × דירות לקומה.
 * מספר דירה: `קומה-מספר` עם ריפוד לפי הספרה האחרונה בטווח (למשל 2-05 … 2-08).
 * `apartmentStartIndex` — מספר הדירה הראשון בכל קומה (ברירת מחדל 1).
 */
export function bulkGenerateUnitRows(params: {
  floorFrom: number;
  floorTo: number;
  unitsPerFloor: number;
  /** מספר דירה ראשון בכל קומה (ברירת מחדל 1) */
  apartmentStartIndex?: number;
}): BulkGeneratedUnitRow[] {
  const start = params.apartmentStartIndex ?? 1;
  const end = start + params.unitsPerFloor - 1;
  const padWidth = Math.max(2, String(end).length);
  const rows: BulkGeneratedUnitRow[] = [];
  const { floorFrom: from, floorTo: to } = params;
  for (let f = from; f <= to; f++) {
    for (let a = start; a <= end; a++) {
      rows.push({
        unit_number: `${f}-${String(a).padStart(padWidth, "0")}`,
        floor_number: f,
      });
    }
  }
  return rows;
}

export type BulkGenerationPreview = {
  floorFrom: number;
  floorTo: number;
  /** מספר הדירה (סיומת) הראשון והאחרון בכל קומה */
  apartmentSuffixFrom: number;
  apartmentSuffixTo: number;
  /** לדוגמה: המספר הקטן והגדול ביותר שייווצרו */
  firstUnitNumber: string;
  lastUnitNumber: string;
};

export type ValidateAndGenerateBulkUnitsResult =
  | {
      ok: true;
      rows: BulkGeneratedUnitRow[];
      total: number;
      preview: BulkGenerationPreview;
    }
  | { ok: false; error: string };

export function validateAndGenerateBulkUnits(params: {
  floorFrom: number;
  floorTo: number;
  unitsPerFloor: number;
  /** מספר דירה ראשון בכל קומה (ברירת מחדל 1) */
  apartmentStartIndex?: number;
}): ValidateAndGenerateBulkUnitsResult {
  const ff = Math.floor(Number(params.floorFrom));
  const ft = Math.floor(Number(params.floorTo));
  const upf = Math.floor(Number(params.unitsPerFloor));
  const aptStart =
    params.apartmentStartIndex === undefined || params.apartmentStartIndex === null
      ? 1
      : Math.floor(Number(params.apartmentStartIndex));

  if (!Number.isFinite(ff) || ff < 0) {
    return {
      ok: false,
      error: "«מקומה» חייב להיות מספר תקין (0 ומעלה).",
    };
  }
  if (!Number.isFinite(ft) || ft < 0) {
    return {
      ok: false,
      error: "«עד קומה» חייב להיות מספר תקין (0 ומעלה).",
    };
  }
  if (ft < ff) {
    return {
      ok: false,
      error: "«עד קומה» חייב להיות גדול או שווה ל«מקומה».",
    };
  }
  if (!Number.isFinite(upf) || upf < 1) {
    return {
      ok: false,
      error: "מספר דירות לכל קומה חייב להיות שלם של לפחות 1.",
    };
  }
  if (!Number.isFinite(aptStart) || aptStart < 1) {
    return {
      ok: false,
      error: "«מספר דירה ראשון» בכל קומה חייב להיות שלם של לפחות 1.",
    };
  }

  const floorSpan = ft - ff + 1;
  const total = floorSpan * upf;
  if (total > BULK_ADD_UNITS_MAX) {
    return {
      ok: false,
      error: `חריגה מהמגבלה: עד ${BULK_ADD_UNITS_MAX} דירות בפעולה אחת (ניסיון ליצור ${total}).`,
    };
  }

  const rows = bulkGenerateUnitRows({
    floorFrom: ff,
    floorTo: ft,
    unitsPerFloor: upf,
    apartmentStartIndex: aptStart,
  });

  const aptEnd = aptStart + upf - 1;
  const preview: BulkGenerationPreview = {
    floorFrom: ff,
    floorTo: ft,
    apartmentSuffixFrom: aptStart,
    apartmentSuffixTo: aptEnd,
    firstUnitNumber: rows[0]?.unit_number ?? "",
    lastUnitNumber: rows[rows.length - 1]?.unit_number ?? "",
  };

  return { ok: true, rows, total, preview };
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
