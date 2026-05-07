import type {
  AnnouncementAudience,
  PaymentMethod,
  PaymentStatus,
  PaymentType,
  QuoteStatus,
  RequestCategory,
  RequestPriority,
  RequestStatus,
  ResidentStatus,
  UserRole,
} from "../types/entities";

/** Hebrew UI labels for PostgreSQL enums */
export const USER_ROLE_LABEL: Record<UserRole, string> = {
  super_admin: "מנהל-על",
  manager: "מנהל נכסים",
  employee: "עובד שטח",
  resident: "דייר",
  cleaner: "מנקה",
  gardener: "גנן",
};

export const REQUEST_STATUS_LABEL: Record<RequestStatus, string> = {
  open: "פתוח",
  assigned: "הוקצה",
  in_progress: "בטיפול",
  resolved: "טופל",
  closed: "סגור",
};

export const REQUEST_PRIORITY_LABEL: Record<RequestPriority, string> = {
  low: "נמוכה",
  medium: "בינונית",
  high: "גבוהה",
  urgent: "דחוף",
};

export const REQUEST_CATEGORY_LABEL: Record<RequestCategory, string> = {
  electrical: "חשמל",
  plumbing: "אינסטלציה",
  cleaning: "ניקיון",
  elevator: "מעלית",
  garden: "גינון",
  security: "ביטחון",
  other: "אחר",
};

export const PAYMENT_STATUS_LABEL: Record<PaymentStatus, string> = {
  pending: "ממתין",
  paid: "שולם",
  overdue: "באיחור",
  cancelled: "בוטל",
};

export const PAYMENT_TYPE_LABEL: Record<PaymentType, string> = {
  monthly_fee: "ועד חודשי",
  one_time: "חד-פעמי",
  fine: "קנס",
};

export const PAYMENT_METHOD_LABEL: Record<PaymentMethod, string> = {
  credit_card: "כרטיס אשראי",
  bit: "ביט",
  bank_transfer: "העברה בנקאית",
  cash: "מזומן",
};

export const RESIDENT_STATUS_LABEL: Record<ResidentStatus, string> = {
  active: "פעיל",
  former: "לשעבר",
};

export const ANNOUNCEMENT_AUDIENCE_LABEL: Record<
  AnnouncementAudience,
  string
> = {
  all: "כולם",
  residents: "דיירים",
  employees: "עובדים",
};

export const QUOTE_STATUS_LABEL: Record<QuoteStatus, string> = {
  pending: "ממתין",
  sent: "נשלחה",
  approved: "אושרה",
  rejected: "נדחתה",
  completed: "הושלמה",
};
