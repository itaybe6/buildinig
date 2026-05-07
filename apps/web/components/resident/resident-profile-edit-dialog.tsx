"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  updateResidentPasswordAction,
  updateResidentProfileAction,
} from "@/lib/resident/resident-profile-actions";
import { normalizeIsraelPhoneLocalDigits } from "@my-project/shared";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";

export function ResidentProfileEditDialog({
  open,
  onClose,
  displayName,
  phone,
}: {
  open: boolean;
  onClose: () => void;
  displayName: string;
  phone: string | null;
}) {
  const router = useRouter();
  const dialogRef = useRef<HTMLDialogElement>(null);

  const [fullName, setFullName] = useState(displayName);
  const [phoneInput, setPhoneInput] = useState(phone ?? "");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errorProfile, setErrorProfile] = useState<string | null>(null);
  const [errorPwd, setErrorPwd] = useState<string | null>(null);
  const [pendingProfile, startProfile] = useTransition();
  const [pendingPwd, startPwd] = useTransition();

  useEffect(() => {
    const d = dialogRef.current;
    if (!d) return;
    if (open) {
      d.showModal();
      setFullName(displayName);
      setPhoneInput(phone ?? "");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setErrorProfile(null);
      setErrorPwd(null);
    } else {
      d.close();
    }
  }, [open, displayName, phone]);

  function saveProfile() {
    setErrorProfile(null);
    const fn = fullName.trim();
    if (!fn) {
      setErrorProfile("חובה שם מלא.");
      return;
    }
    const normalized = phoneInput.trim()
      ? normalizeIsraelPhoneLocalDigits(phoneInput)
      : null;
    if (phoneInput.trim() && !normalized) {
      setErrorProfile("מספר טלפון לא תקין (למשל 050-1234567).");
      return;
    }
    startProfile(() => {
      void (async () => {
        const r = await updateResidentProfileAction({
          fullName: fn,
          phone: normalized,
        });
        if (!r.ok) {
          setErrorProfile(r.error);
          return;
        }
        router.refresh();
        dialogRef.current?.close();
      })();
    });
  }

  function savePassword() {
    setErrorPwd(null);
    if (newPassword.length < 6) {
      setErrorPwd("סיסמה חדשה — לפחות 6 תווים.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setErrorPwd("הסיסמאות החדשות אינן תואמות.");
      return;
    }
    startPwd(() => {
      void (async () => {
        const r = await updateResidentPasswordAction({
          currentPassword,
          newPassword,
        });
        if (!r.ok) {
          setErrorPwd(r.error);
          return;
        }
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
        router.refresh();
        dialogRef.current?.close();
      })();
    });
  }

  return (
    <dialog
      ref={dialogRef}
      className="fixed left-1/2 top-1/2 z-[100] box-border w-[min(100%-1rem,24rem)] max-h-[min(92dvh,44rem)] -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-lg border bg-background p-0 shadow-lg backdrop:bg-black/50"
      onClose={() => onClose()}
    >
      <div className="flex flex-col gap-4 p-4">
        <div className="flex items-center justify-between gap-2 border-b pb-3">
          <h2 className="text-lg font-semibold">פרטים אישיים</h2>
          <button
            type="button"
            className="rounded-md px-2 py-1 text-sm text-muted-foreground hover:bg-accent"
            onClick={() => dialogRef.current?.close()}
          >
            סגור
          </button>
        </div>

        <div className="space-y-3">
          <div className="space-y-2">
            <Label htmlFor="rs-name">שם מלא</Label>
            <Input
              id="rs-name"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              autoComplete="name"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="rs-phone">טלפון נייד</Label>
            <Input
              id="rs-phone"
              value={phoneInput}
              onChange={(e) => setPhoneInput(e.target.value)}
              inputMode="tel"
              autoComplete="tel"
            />
          </div>
          {errorProfile ? (
            <p className="text-sm text-destructive">{errorProfile}</p>
          ) : null}
          <Button
            type="button"
            className="w-full"
            disabled={pendingProfile}
            onClick={() => saveProfile()}
          >
            {pendingProfile ? "שומר…" : "שמור פרטים"}
          </Button>
        </div>

        <div className="space-y-3 border-t pt-4">
          <h3 className="text-sm font-semibold">שינוי סיסמה</h3>
          <p className="text-xs text-muted-foreground">
            להגדרת סיסמה חדשה מלאו את השדות למטה.
          </p>

          <div className="space-y-2">
            <Label htmlFor="rs-cur">סיסמה נוכחית</Label>
            <Input
              id="rs-cur"
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              autoComplete="current-password"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="rs-new">סיסמה חדשה</Label>
            <Input
              id="rs-new"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              autoComplete="new-password"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="rs-conf">אימות סיסמה חדשה</Label>
            <Input
              id="rs-conf"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              autoComplete="new-password"
            />
          </div>

          {errorPwd ? (
            <p className="text-sm text-destructive">{errorPwd}</p>
          ) : null}
          <Button
            type="button"
            variant="secondary"
            className="w-full"
            disabled={pendingPwd}
            onClick={() => savePassword()}
          >
            {pendingPwd ? "מעדכן…" : "עדכן סיסמה"}
          </Button>
        </div>
      </div>
    </dialog>
  );
}
