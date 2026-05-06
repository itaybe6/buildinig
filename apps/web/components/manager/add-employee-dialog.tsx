"use client";

import { addEmployeeAction } from "@/app/(dashboard)/(manager)/employees/add-employee-action";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useRouter } from "next/navigation";
import { useRef, useState, useTransition } from "react";

export function AddEmployeeDialog() {
  const router = useRouter();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    setError(null);
    startTransition(() => {
      void (async () => {
        const res = await addEmployeeAction(undefined, new FormData(form));
        if (!res.ok) {
          setError(res.error);
          return;
        }
        dialogRef.current?.close();
        form.reset();
        router.refresh();
      })();
    });
  }

  return (
    <>
      <Button
        type="button"
        className="h-11 w-full min-h-[44px] touch-manipulation sm:h-10 sm:w-auto"
        onClick={() => {
          setError(null);
          queueMicrotask(() => dialogRef.current?.showModal());
        }}
      >
        הוספת עובד
      </Button>

      <dialog
        ref={dialogRef}
        className="fixed left-1/2 top-1/2 z-50 box-border w-[min(100%-1rem,28rem)] max-h-[min(92dvh,36rem)] -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-xl border bg-card p-0 shadow-lg backdrop:bg-black/45 open:flex open:flex-col"
      >
        <div className="flex shrink-0 items-center justify-between gap-2 border-b px-4 py-3">
          <p className="font-semibold">עובד חדש</p>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="min-h-[44px] min-w-[44px] shrink-0 px-2 sm:min-h-9 sm:min-w-9"
            onClick={() => dialogRef.current?.close()}
          >
            סגירה
          </Button>
        </div>

        <form
          ref={formRef}
          onSubmit={onSubmit}
          className="grid flex-1 gap-4 overflow-y-auto overscroll-contain p-4"
        >
          <p className="text-sm text-muted-foreground">
            העובד יתחבר עם מספר הטלפון והסיסמה (כמו שאר המשתמשים במערכת).
          </p>

          <div className="grid gap-2">
            <Label htmlFor="emp-full_name">שם מלא</Label>
            <Input
              id="emp-full_name"
              name="full_name"
              required
              autoComplete="name"
              className="min-h-[44px] sm:min-h-10"
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="emp-phone">טלפון נייד (כניסה למערכת)</Label>
            <Input
              id="emp-phone"
              name="phone"
              type="tel"
              required
              autoComplete="tel"
              dir="ltr"
              placeholder="למשל 050-1234567"
              className="min-h-[44px] text-start sm:min-h-10"
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="emp-password">סיסמה ראשונית</Label>
            <Input
              id="emp-password"
              name="password"
              type="password"
              required
              minLength={6}
              autoComplete="new-password"
              dir="ltr"
              placeholder="לפחות 6 תווים"
              className="min-h-[44px] sm:min-h-10"
            />
          </div>

          {error ? <p className="text-sm text-destructive">{error}</p> : null}

          <div className="sticky bottom-0 -mx-4 -mb-4 mt-2 flex flex-col gap-2 border-t bg-card p-4 sm:flex-row sm:justify-end">
            <Button
              type="button"
              variant="outline"
              className="min-h-[44px] w-full touch-manipulation sm:w-auto"
              onClick={() => dialogRef.current?.close()}
            >
              ביטול
            </Button>
            <Button
              type="submit"
              disabled={pending}
              className="min-h-[44px] w-full touch-manipulation sm:w-auto"
            >
              {pending ? "יוצר…" : "יצירת עובד"}
            </Button>
          </div>
        </form>
      </dialog>
    </>
  );
}
