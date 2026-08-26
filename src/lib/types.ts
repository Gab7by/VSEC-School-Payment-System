import type { InstaQLEntity } from "@instantdb/react";
import type { AppSchema } from "../instant.schema";

export type Admin = InstaQLEntity<AppSchema, "admins">;
export type Student = InstaQLEntity<AppSchema, "students">;
export type FeeType = InstaQLEntity<AppSchema, "feeTypes">;
export type Payment = InstaQLEntity<AppSchema, "payments">;

export type PaymentWithLinks = InstaQLEntity<
  AppSchema,
  "payments",
  { feeType: object; student: object }
>;

export type StudentWithPayments = InstaQLEntity<
  AppSchema,
  "students",
  { payments: { feeType: object } }
>;

export type FeeTypeWithStudent = InstaQLEntity<
  AppSchema,
  "feeTypes",
  { assignedStudent: object }
>;

export type Session = {
  id: string;
  role: "admin" | "student";
  name: string;
  email?: string;
  phone?: string;
  studentId?: string;
  schoolType?: string;
  classLevel?: string;
  campus?: string;
  studyMode?: string;
  nationalityGroup?: string;
  isFirstLogin?: boolean;
};
