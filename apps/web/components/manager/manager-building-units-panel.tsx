"use client";

import { linkResidentToUnitAction } from "@/app/(dashboard)/(manager)/buildings/building-units-actions";
import { InviteResidentForm } from "@/components/manager/invite-resident-form";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState, useTransition } from "react";

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
}: {
  buildingId: string;
  units: UnitWithResidentRow[];
  eligibleProfiles: EligibleProfile[];
}) {
  const router = useRouter();

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
      <div>
        <h2 className="mb-3 text-lg font-medium">דירות</h2>
        {!sorted.length ? (
          <div className="rounded-lg border bg-card py-6 text-center text-sm text-muted-foreground">
            אין דירות רשומות. הדירות נוספות בממשק סופר־אדמין לפי הבניין.
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
