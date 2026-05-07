"use client";

import { AddServiceTypeForm } from "@/components/manager/add-service-type-form";
import { Button } from "@/components/ui/button";
import { useRef } from "react";

export function AddServiceTypeDialog() {
  const dialogRef = useRef<HTMLDialogElement>(null);

  return (
    <>
      <Button
        type="button"
        className="h-11 w-full min-h-[44px] touch-manipulation sm:h-10 sm:w-auto"
        onClick={() => {
          queueMicrotask(() => dialogRef.current?.showModal());
        }}
      >
        הוספת סוג שירות
      </Button>

      <dialog
        ref={dialogRef}
        className="fixed left-1/2 top-1/2 z-50 box-border w-[min(100%-1rem,min(100vw-1rem,28rem))] max-h-[min(92dvh,44rem)] -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-xl border bg-card p-0 shadow-lg backdrop:bg-black/45 open:flex open:flex-col"
        onClose={() => {}}
      >
        <div className="flex shrink-0 items-center justify-between gap-2 border-b px-4 py-3">
          <p className="font-semibold">הוספת סוג שירות</p>
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
        <div className="flex-1 overflow-y-auto overscroll-contain p-4">
          <AddServiceTypeForm
            variant="dialog"
            formClassName="grid gap-4 rounded-lg border border-transparent bg-transparent p-0"
            onSuccess={() => dialogRef.current?.close()}
          />
        </div>
      </dialog>
    </>
  );
}
