"use client";

import {
  deleteServiceTypeAction,
  updateServiceTypeAction,
} from "@/app/(dashboard)/(manager)/service-types/service-type-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  REQUEST_CATEGORY_LABEL,
  type RequestCategory,
} from "@my-project/shared";
import { useRouter } from "next/navigation";
import { useRef, useState, useTransition } from "react";

export type ServiceTypeTableRow = {
  id: string;
  name: string;
  description: string | null;
  category: RequestCategory;
  price_min: string | null;
  price_max: string | null;
  price_unit: string | null;
  is_active: boolean | null;
  created_at: string | null;
};

const CATEGORY_KEYS = Object.keys(
  REQUEST_CATEGORY_LABEL
) as RequestCategory[];

function PencilIcon({ className }: { className?: string }) {
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
      <path d="M12 20h9M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z" />
    </svg>
  );
}

function TrashIcon({ className }: { className?: string }) {
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
      <path d="M3 6h18M8 6V4h8v2M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" />
      <path d="M10 11v6M14 11v6" />
    </svg>
  );
}

export function ServiceTypesTable({
  rows,
  canManage,
}: {
  rows: ServiceTypeTableRow[];
  canManage: boolean;
}) {
  const router = useRouter();
  const editRef = useRef<HTMLDialogElement>(null);
  const deleteRef = useRef<HTMLDialogElement>(null);

  const [editRow, setEditRow] = useState<ServiceTypeTableRow | null>(null);
  const [deleteRow, setDeleteRow] = useState<ServiceTypeTableRow | null>(null);
  const [editError, setEditError] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [pendingEdit, editTransition] = useTransition();
  const [pendingDelete, deleteTransition] = useTransition();

  function openEdit(row: ServiceTypeTableRow) {
    setEditError(null);
    setEditRow(row);
    queueMicrotask(() => editRef.current?.showModal());
  }

  function openDelete(row: ServiceTypeTableRow) {
    setDeleteError(null);
    setDeleteRow(row);
    queueMicrotask(() => deleteRef.current?.showModal());
  }

  function onEditSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    setEditError(null);
    editTransition(() => {
      void (async () => {
        const res = await updateServiceTypeAction(
          undefined,
          new FormData(form)
        );
        if (!res.ok) {
          setEditError(res.error);
          return;
        }
        editRef.current?.close();
        setEditRow(null);
        router.refresh();
      })();
    });
  }

  function onDeleteConfirm() {
    if (!deleteRow) return;
    setDeleteError(null);
    deleteTransition(() => {
      void (async () => {
        const fd = new FormData();
        fd.set("service_type_id", deleteRow.id);
        const res = await deleteServiceTypeAction(undefined, fd);
        if (!res.ok) {
          setDeleteError(res.error);
          return;
        }
        deleteRef.current?.close();
        setDeleteRow(null);
        router.refresh();
      })();
    });
  }

  return (
    <>
      <div className="overflow-x-auto rounded-lg border">
        <table className="w-full min-w-[880px] text-sm">
          <thead className="border-b bg-muted/50">
            <tr>
              <th className="px-3 py-2 text-start font-medium">שם</th>
              <th className="px-3 py-2 text-start font-medium">קטגוריה</th>
              <th className="px-3 py-2 text-start font-medium">תיאור</th>
              <th className="px-3 py-2 text-start font-medium">מחיר מינ׳</th>
              <th className="px-3 py-2 text-start font-medium">מחיר מקס׳</th>
              <th className="px-3 py-2 text-start font-medium">יחידה</th>
              <th className="px-3 py-2 text-start font-medium">פעיל</th>
              {canManage ? (
                <th className="px-2 py-2 text-center font-medium">פעולות</th>
              ) : null}
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} className="border-b last:border-0">
                <td className="px-3 py-2 font-medium">{r.name}</td>
                <td className="px-3 py-2">
                  {REQUEST_CATEGORY_LABEL[r.category]}
                </td>
                <td className="max-w-[200px] truncate px-3 py-2 text-muted-foreground">
                  {r.description ?? "—"}
                </td>
                <td className="px-3 py-2 tabular-nums">{r.price_min ?? "—"}</td>
                <td className="px-3 py-2 tabular-nums">{r.price_max ?? "—"}</td>
                <td className="px-3 py-2">{r.price_unit ?? "—"}</td>
                <td className="px-3 py-2">{r.is_active ? "כן" : "לא"}</td>
                {canManage ? (
                  <td className="px-1 py-2">
                    <div className="flex items-center justify-center gap-0.5">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="min-h-[44px] min-w-[44px] shrink-0 text-muted-foreground hover:text-foreground sm:h-9 sm:w-9 sm:min-h-9 sm:min-w-9"
                        aria-label={`עריכת ${r.name}`}
                        onClick={() => openEdit(r)}
                      >
                        <PencilIcon />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="min-h-[44px] min-w-[44px] shrink-0 text-destructive hover:text-destructive sm:h-9 sm:w-9 sm:min-h-9 sm:min-w-9"
                        aria-label={`מחיקת ${r.name}`}
                        onClick={() => openDelete(r)}
                      >
                        <TrashIcon />
                      </Button>
                    </div>
                  </td>
                ) : null}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <dialog
        ref={editRef}
        className="fixed left-1/2 top-1/2 z-50 box-border w-[min(100%-1rem,28rem)] max-h-[min(92dvh,44rem)] -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-xl border bg-card p-0 shadow-lg backdrop:bg-black/45 open:flex open:flex-col"
        onClose={() => setEditRow(null)}
      >
        <div className="flex shrink-0 items-center justify-between gap-2 border-b px-4 py-3">
          <p className="font-semibold">עריכת סוג שירות</p>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="min-h-[44px] min-w-[44px] shrink-0 px-2 sm:min-h-9 sm:min-w-9"
            onClick={() => editRef.current?.close()}
          >
            סגירה
          </Button>
        </div>

        {editRow ? (
          <form
            onSubmit={onEditSubmit}
            className="grid flex-1 gap-4 overflow-y-auto overscroll-contain p-4"
          >
            <input type="hidden" name="service_type_id" value={editRow.id} />

            <div className="grid gap-2">
              <Label htmlFor="edit-st-name">שם שירות</Label>
              <Input
                id="edit-st-name"
                name="name"
                required
                key={`name-${editRow.id}`}
                defaultValue={editRow.name}
                autoComplete="off"
                className="min-h-[44px] sm:min-h-10"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="edit-st-category">קטגוריה</Label>
              <select
                id="edit-st-category"
                name="category"
                required
                key={`cat-${editRow.id}`}
                defaultValue={editRow.category}
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
              <Label htmlFor="edit-st-description">תיאור (אופציונלי)</Label>
              <textarea
                id="edit-st-description"
                name="description"
                rows={3}
                key={`desc-${editRow.id}`}
                defaultValue={editRow.description ?? ""}
                className="min-h-[88px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="grid gap-2">
                <Label htmlFor="edit-st-price_min">מחיר מינימום</Label>
                <Input
                  id="edit-st-price_min"
                  name="price_min"
                  type="text"
                  inputMode="decimal"
                  dir="ltr"
                  key={`pmin-${editRow.id}`}
                  defaultValue={editRow.price_min ?? ""}
                  placeholder="למשל 100"
                  className="min-h-[44px] sm:min-h-10"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-st-price_max">מחיר מקסימום</Label>
                <Input
                  id="edit-st-price_max"
                  name="price_max"
                  type="text"
                  inputMode="decimal"
                  dir="ltr"
                  key={`pmax-${editRow.id}`}
                  defaultValue={editRow.price_max ?? ""}
                  placeholder="למשל 500"
                  className="min-h-[44px] sm:min-h-10"
                />
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="edit-st-price_unit">יחידת מחיר</Label>
              <Input
                id="edit-st-price_unit"
                name="price_unit"
                dir="ltr"
                key={`unit-${editRow.id}`}
                defaultValue={editRow.price_unit ?? ""}
                placeholder="למשל job, hour, מ״ר"
                className="min-h-[44px] sm:min-h-10"
              />
            </div>

            <div className="flex items-center gap-2">
              <input
                id="edit-st-is_active"
                name="is_active"
                type="checkbox"
                defaultChecked={editRow.is_active !== false}
                className="h-4 w-4 rounded border-input"
              />
              <Label htmlFor="edit-st-is_active" className="font-normal">
                פעיל
              </Label>
            </div>

            {editError ? (
              <p className="text-sm text-destructive">{editError}</p>
            ) : null}

            <div className="sticky bottom-0 -mx-4 -mb-4 mt-2 flex flex-col gap-2 border-t bg-card p-4 sm:flex-row sm:justify-end">
              <Button
                type="button"
                variant="outline"
                className="min-h-[44px] w-full touch-manipulation sm:w-auto"
                onClick={() => editRef.current?.close()}
              >
                ביטול
              </Button>
              <Button
                type="submit"
                disabled={pendingEdit}
                className="min-h-[44px] w-full touch-manipulation sm:w-auto"
              >
                {pendingEdit ? "שומר…" : "שמירה"}
              </Button>
            </div>
          </form>
        ) : null}
      </dialog>

      <dialog
        ref={deleteRef}
        className="fixed left-1/2 top-1/2 z-50 w-[min(100%-1rem,24rem)] -translate-x-1/2 -translate-y-1/2 rounded-xl border bg-card p-0 shadow-lg backdrop:bg-black/45 open:block"
        onClose={() => setDeleteRow(null)}
      >
        <div className="border-b px-4 py-3">
          <p className="font-semibold">מחיקת סוג שירות</p>
        </div>
        <div className="space-y-3 px-4 py-4">
          <p className="text-sm text-muted-foreground">
            {deleteRow
              ? `למחוק את «${deleteRow.name}»?`
              : null}
          </p>
          {deleteError ? (
            <p className="text-sm text-destructive">{deleteError}</p>
          ) : null}
          <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
            <Button
              type="button"
              variant="outline"
              className="min-h-[44px] w-full sm:w-auto"
              onClick={() => deleteRef.current?.close()}
            >
              ביטול
            </Button>
            <Button
              type="button"
              variant="destructive"
              className="min-h-[44px] w-full sm:w-auto"
              disabled={pendingDelete}
              onClick={() => onDeleteConfirm()}
            >
              {pendingDelete ? "מוחק…" : "מחיקה"}
            </Button>
          </div>
        </div>
      </dialog>
    </>
  );
}
