"use client";

import type { CreateServiceTypeActionState } from "@/app/(dashboard)/(manager)/service-types/service-type-actions";
import { createServiceTypeAction } from "@/app/(dashboard)/(manager)/service-types/service-type-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { REQUEST_CATEGORY_LABEL, type RequestCategory } from "@my-project/shared";
import { useRouter } from "next/navigation";
import { useEffect, useRef } from "react";
import { useFormState } from "react-dom";

const CATEGORY_KEYS = Object.keys(
  REQUEST_CATEGORY_LABEL
) as RequestCategory[];

export type AddServiceTypeFormProps = {
  /** מצב דיאלוג: ללא כותרת כפולה ועם מסגרת מינימלית */
  variant?: "page" | "dialog";
  formClassName?: string;
  onSuccess?: () => void;
};

export function AddServiceTypeForm({
  variant = "page",
  formClassName,
  onSuccess,
}: AddServiceTypeFormProps) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const onSuccessRef = useRef(onSuccess);
  onSuccessRef.current = onSuccess;
  const [state, formAction] = useFormState<
    CreateServiceTypeActionState | undefined,
    FormData
  >(createServiceTypeAction, undefined);

  const successHandled = useRef(false);
  useEffect(() => {
    if (state?.ok) {
      if (!successHandled.current) {
        successHandled.current = true;
        formRef.current?.reset();
        onSuccessRef.current?.();
        router.refresh();
      }
    } else {
      successHandled.current = false;
    }
  }, [state, router]);

  const isDialog = variant === "dialog";
  const shell =
    formClassName ??
    (isDialog
      ? "grid gap-4"
      : "grid max-w-xl gap-4 rounded-lg border bg-card p-4");

  return (
    <form ref={formRef} action={formAction} className={shell}>
      {!isDialog ? (
        <>
          <p className="font-medium">הוספת סוג שירות</p>
          <p className="text-sm text-muted-foreground">
            השירות משויך לארגון שלך (
            <code className="rounded bg-muted px-1 text-xs">
              business_profile_id
            </code>
            ).
          </p>
        </>
      ) : (
        <p className="text-sm text-muted-foreground">
          השירות משויך לארגון שלך (
          <code className="rounded bg-muted px-1 text-xs">
            business_profile_id
          </code>
          ).
        </p>
      )}

      <div className="grid gap-2">
        <Label htmlFor="st-name">שם שירות</Label>
        <Input
          id="st-name"
          name="name"
          required
          autoComplete="off"
          className="min-h-[44px] sm:min-h-10"
        />
      </div>

      <div className="grid gap-2">
        <Label htmlFor="st-category">קטגוריה</Label>
        <select
          id="st-category"
          name="category"
          required
          defaultValue="other"
          className="flex h-11 min-h-[44px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:h-10 sm:min-h-10"
        >
          {CATEGORY_KEYS.map((key) => (
            <option key={key} value={key}>
              {REQUEST_CATEGORY_LABEL[key]}
            </option>
          ))}
        </select>
      </div>

      <div className="grid gap-2">
        <Label htmlFor="st-description">תיאור (אופציונלי)</Label>
        <textarea
          id="st-description"
          name="description"
          rows={3}
          className="min-h-[88px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="grid gap-2">
          <Label htmlFor="st-price_min">מחיר מינימום</Label>
          <Input
            id="st-price_min"
            name="price_min"
            type="text"
            inputMode="decimal"
            dir="ltr"
            placeholder="למשל 100"
            className="min-h-[44px] sm:min-h-10"
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="st-price_max">מחיר מקסימום</Label>
          <Input
            id="st-price_max"
            name="price_max"
            type="text"
            inputMode="decimal"
            dir="ltr"
            placeholder="למשל 500"
            className="min-h-[44px] sm:min-h-10"
          />
        </div>
      </div>

      <div className="grid gap-2">
        <Label htmlFor="st-price_unit">יחידת מחיר</Label>
        <Input
          id="st-price_unit"
          name="price_unit"
          placeholder="למשל job, hour, מ״ר"
          dir="ltr"
          className="min-h-[44px] sm:min-h-10"
        />
        <p className="text-xs text-muted-foreground">
          ברירת מחדל במסד: <code className="rounded bg-muted px-1">job</code>
        </p>
      </div>

      <div className="flex flex-row items-center gap-2">
        <input
          id="st-is_active"
          name="is_active"
          type="checkbox"
          defaultChecked
          className="h-4 w-4 rounded border-input"
        />
        <Label htmlFor="st-is_active" className="font-normal">
          פעיל
        </Label>
      </div>

      {state?.ok === false ? (
        <p className="text-sm text-destructive">{state.error}</p>
      ) : null}

      <div
        className={
          isDialog
            ? "sticky bottom-0 -mx-4 -mb-4 mt-2 flex flex-col gap-2 border-t bg-card p-4 sm:flex-row sm:justify-end"
            : ""
        }
      >
        <Button
          type="submit"
          className={
            isDialog
              ? "min-h-[44px] w-full touch-manipulation sm:w-auto"
              : "min-h-[44px] w-full touch-manipulation sm:min-h-10 sm:w-auto"
          }
        >
          שמירת סוג שירות
        </Button>
      </div>
    </form>
  );
}
