import { isFieldWorkerRole, type UserRole } from "@my-project/shared";

export type NavItem = {
  href: string;
  label: string;
  /** Empty = כל התפקידים המורשים בלוח הניהול */
  roles?: UserRole[];
};

export type NavGroup = {
  /** כותרת קבוצה בסרגל — לדוגמה «תושב» / «עובד» כמו חלוקת התיקיות במובייל */
  title: string | null;
  items: NavItem[];
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
  { href: "/profile", label: "פרופיל" },
  { href: "/settings/payment", label: "הגדרות תשלום" },
  { href: "/settings/tenant", label: "הגדרות ארגון" },
];

/** תפריט ייעודי למנהל-על — ללא עמודי ממשק המנהל */
export const SUPER_ADMIN_NAV: NavItem[] = [
  { href: "/super-admin/dashboard", label: "סקירת עסק" },
  { href: "/super-admin/tenants", label: "לקוחות (מנהלים)" },
];

/** עמודי תושב — מקביל ל־(resident) במובייל (נתיבים נפרדים מממשק המנהל) */
export const RESIDENT_NAV: NavItem[] = [
  { href: "/requests", label: "בית" },
  { href: "/quotes", label: "הצעות" },
  { href: "/resident-payments", label: "תשלומים" },
];

/** עמודי עובד — מקביל ל־(employee) במובייל */
export const EMPLOYEE_NAV: NavItem[] = [
  { href: "/assignments", label: "המשימות שלי" },
  { href: "/all-requests", label: "כל הקריאות" },
];

export function getSidebarSections(role: UserRole): {
  groups: NavGroup[];
  admin?: NavItem[];
} {
  if (role === "super_admin") {
    return { groups: [{ title: null, items: SUPER_ADMIN_NAV }] };
  }
  if (role === "manager") {
    return {
      groups: [{ title: null, items: MANAGER_NAV }],
    };
  }
  if (isFieldWorkerRole(role)) {
    return {
      groups: [{ title: "עובד", items: EMPLOYEE_NAV }],
    };
  }
  if (role === "resident") {
    return {
      groups: [{ title: "תושב", items: RESIDENT_NAV }],
    };
  }
  return { groups: [] };
}
