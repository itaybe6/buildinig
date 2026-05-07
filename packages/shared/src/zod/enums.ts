import { z } from "zod";

/** Mirrors Postgres enum `user_role` */
export const userRoleSchema = z.enum([
  "super_admin",
  "manager",
  "employee",
  "resident",
  "cleaner",
  "gardener",
]);

/** Mirrors Postgres enum `request_status` */
export const requestStatusSchema = z.enum([
  "open",
  "assigned",
  "in_progress",
  "resolved",
  "closed",
]);

/** Mirrors Postgres enum `request_priority` */
export const requestPrioritySchema = z.enum([
  "low",
  "medium",
  "high",
  "urgent",
]);

/** Mirrors Postgres enum `request_category` */
export const requestCategorySchema = z.enum([
  "electrical",
  "plumbing",
  "cleaning",
  "elevator",
  "garden",
  "security",
  "other",
]);

/** Mirrors Postgres enum `payment_status` */
export const paymentStatusSchema = z.enum([
  "pending",
  "paid",
  "overdue",
  "cancelled",
]);

/** Mirrors Postgres enum `payment_type` */
export const paymentTypeSchema = z.enum([
  "monthly_fee",
  "one_time",
  "fine",
]);

/** Mirrors Postgres enum `payment_method` */
export const paymentMethodSchema = z.enum([
  "credit_card",
  "bit",
  "bank_transfer",
  "cash",
]);

/** Mirrors Postgres enum `resident_status` */
export const residentStatusSchema = z.enum(["active", "former"]);

/** Mirrors Postgres enum `announcement_audience` */
export const announcementAudienceSchema = z.enum([
  "all",
  "residents",
  "employees",
]);

/** Mirrors Postgres enum `quote_status` */
export const quoteStatusSchema = z.enum([
  "pending",
  "sent",
  "approved",
  "rejected",
  "completed",
]);
