// Docs: https://www.instantdb.com/docs/modeling-data

import { i } from "@instantdb/react";

const _schema = i.schema({
  entities: {
    $files: i.entity({
      path: i.string().unique().indexed(),
      url: i.string(),
    }),
    $users: i.entity({
      email: i.string().unique().indexed().optional(),
      imageURL: i.string().optional(),
      type: i.string().optional(),
    }),
    admins: i.entity({
      email: i.string().unique().indexed(),
      name: i.string(),
      passwordHash: i.string(),
      createdAt: i.number().indexed(),
    }),
    students: i.entity({
      studentId: i.string().unique().indexed(),
      fullName: i.string(),
      phone: i.string().unique().indexed(),
      schoolType: i.string().indexed(),
      classLevel: i.string().indexed(),
      campus: i.string().indexed().optional(),
      studyMode: i.string().indexed().optional(),
      nationalityGroup: i.string().indexed().optional(),
      passwordHash: i.string(),
      isFirstLogin: i.boolean(),
      createdAt: i.number().indexed(),
    }),
    feeTypes: i.entity({
      feeName: i.string().indexed(),
      amount: i.number(),
      schoolType: i.string().indexed(),
      classLevel: i.string().indexed(),
      allClasses: i.boolean(),
      campus: i.string().indexed().optional(),
      studyMode: i.string().indexed().optional(),
      allCampuses: i.boolean().optional(),
      allStudyModes: i.boolean().optional(),
      nationalityGroup: i.string().indexed().optional(),
      term: i.string().indexed(),
      createdAt: i.number().indexed(),
    }),
    payments: i.entity({
      transactionId: i.string().unique().indexed(),
      amountPaid: i.number(),
      balance: i.number(),
      paymentMethod: i.string().indexed(),
      paymentDate: i.number().indexed(),
      term: i.string().indexed(),
      feeName: i.string(),
      feeAmount: i.number(),
      currency: i.string().indexed().optional(),
      createdAt: i.number().indexed(),
    }),
    smsLogs: i.entity({
      message: i.string(),
      recipients: i.json(),
      recipientCount: i.number().indexed(),
      sendType: i.string().indexed(),
      status: i.string().indexed(),
      sentAt: i.number().indexed(),
      sentByAdminId: i.string(),
      sentByAdminName: i.string(),
      arkeselMessageIds: i.json(),
      creditsUsed: i.number(),
      errorMessage: i.string().optional(),
    }),
  },
  links: {
    studentPayments: {
      forward: {
        on: "students",
        has: "many",
        label: "payments",
      },
      reverse: {
        on: "payments",
        has: "one",
        label: "student",
      },
    },
    paymentFeeType: {
      forward: {
        on: "payments",
        has: "one",
        label: "feeType",
      },
      reverse: {
        on: "feeTypes",
        has: "many",
        label: "payments",
      },
    },
  },
});

// This helps TypeScript display nicer intellisense
type _AppSchema = typeof _schema;
// eslint-disable-next-line @typescript-eslint/no-empty-object-type
interface AppSchema extends _AppSchema {}
const schema: AppSchema = _schema;

export type { AppSchema };
export default schema;
