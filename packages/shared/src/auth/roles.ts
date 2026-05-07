import type { UserRole } from "../types/entities";

/** משתמשי שטח — הקצאות / עובדים (כולל תפקיד legacy `employee`). */
export function isFieldWorkerRole(role: UserRole): boolean {
  return (
    role === "employee" ||
    role === "cleaner" ||
    role === "gardener"
  );
}

export type FieldStaffRole = "cleaner" | "gardener";
