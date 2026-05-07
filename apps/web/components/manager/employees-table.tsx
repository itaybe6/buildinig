"use client";

import {
  deleteEmployeeAction,
  updateEmployeeAction,
} from "@/app/(dashboard)/(manager)/employees/employee-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { USER_ROLE_LABEL, type UserRole } from "@my-project/shared";
import { useRouter } from "next/navigation";
import { useRef, useState, useTransition } from "react";

export type EmployeeTableRow = {
  id: string;
  full_name: string;
  phone: string | null;
  role: string;
  is_active: boolean | null;
  created_at: string | null;
};

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

function roleSelectValue(role: string): "cleaner" | "gardener" | "employee" {
  if (role === "gardener") return "gardener";
  if (role === "employee") return "employee";
  return "cleaner";
}

export function EmployeesTable({
  rows,
  canManage,
}: {
  rows: EmployeeTableRow[];
  canManage: boolean;
}) {
  const router = useRouter();
  const editRef = useRef<HTMLDialogElement>(null);
  const deleteRef = useRef<HTMLDialogElement>(null);

  const [editRow, setEditRow] = useState<EmployeeTableRow | null>(null);
  const [deleteRow, setDeleteRow] = useState<EmployeeTableRow | null>(null);
  const [editError, setEditError] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [pendingEdit, editTransition] = useTransition();
  const [pendingDelete, deleteTransition] = useTransition();

  function openEdit(row: EmployeeTableRow) {
    setEditError(null);
    setEditRow(row);
    queueMicrotask(() => editRef.current?.showModal());
  }

  function openDelete(row: EmployeeTableRow) {
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
        const res = await updateEmployeeAction(
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
        fd.set("employee_id", deleteRow.id);
        const res = await deleteEmployeeAction(undefined, fd);
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
        <table className="w-full min-w-[560px] text-sm">
          <thead className="border-b bg-muted/50">
            <tr>
              <th className="px-3 py-2 text-start font-medium">שם</th>
              <th className="px-3 py-2 text-start font-medium">תפקיד</th>
              <th className="px-3 py-2 text-start font-medium">טלפון</th>
              <th className="px-3 py-2 text-start font-medium">פעיל</th>
              <th className="px-3 py-2 text-start font-medium">נוצר</th>
              {canManage ? (
                <th className="px-2 py-2 text-center font-medium">פעולות</th>
              ) : null}
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} className="border-b last:border-0">
                <td className="px-3 py-2 font-medium">{r.full_name}</td>
                <td className="px-3 py-2 text-muted-foreground">
                  {USER_ROLE_LABEL[r.role as UserRole] ?? r.role}
                </td>
                <td className="px-3 py-2 text-muted-foreground">
                  {r.phone ?? "—"}
                </td>
                <td className="px-3 py-2">{r.is_active ? "כן" : "לא"}</td>
                <td className="px-3 py-2 text-muted-foreground">
                  {r.created_at
                    ? new Date(r.created_at).toLocaleDateString("he-IL")
                    : "—"}
                </td>
                {canManage ? (
                  <td className="px-1 py-2">
                    <div className="flex items-center justify-center gap-0.5">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="min-h-[44px] min-w-[44px] shrink-0 text-muted-foreground hover:text-foreground sm:h-9 sm:w-9 sm:min-h-9 sm:min-w-9"
                        aria-label={`עריכת ${r.full_name}`}
                        onClick={() => openEdit(r)}
                      >
                        <PencilIcon />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="min-h-[44px] min-w-[44px] shrink-0 text-destructive hover:text-destructive sm:h-9 sm:w-9 sm:min-h-9 sm:min-w-9"
                        aria-label={`מחיקת ${r.full_name}`}
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
        className="fixed left-1/2 top-1/2 z-50 box-border w-[min(100%-1rem,28rem)] max-h-[min(92dvh,40rem)] -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-xl border bg-card p-0 shadow-lg backdrop:bg-black/45 open:flex open:flex-col"
        onClose={() => setEditRow(null)}
      >
        <div className="flex shrink-0 items-center justify-between gap-2 border-b px-4 py-3">
          <p className="font-semibold">עריכת עובד</p>
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
            <input type="hidden" name="employee_id" value={editRow.id} />

            <div className="grid gap-2">
              <Label htmlFor="edit-field_role">סוג עובד</Label>
              <select
                id="edit-field_role"
                name="field_role"
                required
                key={editRow.id}
                defaultValue={roleSelectValue(editRow.role)}
                className="flex h-11 min-h-[44px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:h-10 sm:min-h-10"
              >
                <option value="cleaner">מנקה</option>
                <option value="gardener">גנן</option>
                <option value="employee">עובד שטח</option>
              </select>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="edit-full_name">שם מלא</Label>
              <Input
                id="edit-full_name"
                name="full_name"
                required
                key={`name-${editRow.id}`}
                defaultValue={editRow.full_name}
                autoComplete="name"
                className="min-h-[44px] sm:min-h-10"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="edit-phone">טלפון נייד (כניסה למערכת)</Label>
              <Input
                id="edit-phone"
                name="phone"
                type="tel"
                required
                key={`phone-${editRow.id}`}
                defaultValue={editRow.phone ?? ""}
                autoComplete="tel"
                dir="ltr"
                placeholder="למשל 050-1234567"
                className="min-h-[44px] text-start sm:min-h-10"
              />
            </div>

            <div className="flex items-center gap-2">
              <input
                id="edit-is_active"
                name="is_active"
                type="checkbox"
                value="true"
                defaultChecked={editRow.is_active !== false}
                className="h-4 w-4 rounded border-input"
              />
              <Label htmlFor="edit-is_active" className="font-normal">
                חשבון פעיל
              </Label>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="edit-new_password">סיסמה חדשה (אופציונלי)</Label>
              <Input
                id="edit-new_password"
                name="new_password"
                type="password"
                autoComplete="new-password"
                dir="ltr"
                placeholder="השאר ריק כדי לא לשנות"
                className="min-h-[44px] sm:min-h-10"
              />
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
          <p className="font-semibold">מחיקת עובד</p>
        </div>
        <div className="space-y-3 px-4 py-4">
          <p className="text-sm text-muted-foreground">
            {deleteRow
              ? `למחוק את ${deleteRow.full_name}? פעולה זו תסיר את גישת ההתחברות של העובד.`
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
