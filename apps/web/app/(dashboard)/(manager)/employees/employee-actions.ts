"use server";

import { getManagerTenantContext } from "@/lib/dashboard/session";
import {
  deleteEmployeeForBusiness,
  updateEmployeeForBusiness,
  type UpdatableEmployeeRole,
} from "@/lib/manager/mutate-employee";
import { revalidatePath } from "next/cache";

export type EmployeeMutationState =
  | { ok: true }
  | { ok: false; error: string };

function parseFieldRole(raw: string): UpdatableEmployeeRole {
  if (raw === "gardener") return "gardener";
  if (raw === "employee") return "employee";
  return "cleaner";
}

export async function updateEmployeeAction(
  _prev: EmployeeMutationState | undefined,
  formData: FormData
): Promise<EmployeeMutationState> {
  const ctx = await getManagerTenantContext();
  if (!ctx.ok) {
    return { ok: false, error: "אין הרשאת מנהל או חסר פרופיל עסק." };
  }
  if (ctx.profile.role !== "manager") {
    return { ok: false, error: "פעולה זו זמינה למנהלים בלבד." };
  }

  const employeeProfileId = String(formData.get("employee_id") ?? "").trim();
  if (!employeeProfileId) {
    return { ok: false, error: "חסר מזהה עובד." };
  }

  const isActive = formData.get("is_active") === "true";

  const result = await updateEmployeeForBusiness({
    businessProfileId: ctx.businessProfileId,
    employeeProfileId,
    fullName: String(formData.get("full_name") ?? ""),
    phoneRaw: String(formData.get("phone") ?? ""),
    fieldRole: parseFieldRole(String(formData.get("field_role") ?? "")),
    isActive,
    newPassword: String(formData.get("new_password") ?? "").trim() || undefined,
  });

  if (!result.ok) {
    return result;
  }

  revalidatePath("/employees");
  return { ok: true };
}

export async function deleteEmployeeAction(
  _prev: EmployeeMutationState | undefined,
  formData: FormData
): Promise<EmployeeMutationState> {
  const ctx = await getManagerTenantContext();
  if (!ctx.ok) {
    return { ok: false, error: "אין הרשאת מנהל או חסר פרופיל עסק." };
  }
  if (ctx.profile.role !== "manager") {
    return { ok: false, error: "פעולה זו זמינה למנהלים בלבד." };
  }

  const employeeProfileId = String(formData.get("employee_id") ?? "").trim();
  if (!employeeProfileId) {
    return { ok: false, error: "חסר מזהה עובד." };
  }

  const result = await deleteEmployeeForBusiness({
    businessProfileId: ctx.businessProfileId,
    employeeProfileId,
  });

  if (!result.ok) {
    return result;
  }

  revalidatePath("/employees");
  return { ok: true };
}
