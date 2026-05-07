"use client";

import { addBuildingUnitsSuperAdminAction } from "@/app/(dashboard)/super-admin/building-units-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  analyzeBulkUnitNumberIssues,
  validateAndGenerateBulkUnits,
} from "@my-project/shared";
import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";

type RowDraft = { unit_number: string; floor: string };

type AddMode = "manual" | "quick";

export function SuperAdminAddBuildingUnitsPanel({
  tenantId,
  buildingId,
  existingUnitNumbers,
  suggestedFloorCount,
}: {
  tenantId: string;
  buildingId: string;
  existingUnitNumbers: string[];
  suggestedFloorCount?: number | null;
}) {
  const router = useRouter();
  const [addMode, setAddMode] = useState<AddMode>("manual");
  const [bulkFloorFrom, setBulkFloorFrom] = useState("1");
  const [bulkFloorTo, setBulkFloorTo] = useState(() =>
    suggestedFloorCount != null && suggestedFloorCount > 0
      ? String(suggestedFloorCount)
      : ""
  );
  const [bulkUnitsPerFloor, setBulkUnitsPerFloor] = useState("2");
  const [bulkAptStart, setBulkAptStart] = useState("1");
  const [rows, setRows] = useState<RowDraft[]>([
    { unit_number: "", floor: "" },
  ]);
  const [addError, setAddError] = useState<string | null>(null);
  const [addPending, addTransition] = useTransition();

  const bulkValidated = useMemo(() => {
    if (addMode !== "quick") return null;
    const ff = Number.parseInt(bulkFloorFrom, 10);
    const ft = Number.parseInt(bulkFloorTo, 10);
    const upf = Number.parseInt(bulkUnitsPerFloor, 10);
    const aptTrim = bulkAptStart.trim();
    const aptStart =
      aptTrim === "" ? undefined : Number.parseInt(bulkAptStart, 10);
    return validateAndGenerateBulkUnits({
      floorFrom: ff,
      floorTo: ft,
      unitsPerFloor: upf,
      apartmentStartIndex: aptStart,
    });
  }, [addMode, bulkFloorFrom, bulkFloorTo, bulkUnitsPerFloor, bulkAptStart]);

  const bulkIssues = useMemo(() => {
    if (!bulkValidated || !bulkValidated.ok) return null;
    return analyzeBulkUnitNumberIssues(
      bulkValidated.rows,
      existingUnitNumbers
    );
  }, [bulkValidated, existingUnitNumbers]);

  function persistUnits(
    parsed: { unit_number: string; floor_number: number | null }[]
  ) {
    addTransition(() => {
      void (async () => {
        const res = await addBuildingUnitsSuperAdminAction(
          tenantId,
          buildingId,
          parsed
        );
        if (!res.ok) {
          setAddError(res.error);
          return;
        }
        setRows([{ unit_number: "", floor: "" }]);
        router.refresh();
      })();
    });
  }

  function onAddUnits() {
    setAddError(null);
    const parsed = rows
      .map((r) => ({
        unit_number: r.unit_number.trim(),
        floor_number:
          r.floor.trim() === "" ? null : Number.parseInt(r.floor, 10),
      }))
      .filter((r) => r.unit_number.length > 0);

    if (!parsed.length) {
      setAddError("הוסיפו לפחות דירה אחת עם מספר דירה.");
      return;
    }

    for (const p of parsed) {
      if (
        p.floor_number !== null &&
        (Number.isNaN(p.floor_number) || p.floor_number < 0)
      ) {
        setAddError("מספר קומה חייב להיות מספר תקין.");
        return;
      }
    }

    persistUnits(parsed);
  }

  function onAddQuickUnits() {
    setAddError(null);
    if (!bulkValidated || !bulkValidated.ok) {
      setAddError(
        bulkValidated && !bulkValidated.ok
          ? bulkValidated.error
          : "מלאו את שדות הרשת במספרים תקינים."
      );
      return;
    }

    const issues = bulkIssues ?? {
      internalDuplicates: [] as string[],
      conflictsWithExisting: [] as string[],
    };

    if (issues.internalDuplicates.length) {
      setAddError("נוצרו כפילויות פנימיות במספרי דירה.");
      return;
    }

    if (issues.conflictsWithExisting.length) {
      const list = issues.conflictsWithExisting.slice(0, 10).join(", ");
      setAddError(
        `מספרי דירה שכבר קיימים בבניין: ${list}${
          issues.conflictsWithExisting.length > 10 ? " …" : ""
        }`
      );
      return;
    }

    persistUnits(bulkValidated.rows);
  }

  return (
    <div className="rounded-lg border bg-card">
      <div className="border-b px-4 py-3 font-medium">הוספת דירות</div>
      <div className="px-4 pb-4 pt-3">
        <div
          className="mb-3 flex flex-wrap gap-2"
          role="tablist"
          aria-label="אופן הוספת דירות"
        >
          <Button
            type="button"
            variant={addMode === "manual" ? "default" : "outline"}
            size="sm"
            onClick={() => {
              setAddMode("manual");
              setAddError(null);
            }}
          >
            הזנה ידנית
          </Button>
          <Button
            type="button"
            variant={addMode === "quick" ? "default" : "outline"}
            size="sm"
            onClick={() => {
              setAddMode("quick");
              setAddError(null);
            }}
          >
            הוספה מהירה לפי רשת
          </Button>
        </div>

        {addMode === "manual" ? (
          <>
            <p className="mb-3 text-sm text-muted-foreground">
              ניתן להוסיף מספר דירות בבת אחת. לכל דירה ציינו מספר דירה ומספר
              קומה.
            </p>
            <div className="space-y-3">
              {rows.map((row, i) => (
                <div
                  key={i}
                  className="flex flex-wrap items-end gap-3 border-b border-border/60 pb-3 last:border-0 last:pb-0"
                >
                  <div className="grid min-w-[140px] flex-1 gap-1.5">
                    <Label htmlFor={`sa-unit-${i}`}>מספר דירה</Label>
                    <Input
                      id={`sa-unit-${i}`}
                      value={row.unit_number}
                      onChange={(e) => {
                        const v = e.target.value;
                        setRows((prev) =>
                          prev.map((r, j) =>
                            j === i ? { ...r, unit_number: v } : r
                          )
                        );
                      }}
                      placeholder="למשל 3"
                      dir="ltr"
                      className="text-start"
                    />
                  </div>
                  <div className="grid w-full min-w-[100px] max-w-[140px] gap-1.5">
                    <Label htmlFor={`sa-floor-${i}`}>קומה</Label>
                    <Input
                      id={`sa-floor-${i}`}
                      inputMode="numeric"
                      value={row.floor}
                      onChange={(e) => {
                        const v = e.target.value;
                        setRows((prev) =>
                          prev.map((r, j) =>
                            j === i ? { ...r, floor: v } : r
                          )
                        );
                      }}
                      placeholder="אופציונלי"
                      dir="ltr"
                      className="text-start"
                    />
                  </div>
                  {rows.length > 1 ? (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="shrink-0"
                      onClick={() =>
                        setRows((prev) => prev.filter((_, j) => j !== i))
                      }
                    >
                      הסרה
                    </Button>
                  ) : null}
                </div>
              ))}
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() =>
                  setRows((prev) => [...prev, { unit_number: "", floor: "" }])
                }
              >
                שורה נוספת
              </Button>
              <Button
                type="button"
                size="sm"
                disabled={addPending}
                onClick={() => onAddUnits()}
              >
                {addPending ? "שומר…" : "שמירת דירות"}
              </Button>
            </div>
          </>
        ) : (
          <>
            <p className="mb-3 text-sm text-muted-foreground">
              בחרו טווח קומות, כמה דירות בכל קומה, ומאיזה מספר דירה להתחיל בכל
              קומה. המספר המלא יהיה קומה-מספר (למשל 2-05).
            </p>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="grid gap-1.5">
                <Label htmlFor="sa-bulk-floor-from">מקומה</Label>
                <Input
                  id="sa-bulk-floor-from"
                  inputMode="numeric"
                  value={bulkFloorFrom}
                  onChange={(e) => setBulkFloorFrom(e.target.value)}
                  placeholder="למשל 1 או 0 לקרקע"
                  dir="ltr"
                  className="text-start"
                />
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="sa-bulk-floor-to">עד קומה</Label>
                <Input
                  id="sa-bulk-floor-to"
                  inputMode="numeric"
                  value={bulkFloorTo}
                  onChange={(e) => setBulkFloorTo(e.target.value)}
                  placeholder="למשל 5"
                  dir="ltr"
                  className="text-start"
                />
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="sa-bulk-per-floor">דירות בכל קומה</Label>
                <Input
                  id="sa-bulk-per-floor"
                  inputMode="numeric"
                  value={bulkUnitsPerFloor}
                  onChange={(e) => setBulkUnitsPerFloor(e.target.value)}
                  placeholder="למשל 4"
                  dir="ltr"
                  className="text-start"
                />
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="sa-bulk-apt-start">
                  מספר דירה ראשון בכל קומה
                </Label>
                <Input
                  id="sa-bulk-apt-start"
                  inputMode="numeric"
                  value={bulkAptStart}
                  onChange={(e) => setBulkAptStart(e.target.value)}
                  placeholder="ברירת מחדל 1"
                  dir="ltr"
                  className="text-start"
                />
              </div>
            </div>
            <div className="mt-3 rounded-md border border-border/60 bg-muted/30 px-3 py-2 text-sm">
              {bulkValidated && bulkValidated.ok ? (
                <>
                  <p className="font-medium text-foreground">
                    ייווצרו {bulkValidated.total} דירות
                  </p>
                  <p className="mt-1 text-muted-foreground">
                    קומות {bulkValidated.preview.floorFrom}–
                    {bulkValidated.preview.floorTo}; בכל קומה מספרי דירה{" "}
                    {bulkValidated.preview.apartmentSuffixFrom}–
                    {bulkValidated.preview.apartmentSuffixTo}
                  </p>
                  <p className="mt-1 text-muted-foreground">
                    טווח מספרי דירה מלא: מ־
                    <span dir="ltr" className="tabular-nums">
                      {bulkValidated.preview.firstUnitNumber}
                    </span>{" "}
                    עד{" "}
                    <span dir="ltr" className="tabular-nums">
                      {bulkValidated.preview.lastUnitNumber}
                    </span>
                  </p>
                  {bulkIssues && bulkIssues.conflictsWithExisting.length > 0 ? (
                    <p className="mt-1 text-destructive">
                      חפיפה עם דירות קיימות במספרים:{" "}
                      {bulkIssues.conflictsWithExisting.slice(0, 8).join(", ")}
                      {bulkIssues.conflictsWithExisting.length > 8 ? " …" : ""}
                    </p>
                  ) : (
                    <p className="mt-1 text-muted-foreground">
                      דוגמה:{" "}
                      {bulkValidated.rows
                        .slice(0, 4)
                        .map((r) => r.unit_number)
                        .join(", ")}
                      {bulkValidated.total > 4 ? " …" : ""}
                    </p>
                  )}
                </>
              ) : bulkValidated && !bulkValidated.ok ? (
                <p className="text-destructive">{bulkValidated.error}</p>
              ) : (
                <p className="text-muted-foreground">
                  הזינו מספרים כדי לראות סיכום.
                </p>
              )}
            </div>
            <div className="mt-4">
              <Button
                type="button"
                size="sm"
                disabled={addPending}
                onClick={() => onAddQuickUnits()}
              >
                {addPending ? "שומר…" : "שמירת דירות"}
              </Button>
            </div>
          </>
        )}

        {addError ? (
          <p className="mt-2 text-sm text-destructive">{addError}</p>
        ) : null}
      </div>
    </div>
  );
}
