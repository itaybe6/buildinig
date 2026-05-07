"use client";

import { inviteResidentForBuildingAction } from "@/app/(dashboard)/(manager)/buildings/invite-resident-action";
import { normalizeIsraelPhoneLocalDigits } from "@my-project/shared";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useRouter } from "next/navigation";
import { useMemo, useRef, useState, useTransition } from "react";

export type AddResidentBuildingOption = {
  id: string;
  address: string;
  city: string | null;
};

export type AddResidentUnitOption = {
  id: string;
  unit_number: string;
  floor_number: number | null;
  building_id: string;
  resident_profile_id: string | null;
};

type Step = 1 | 2 | 3;

export function AddResidentDialog({
  buildings,
  units,
}: {
  buildings: AddResidentBuildingOption[];
  units: AddResidentUnitOption[];
}) {
  const router = useRouter();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [step, setStep] = useState<Step>(1);
  const [selectedBuildingId, setSelectedBuildingId] = useState<string | null>(
    null
  );
  const [selectedUnitId, setSelectedUnitId] = useState<string | null>(null);

  const [fullName, setFullName] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");

  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [buildingSearchQuery, setBuildingSearchQuery] = useState("");

  const filteredBuildings = useMemo(() => {
    const q = buildingSearchQuery.trim().toLowerCase();
    if (!q) return buildings;
    return buildings.filter((b) => {
      const haystack = `${b.address} ${b.city ?? ""}`.toLowerCase();
      return haystack.includes(q);
    });
  }, [buildings, buildingSearchQuery]);

  function resetWizard() {
    setStep(1);
    setSelectedBuildingId(null);
    setSelectedUnitId(null);
    setFullName("");
    setPassword("");
    setPhone("");
    setBuildingSearchQuery("");
    setError(null);
  }

  function openDialog() {
    setError(null);
    resetWizard();
    queueMicrotask(() => dialogRef.current?.showModal());
  }

  function closeDialog() {
    dialogRef.current?.close();
    resetWizard();
  }

  const selectedBuilding = selectedBuildingId
    ? buildings.find((b) => b.id === selectedBuildingId)
    : undefined;

  const vacantUnitsForBuilding = selectedBuildingId
    ? units.filter(
        (u) =>
          u.building_id === selectedBuildingId && !u.resident_profile_id
      )
    : [];

  function goNextFromStep1() {
    setError(null);
    if (!fullName.trim()) {
      setError("חובה שם מלא.");
      return;
    }
    if (!normalizeIsraelPhoneLocalDigits(phone)) {
      setError(
        "מספר טלפון נייד ישראלי לא תקין (למשל 050-1234567)."
      );
      return;
    }
    if (password.length < 6) {
      setError("סיסמה — לפחות 6 תווים.");
      return;
    }
    if (!buildings.length) {
      setError("אין בניינים בארגון — הוסיפו בניין לפני שיוך דייר.");
      return;
    }
    setStep(2);
  }

  function selectBuilding(id: string) {
    setSelectedBuildingId(id);
    setSelectedUnitId(null);
    setStep(3);
    setError(null);
  }

  function submitResident() {
    if (!selectedBuildingId || !selectedUnitId) {
      setError("יש לבחור בניין ודירה.");
      return;
    }
    setError(null);
    const fd = new FormData();
    fd.set("building_id", selectedBuildingId);
    fd.set("unit_id", selectedUnitId);
    fd.set("full_name", fullName);
    fd.set("password", password);
    fd.set("phone", phone);

    startTransition(() => {
      void (async () => {
        const res = await inviteResidentForBuildingAction(undefined, fd);
        if (!res.ok) {
          setError(res.error);
          return;
        }
        closeDialog();
        router.refresh();
      })();
    });
  }

  const title =
    step === 1
      ? "פרטי דייר"
      : step === 2
        ? "בחירת בניין"
        : "בחירת דירה";

  return (
    <>
      <Button
        type="button"
        className="h-11 w-full min-h-[44px] touch-manipulation sm:h-10 sm:w-auto"
        onClick={openDialog}
      >
        הוספת דייר
      </Button>

      <dialog
        ref={dialogRef}
        className="fixed left-1/2 top-1/2 z-50 box-border w-[min(100%-1rem,26rem)] max-h-[min(92dvh,40rem)] -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-xl border bg-card p-0 shadow-lg backdrop:bg-black/45 open:flex open:flex-col sm:w-[min(100%-1rem,28rem)]"
      >
        <div className="flex shrink-0 items-center justify-between gap-2 border-b px-4 py-3">
          <div className="min-w-0">
            <p className="font-semibold">{title}</p>
            <p className="text-xs text-muted-foreground">
              שלב {step} מתוך 3
            </p>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="min-h-[44px] min-w-[44px] shrink-0 px-2 sm:min-h-9 sm:min-w-9"
            onClick={closeDialog}
          >
            סגירה
          </Button>
        </div>

        <div className="grid flex-1 gap-4 overflow-y-auto overscroll-contain p-4">
          {step === 1 ? (
            <>
              <p className="text-sm text-muted-foreground">
                הכניסה למערכת היא בטלפון ובסיסמה. לאחר מילוי הפרטים תבחרו בניין
                ודירה פנויה לשיוך הדייר.
              </p>
              <div className="grid gap-2">
                <Label htmlFor="ar-full_name">שם מלא</Label>
                <Input
                  id="ar-full_name"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                  autoComplete="name"
                  className="min-h-[44px] sm:min-h-10"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="ar-phone">טלפון נייד (כניסה למערכת)</Label>
                <Input
                  id="ar-phone"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  type="tel"
                  required
                  autoComplete="tel"
                  dir="ltr"
                  placeholder="למשל 050-1234567"
                  className="min-h-[44px] sm:min-h-10"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="ar-password">סיסמה ראשונית</Label>
                <Input
                  id="ar-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  type="password"
                  required
                  minLength={6}
                  autoComplete="new-password"
                  dir="ltr"
                  className="min-h-[44px] sm:min-h-10"
                />
              </div>
            </>
          ) : null}

          {step === 2 ? (
            <>
              <p className="text-sm text-muted-foreground">
                בחרו את הבניין שבו תגור הדירה של הדייר.
              </p>
              {!buildings.length ? (
                <p className="text-sm text-muted-foreground">
                  אין בניינים להצגה.
                </p>
              ) : (
                <>
                  <div className="grid gap-2">
                    <Label htmlFor="ar-building-search">חיפוש בניין</Label>
                    <Input
                      id="ar-building-search"
                      type="search"
                      value={buildingSearchQuery}
                      onChange={(e) => setBuildingSearchQuery(e.target.value)}
                      placeholder="כתובת או עיר…"
                      autoComplete="off"
                      className="min-h-[44px] sm:min-h-10"
                    />
                  </div>
                  {!filteredBuildings.length ? (
                    <p className="text-sm text-muted-foreground">
                      לא נמצאו בניינים התואמים לחיפוש.
                    </p>
                  ) : (
                    <ul className="grid max-h-[min(42vh,18rem)] gap-2 overflow-y-auto overscroll-contain pr-1">
                      {filteredBuildings.map((b) => (
                        <li key={b.id}>
                          <button
                            type="button"
                            onClick={() => selectBuilding(b.id)}
                            className="flex w-full flex-col items-stretch rounded-lg border bg-background px-3 py-3 text-start text-sm transition hover:bg-muted/60"
                          >
                            <span className="font-medium">{b.address}</span>
                            {b.city ? (
                              <span className="text-muted-foreground">
                                {b.city}
                              </span>
                            ) : null}
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </>
              )}
            </>
          ) : null}

          {step === 3 && selectedBuilding ? (
            <>
              <p className="text-sm text-muted-foreground">
                בניין:{" "}
                <span className="font-medium text-foreground">
                  {selectedBuilding.address}
                </span>
                . בחרו דירה פנויה.
              </p>
              {!vacantUnitsForBuilding.length ? (
                <p className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-950 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-100">
                  אין דירות פנויות בבניין זה. הוסיפו דירות בעמוד הבניין או בחרו
                  בניין אחר.
                </p>
              ) : (
                <ul className="grid max-h-[min(40vh,16rem)] gap-2 overflow-y-auto pr-1">
                  {vacantUnitsForBuilding
                    .slice()
                    .sort((a, b) =>
                      a.unit_number.localeCompare(b.unit_number, "he", {
                        numeric: true,
                      })
                    )
                    .map((u) => (
                      <li key={u.id}>
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedUnitId(u.id);
                            setError(null);
                          }}
                          className={
                            selectedUnitId === u.id
                              ? "flex w-full items-center justify-between rounded-lg border-2 border-primary bg-primary/5 px-3 py-2.5 text-start text-sm"
                              : "flex w-full items-center justify-between rounded-lg border px-3 py-2.5 text-start text-sm transition hover:bg-muted/60"
                          }
                        >
                          <span className="font-medium tabular-nums">
                            דירה {u.unit_number}
                          </span>
                          <span className="text-muted-foreground tabular-nums">
                            קומה {u.floor_number ?? "—"}
                          </span>
                        </button>
                      </li>
                    ))}
                </ul>
              )}
            </>
          ) : null}

          {error ? <p className="text-sm text-destructive">{error}</p> : null}
        </div>

        <div className="sticky bottom-0 flex shrink-0 flex-col gap-2 border-t bg-card p-4 sm:flex-row sm:justify-between">
          <div className="flex flex-col gap-2 sm:flex-row">
            {step > 1 ? (
              <Button
                type="button"
                variant="outline"
                className="min-h-[44px] w-full touch-manipulation sm:w-auto"
                disabled={pending}
                onClick={() => {
                  setError(null);
                  if (step === 2) {
                    setBuildingSearchQuery("");
                    setStep(1);
                  }
                  if (step === 3) {
                    setStep(2);
                    setSelectedBuildingId(null);
                    setSelectedUnitId(null);
                  }
                }}
              >
                חזרה
              </Button>
            ) : null}
          </div>
          <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
            <Button
              type="button"
              variant="outline"
              className="min-h-[44px] w-full touch-manipulation sm:w-auto"
              disabled={pending}
              onClick={closeDialog}
            >
              ביטול
            </Button>
            {step === 1 ? (
              <Button
                type="button"
                className="min-h-[44px] w-full touch-manipulation sm:w-auto"
                onClick={goNextFromStep1}
              >
                המשך לבחירת בניין
              </Button>
            ) : null}
            {step === 3 && vacantUnitsForBuilding.length > 0 ? (
              <Button
                type="button"
                className="min-h-[44px] w-full touch-manipulation sm:w-auto"
                disabled={pending || !selectedUnitId}
                onClick={submitResident}
              >
                {pending ? "יוצר…" : "הוספת דייר"}
              </Button>
            ) : null}
          </div>
        </div>
      </dialog>
    </>
  );
}
