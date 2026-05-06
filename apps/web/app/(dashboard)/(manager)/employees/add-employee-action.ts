"use server";

import { getManagerTenantContext } from "@/lib/dashboard/session";
import { createEmployeeForBusiness } from "@/lib/manager/create-employee";
import { revalidatePath } from "next/cache";

export type AddEmployeeActionState =
  | { ok: true }
  | { ok: false; error: string };

export async function addEmployeeAction(
  _prev: AddEmployeeActionState | undefined,
  formData: FormData
): Promise<AddEmployeeActionState> {
  const ctx = await getManagerTenantContext();
  if (!ctx.ok) {
    return { ok: false, error: "אין הרשאת מנהל או חסר פרופיל עסק." };
  }
  if (ctx.profile.role !== "manager") {
    return { ok: false, error: "פעולה זו זמינה למנהלים בלבד." };
  }

  const result = await createEmployeeForBusiness({
    businessProfileId: ctx.businessProfileId,
    fullName: String(formData.get("full_name") ?? ""),
    email: String(formData.get("email") ?? ""),
    password: String(formData.get("password") ?? ""),
    phone: String(formData.get("phone") ?? ""),
  });

  if (!result.ok) {
    return result;
  }

  revalidatePath("/employees");
  return { ok: true };
}
