"use client";

import {
  addBuildingUnitsAction,
  linkResidentToUnitAction,
} from "@/app/(dashboard)/(manager)/buildings/building-units-actions";
import { InviteResidentForm } from "@/components/manager/invite-resident-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  analyzeBulkUnitNumberIssues,
  validateAndGenerateBulkUnits,
} from "@my-project/shared";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState, useTransition } from "react";

export type UnitWithResidentRow = {
  id: string;
  unit_number: string;
  floor_number: number | null;
  monthly_fee: string | null;
  type: string | null;
  resident: { id: string; full_name: string; phone: string | null } | null;
};

type EligibleProfile = {
  id: string;
  full_name: string;
  phone: string | null;
};

type RowDraft = { unit_number: string; floor: string };

type AddMode = "manual" | "quick";

function sortUnits(a: UnitWithResidentRow, b: UnitWithResidentRow) {
  return a.unit_number.localeCompare(b.unit_number, undefined, {
    numeric: true,
    sensitivity: "base",
  });
}

function PlusIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      aria-hidden
    >
      <path d="M12 5v14M5 12h14" />
    </svg>
  );
}

export function ManagerBuildingUnitsPanel({
  buildingId,
  units,
  eligibleProfiles,
  suggestedFloorCount,
}: {
  buildingId: string;
  units: UnitWithResidentRow[];
  eligibleProfiles: EligibleProfile[];
  suggestedFloorCount?: number | null;
}) {
  const router = useRouter();
  const [addMode, setAddMode] = useState<AddMode>("manual");
  const [bulkFloors, setBulkFloors] = useState(() =>
    suggestedFloorCount != null && suggestedFloorCount > 0
      ? String(suggestedFloorCount)
      : ""
  );
  const [bulkUnitsPerFloor, setBulkUnitsPerFloor] = useState("2");
  const [bulkStartFloor, setBulkStartFloor] = useState("1");
  const [rows, setRows] = useState<RowDraft[]>([
    { unit_number: "", floor: "" },
  ]);
  const [addError, setAddError] = useState<string | null>(null);
  const [addPending, addTransition] = useTransition();

  const dialogRef = useRef<HTMLDialogElement>(null);
  const newResidentDialogRef = useRef<HTMLDialogElement>(null);
  const [linkUnit, setLinkUnit] = useState<UnitWithResidentRow | null>(null);
  const [newResidentUnit, setNewResidentUnit] =
    useState<UnitWithResidentRow | null>(null);
  const [actionMenuUnitId, setActionMenuUnitId] = useState<string | null>(
    null
  );
  const [selectedProfileId, setSelectedProfileId] = useState("");
  const [linkError, setLinkError] = useState<string | null>(null);
  const [linkPending, linkTransition] = useTransition();

  const [addUnitsOpen, setAddUnitsOpen] = useState(() => units.length === 0);
  const prevUnitsLength = useRef(units.length);

  useEffect(() => {
    if (units.length === 0) {
      setAddUnitsOpen(true);
    } else if (prevUnitsLength.current === 0 && units.length > 0) {
      setAddUnitsOpen(false);
    }
    prevUnitsLength.current = units.length;
  }, [units.length]);

  useEffect(() => {
    if (!actionMenuUnitId) return;
    const onDocMouseDown = (e: MouseEvent) => {
      const root = document.querySelector(
        `[data-unit-actions="${actionMenuUnitId}"]`
      );
      if (root && !root.contains(e.target as Node)) {
        setActionMenuUnitId(null);
      }
    };
    document.addEventListener("mousedown", onDocMouseDown);
    return () => document.removeEventListener("mousedown", onDocMouseDown);
  }, [actionMenuUnitId]);

  const sorted = [...units].sort(sortUnits);

  const bulkValidated = useMemo(() => {
    if (addMode !== "quick") return null;
    const fc = Number.parseInt(bulkFloors, 10);
    const upf = Number.parseInt(bulkUnitsPerFloor, 10);
    const startTrim = bulkStartFloor.trim();
    const sf =
      startTrim === "" ? undefined : Number.parseInt(bulkStartFloor, 10);
    return validateAndGenerateBulkUnits({
      floorCount: fc,
      unitsPerFloor: upf,
      startFloor: sf,
    });
  }, [addMode, bulkFloors, bulkUnitsPerFloor, bulkStartFloor]);

  const bulkIssues = useMemo(() => {
    if (!bulkValidated || !bulkValidated.ok) return null;
    return analyzeBulkUnitNumberIssues(
      bulkValidated.rows,
      sorted.map((u) => u.unit_number)
    );
  }, [bulkValidated, sorted]);

  function closeDialog() {
    dialogRef.current?.close();
    setLinkUnit(null);
  }

  function openLinkExistingDialog(u: UnitWithResidentRow) {
    if (u.resident) return;
    setActionMenuUnitId(null);
    setSelectedProfileId("");
    setLinkError(null);
    setLinkUnit(u);
    queueMicrotask(() => {
      dialogRef.current?.showModal();
    });
  }

  function openNewResidentDialog(u: UnitWithResidentRow) {
    if (u.resident) return;
    setActionMenuUnitId(null);
    setNewResidentUnit(u);
    queueMicrotask(() => {
      newResidentDialogRef.current?.showModal();
    });
  }

  function closeNewResidentDialog() {
    newResidentDialogRef.current?.close();
    setNewResidentUnit(null);
  }

  const onInviteSuccess = useCallback(() => {
    newResidentDialogRef.current?.close();
    setNewResidentUnit(null);
    router.refresh();
  }, [router]);

  function persistUnits(
    parsed: { unit_number: string; floor_number: number | null }[]
  ) {
    addTransition(() => {
      void (async () => {
        const res = await addBuildingUnitsAction(buildingId, parsed);
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

  function onLinkExisting() {
    if (!linkUnit || !selectedProfileId) {
      setLinkError("בחרו דייר מהרשימה.");
      return;
    }
    setLinkError(null);
    linkTransition(() => {
      void (async () => {
        const res = await linkResidentToUnitAction(
          buildingId,
          linkUnit.id,
          selectedProfileId
        );
        if (!res.ok) {
          setLinkError(res.error);
          return;
        }
        closeDialog();
        router.refresh();
      })();
    });
  }

  return (
    <div className="space-y-6">
      <details
        className="rounded-lg border bg-card [&_summary::-webkit-details-marker]:hidden"
        open={addUnitsOpen}
        onToggle={(e) => {
          setAddUnitsOpen(e.currentTarget.open);
        }}
      >
        <summary className="cursor-pointer px-4 py-3 font-medium hover:bg-muted/40">
          הוספת דירות
        </summary>
        <div className="border-t px-4 pb-4 pt-3">
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
                    <Label htmlFor={`unit-${i}`}>מספר דירה</Label>
                    <Input
                      id={`unit-${i}`}
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
                    <Label htmlFor={`floor-${i}`}>קומה</Label>
                    <Input
                      id={`floor-${i}`}
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
              ציינו כמה קומות (ברצף), כמה דירות בכל קומה, ואופציונית את קומת
              ההתחלה. מספרי דירה ייווצרו אוטומטית (למשל 2-01, 2-02).
            </p>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="grid gap-1.5">
                <Label htmlFor="bulk-floors">מספר קומות</Label>
                <Input
                  id="bulk-floors"
                  inputMode="numeric"
                  value={bulkFloors}
                  onChange={(e) => setBulkFloors(e.target.value)}
                  placeholder="למשל 5"
                  dir="ltr"
                  className="text-start"
                />
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="bulk-per-floor">דירות בכל קומה</Label>
                <Input
                  id="bulk-per-floor"
                  inputMode="numeric"
                  value={bulkUnitsPerFloor}
                  onChange={(e) => setBulkUnitsPerFloor(e.target.value)}
                  placeholder="למשל 4"
                  dir="ltr"
                  className="text-start"
                />
              </div>
              <div className="grid gap-1.5 sm:col-span-2">
                <Label htmlFor="bulk-start-floor">קומת התחלה (אופציונלי)</Label>
                <Input
                  id="bulk-start-floor"
                  inputMode="numeric"
                  value={bulkStartFloor}
                  onChange={(e) => setBulkStartFloor(e.target.value)}
                  placeholder="ברירת מחדל 1; אפשר 0 לקרקע"
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
                  {bulkIssues &&
                  bulkIssues.conflictsWithExisting.length > 0 ? (
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
      </details>

      <div>
        <h2 className="mb-3 text-lg font-medium">דירות</h2>
        {!sorted.length ? (
          <div className="rounded-lg border bg-card py-6 text-center text-sm text-muted-foreground">
            אין דירות רשומות — השתמשו בטופס למעלה להוספה.
          </div>
        ) : (
          <div className="overflow-x-auto rounded-lg border">
            <table className="w-full min-w-[720px] text-sm">
              <thead className="border-b bg-muted/50">
                <tr>
                  <th className="px-3 py-2 text-start font-medium">
                    מספר דירה
                  </th>
                  <th className="px-3 py-2 text-start font-medium">קומה</th>
                  <th className="px-3 py-2 text-start font-medium">סוג</th>
                  <th className="px-3 py-2 text-start font-medium">ועד חודשי</th>
                  <th className="px-3 py-2 text-start font-medium">דייר</th>
                  <th className="px-3 py-2 text-start font-medium w-[200px]">
                    שיוך דייר
                  </th>
                </tr>
              </thead>
              <tbody>
                {sorted.map((u) => (
                  <tr key={u.id} className="border-b last:border-0">
                    <td className="px-3 py-2 font-medium">{u.unit_number}</td>
                    <td className="px-3 py-2 tabular-nums">
                      {u.floor_number ?? "—"}
                    </td>
                    <td className="px-3 py-2">{u.type ?? "—"}</td>
                    <td className="px-3 py-2 tabular-nums">
                      {u.monthly_fee ?? "—"}
                    </td>
                    <td className="px-3 py-2">
                      {u.resident ? (
                        <span>
                          {u.resident.full_name}
                          {u.resident.phone ? (
                            <span className="text-muted-foreground">
                              {" "}
                              · {u.resident.phone}
                            </span>
                          ) : null}
                        </span>
                      ) : (
                        <span className="text-muted-foreground">לא משויך</span>
                      )}
                    </td>
                    <td className="px-3 py-2">
                      {u.resident ? (
                        <span className="text-xs text-muted-foreground">
                          משויך
                        </span>
                      ) : (
                        <div
                          className="relative inline-flex"
                          data-unit-actions={u.id}
                        >
                          <Button
                            type="button"
                            variant="secondary"
                            size="icon"
                            className="h-9 w-9 shrink-0"
                            aria-expanded={actionMenuUnitId === u.id}
                            aria-haspopup="true"
                            aria-label={`הוספת או שיוך דייר לדירה ${u.unit_number}`}
                            onClick={() =>
                              setActionMenuUnitId((cur) =>
                                cur === u.id ? null : u.id
                              )
                            }
                          >
                            <PlusIcon />
                          </Button>
                          {actionMenuUnitId === u.id ? (
                            <div
                              className="absolute end-0 top-full z-20 mt-1 min-w-[11rem] rounded-md border bg-card p-1 shadow-md"
                              role="menu"
                            >
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="h-auto w-full justify-start px-2 py-2 font-normal"
                                role="menuitem"
                                onClick={() => openLinkExistingDialog(u)}
                              >
                                דייר קיים
                              </Button>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="h-auto w-full justify-start px-2 py-2 font-normal"
                                role="menuitem"
                                onClick={() => openNewResidentDialog(u)}
                              >
                                דייר חדש
                              </Button>
                            </div>
                          ) : null}
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <dialog
        ref={dialogRef}
        className="fixed left-1/2 top-1/2 z-50 w-[min(100%-2rem,420px)] -translate-x-1/2 -translate-y-1/2 rounded-lg border bg-card p-4 shadow-lg backdrop:bg-black/40"
        onClose={() => setLinkUnit(null)}
      >
        {linkUnit ? (
          <div className="space-y-4">
            <div>
              <p className="font-medium">קישור דירה {linkUnit.unit_number}</p>
              <p className="text-sm text-muted-foreground">
                בחרו דייר קיים מהארגון שאינו משויך לדירה אחרת.
              </p>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="eligible-profile">דייר קיים</Label>
              <select
                id="eligible-profile"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                value={selectedProfileId}
                onChange={(e) => setSelectedProfileId(e.target.value)}
              >
                <option value="">— בחרו דייר —</option>
                {eligibleProfiles.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.full_name}
                    {p.phone ? ` (${p.phone})` : ""}
                  </option>
                ))}
              </select>
            </div>

            {linkError ? (
              <p className="text-sm text-destructive">{linkError}</p>
            ) : null}

            <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
              <Button
                type="button"
                size="sm"
                disabled={linkPending || !eligibleProfiles.length}
                onClick={() => onLinkExisting()}
              >
                {linkPending ? "משייך…" : "שייך דייר קיים"}
              </Button>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                onClick={() => closeDialog()}
              >
                ביטול
              </Button>
            </div>
            {!eligibleProfiles.length ? (
              <p className="text-xs text-muted-foreground">
                אין דיירים זמינים ללא דירה — סגרו את החלון ובחרו &quot;דייר
                חדש&quot; מתפריט הפלוס בשורת הדירה.
              </p>
            ) : null}
          </div>
        ) : null}
      </dialog>

      <dialog
        ref={newResidentDialogRef}
        className="fixed left-1/2 top-1/2 z-50 w-[min(100%-2rem,440px)] max-h-[min(100dvh-2rem,640px)] -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-lg border bg-card p-4 shadow-lg backdrop:bg-black/40"
        onClose={() => setNewResidentUnit(null)}
      >
        {newResidentUnit ? (
          <div className="space-y-3">
            <div>
              <p className="font-medium">
                דייר חדש — דירה {newResidentUnit.unit_number}
              </p>
            </div>
            <InviteResidentForm
              key={newResidentUnit.id}
              buildingId={buildingId}
              unitId={newResidentUnit.id}
              variant="dialog"
              idPrefix={`unit-${newResidentUnit.id}`}
              onSuccess={onInviteSuccess}
            />
            <Button
              type="button"
              size="sm"
              variant="ghost"
              className="w-full"
              onClick={() => closeNewResidentDialog()}
            >
              ביטול
            </Button>
          </div>
        ) : null}
      </dialog>
    </div>
  );
}
