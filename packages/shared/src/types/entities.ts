import type { Database } from "@my-project/supabase";

export type BusinessProfile =
  Database["public"]["Tables"]["business_profiles"]["Row"];
/** ארגון אצלנו = שורה ב־`business_profiles` (מזהה ב־`profiles.business_profile_id`). */
export type Tenant = BusinessProfile;
export type Profile = Database["public"]["Tables"]["profiles"]["Row"];
export type Building = Database["public"]["Tables"]["buildings"]["Row"];
export type Unit = Database["public"]["Tables"]["units"]["Row"];
export type ServiceRequest = Database["public"]["Tables"]["service_requests"]["Row"];
export type ServiceRequestComment =
  Database["public"]["Tables"]["service_request_comments"]["Row"];
export type Announcement = Database["public"]["Tables"]["announcements"]["Row"];
export type Payment = Database["public"]["Tables"]["payments"]["Row"];
export type Notification = Database["public"]["Tables"]["notifications"]["Row"];
export type ServiceType = Database["public"]["Tables"]["service_types"]["Row"];
export type QuoteRequest = Database["public"]["Tables"]["quote_requests"]["Row"];
export type Quote = Database["public"]["Tables"]["quotes"]["Row"];
export type QuoteSignature =
  Database["public"]["Tables"]["quote_signatures"]["Row"];

export type UserRole = Database["public"]["Enums"]["user_role"];
export type RequestStatus = Database["public"]["Enums"]["request_status"];
export type RequestPriority = Database["public"]["Enums"]["request_priority"];
export type RequestCategory = Database["public"]["Enums"]["request_category"];
export type PaymentStatus = Database["public"]["Enums"]["payment_status"];
export type PaymentType = Database["public"]["Enums"]["payment_type"];
export type PaymentMethod = Database["public"]["Enums"]["payment_method"];
export type ResidentStatus = Database["public"]["Enums"]["resident_status"];
export type AnnouncementAudience =
  Database["public"]["Enums"]["announcement_audience"];
export type QuoteStatus = Database["public"]["Enums"]["quote_status"];
