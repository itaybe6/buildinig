"use client";

import {
  addBuildingUnitsAction,
  linkResidentToUnitAction,
} from "@/app/(dashboard)/(manager)/buildings/building-units-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useRouter } from "next/navigation";
import type { ReactNode } from "react";
import { useRef, useState, useTransition } from "react";

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

function sortUnits(a: UnitWithResidentRow, b: UnitWithResidentRow) {
  return a.unit_number.localeCompare(b.unit_number, undefined, {
    numeric: true,
    sensitivity: "base",
  });
}

export function ManagerBuildingUnitsPanel({
  buildingId,
  units,
  eligibleProfiles,
}: {
  buildingId: string;
  units: UnitWithResidentRow[];
  eligibleProfiles: EligibleProfile[];
}) {
  const router = useRouter();
  const [rows, setRows] = useState<RowDraft[]>([
    { unit_number: "", floor: "" },
  ]);
  const [addError, setAddError] = useState<string | null>(null);
  const [addPending, addTransition] = useTransition();

  const dialogRef = useRef<HTMLDialogElement>(null);
  const [linkUnit, setLinkUnit] = useState<UnitWithResidentRow | null>(null);
  const [selectedProfileId, setSelectedProfileId] = useState("");
  const [linkError, setLinkError] = useState<string | null>(null);
  const [linkPending, linkTransition] = useTransition();

  const sorted = [...units].sort(sortUnits);

  function closeDialog() {
    dialogRef.current?.close();
    setLinkUnit(null);
  }

  function openLink(u: UnitWithResidentRow) {
    if (u.resident) return;
    setSelectedProfileId("");
    setLinkError(null);
    setLinkUnit(u);
    queueMicrotask(() => {
      dialogRef.current?.showModal();
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

  function onChooseNewCustomer() {
    if (!linkUnit) return;
    closeDialog();
    router.push(
      `/buildings/${buildingId}?resident_unit=${encodeURIComponent(linkUnit.id)}#add-resident`
    );
    requestAnimationFrame(() => {
      document
        .getElementById("add-resident-form")
        ?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }

  return (
    <div className="space-y-6">
      <CardSection title="הוספת דירות">
        <p className="mb-3 text-sm text-muted-foreground">
          ניתן להוסיף מספר דירות בבת אחת. לכל דירה ציינו מספר דירה ומספר קומה.
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
                      prev.map((r, j) => (j === i ? { ...r, floor: v } : r))
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
        {addError ? (
          <p className="mt-2 text-sm text-destructive">{addError}</p>
        ) : null}
      </CardSection>

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
                    קישור ללקוח
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
                        <Button
                          type="button"
                          variant="secondary"
                          size="sm"
                          onClick={() => openLink(u)}
                        >
                          קישור ללקוח
                        </Button>
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
                בחרו דייר קיים מהארגון או צרו דייר חדש בטופס למטה.
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
                variant="outline"
                onClick={() => onChooseNewCustomer()}
              >
                דייר חדש (טופס למטה)
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
                אין דיירים זמינים ללא דירה — השתמשו ב&quot;דייר חדש&quot;.
              </p>
            ) : null}
          </div>
        ) : null}
      </dialog>
    </div>
  );
}

function CardSection({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <div className="rounded-lg border bg-card p-4">
      <h3 className="mb-1 font-medium">{title}</h3>
      {children}
    </div>
  );
}
