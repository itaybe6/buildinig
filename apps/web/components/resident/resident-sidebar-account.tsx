"use client";

import { Button } from "@/components/ui/button";
import { ResidentProfileEditDialog } from "@/components/resident/resident-profile-edit-dialog";
import { useState } from "react";

function formatIsraelPhoneDisplay(phone: string | null): string {
  if (!phone?.trim()) return "לא צוין";
  const d = phone.replace(/\D/g, "");
  if (d.length === 9 && d.startsWith("5")) {
    return `0${d.slice(0, 2)}-${d.slice(2)}`;
  }
  if (d.length === 10 && d.startsWith("05")) {
    return `${d.slice(0, 3)}-${d.slice(3)}`;
  }
  return phone.trim();
}

function PencilIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
      <path d="m15 5 4 4" />
    </svg>
  );
}

export function ResidentSidebarAccount({
  displayName,
  phone,
}: {
  displayName: string;
  phone: string | null;
}) {
  const [dialogOpen, setDialogOpen] = useState(false);

  return (
    <>
      <div className="mb-4 rounded-lg border bg-card px-3 py-3 text-sm shadow-sm">
        <div className="mb-2 flex items-center justify-between gap-2">
          <p className="text-xs font-medium text-muted-foreground">הפרטים שלי</p>
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="h-9 w-9 shrink-0"
            title="עריכת פרטים וסיסמה"
            aria-label="עריכת פרטים וסיסמה"
            onClick={() => setDialogOpen(true)}
          >
            <PencilIcon />
          </Button>
        </div>
        <div className="space-y-2">
          <div>
            <p className="text-xs text-muted-foreground">שם</p>
            <p className="truncate font-medium">{displayName.trim() || "—"}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">טלפון</p>
            <p className="font-medium tabular-nums">
              {formatIsraelPhoneDisplay(phone)}
            </p>
          </div>
        </div>
      </div>

      <ResidentProfileEditDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        displayName={displayName}
        phone={phone}
      />
    </>
  );
}
