import type { UserRole } from "@my-project/shared";

export type NavItem = {
  href: string;
  label: string;
  /** Empty = כל התפקידים המורשים בלוח הניהול */
  roles?: UserRole[];
};

export const MANAGER_NAV: NavItem[] = [
  { href: "/dashboard", label: "לוח בקרה" },
  { href: "/buildings", label: "בניינים" },
  { href: "/residents", label: "דיירים" },
  { href: "/employees", label: "עובדים" },
  { href: "/service-requests", label: "קריאות שירות" },
  { href: "/service-types", label: "סוגי שירות" },
  { href: "/quote-requests", label: "בקשות הצעת מחיר" },
  { href: "/announcements", label: "לוח מודעות" },
  { href: "/payments", label: "תשלומים" },
  { href: "/settings/tenant", label: "הגדרות ארגון" },
];

/** תפריט ייעודי למנהל-על — ללא עמודי ממשק המנהל */
export const SUPER_ADMIN_NAV: NavItem[] = [
  { href: "/super-admin/dashboard", label: "סקירת עסק" },
  { href: "/super-admin/tenants", label: "לקוחות (מנהלים)" },
];

export const EMPLOYEE_WEB_NAV: NavItem[] = [
  { href: "/dashboard", label: "לוח בקרה" },
  { href: "/service-requests", label: "קריאות שירות" },
  { href: "/buildings", label: "בניינים" },
];

export function getSidebarSections(role: UserRole): {
  primary: NavItem[];
  admin?: NavItem[];
} {
  if (role === "super_admin") {
    return { primary: SUPER_ADMIN_NAV };
  }
  if (role === "manager") {
    return { primary: MANAGER_NAV };
  }
  if (role === "employee") {
    return { primary: EMPLOYEE_WEB_NAV };
  }
  return { primary: [] };
}
