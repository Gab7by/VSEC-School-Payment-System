// Server-side safety net for payment recording. MakePaymentForm.tsx records a
// payment client-side immediately after Paystack's checkout reports success —
// but if the browser closes, loses connection, or that write throws before it
// finishes, the charge still happened on Paystack's side while our database
// never learns about it. This webhook is Paystack calling us directly, so it
// still records the payment even when the student's browser never gets the
// chance to. It's idempotent (checks for an existing payment by
// transactionId first) so it's safe to run alongside the client-side write
// rather than replacing it — the normal case is the client already wrote the
// record and this just no-ops moments later.
import { init, id, tx } from "@instantdb/admin";
import { createHmac, timingSafeEqual } from "node:crypto";
import type { IncomingMessage } from "node:http";
import schema from "../src/instant.schema";

// Minimal request/response typing matching Vercel's Node.js runtime shape,
// same rationale as api/send-sms.ts — but this handler needs the raw,
// unparsed request body (signature verification must hash the exact bytes
// Paystack sent), so body parsing is disabled below and we read the stream
// ourselves instead of relying on an auto-parsed `req.body`.
type ApiRequest = Pick<IncomingMessage, "method" | "headers" | "on">;
interface ApiResponse {
  status(code: number): ApiResponse;
  json(body: unknown): void;
}

declare const process: { env: Record<string, string | undefined> };

export const config = {
  api: { bodyParser: false },
};

function readRawBody(req: ApiRequest): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    req.on("data", (chunk: Buffer) => chunks.push(chunk));
    req.on("end", () => resolve(Buffer.concat(chunks)));
    req.on("error", reject);
  });
}

function isValidSignature(rawBody: Buffer, signatureHeader: string, secret: string): boolean {
  const expected = createHmac("sha512", secret).update(rawBody).digest("hex");
  const expectedBuf = Buffer.from(expected, "utf8");
  const providedBuf = Buffer.from(signatureHeader, "utf8");
  if (expectedBuf.length !== providedBuf.length) return false;
  return timingSafeEqual(expectedBuf, providedBuf);
}

export default async function handler(req: ApiRequest, res: ApiResponse) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed." });
    return;
  }

  const secret = process.env.PAYSTACK_SECRET_KEY;
  if (!secret) {
    res.status(500).json({ error: "Paystack webhook is not configured." });
    return;
  }

  const rawBody = await readRawBody(req);
  const signature = req.headers["x-paystack-signature"];
  if (typeof signature !== "string" || !isValidSignature(rawBody, signature, secret)) {
    res.status(401).json({ error: "Invalid signature." });
    return;
  }

  let event: {
    event?: string;
    data?: {
      reference?: string;
      amount?: number;
      currency?: string;
      paid_at?: string;
      metadata?: { studentId?: string; feeTypeId?: string; term?: string };
    };
  };
  try {
    event = JSON.parse(rawBody.toString("utf8"));
  } catch {
    res.status(400).json({ error: "Malformed payload." });
    return;
  }

  // Only charge.success carries a completed payment; acknowledge anything
  // else so Paystack doesn't keep retrying events we don't act on.
  if (event.event !== "charge.success" || !event.data) {
    res.status(200).json({ status: "ignored" });
    return;
  }

  const { reference, amount, currency, paid_at, metadata } = event.data;
  const studentId = metadata?.studentId;
  const feeTypeId = metadata?.feeTypeId;
  const term = metadata?.term;

  if (!reference || !amount || !studentId || !feeTypeId || !term) {
    // Predates this fix (no metadata was sent) or a malformed event — nothing
    // safe to reconstruct automatically. Acknowledge so Paystack stops
    // retrying; this transaction needs the same manual verify-and-reconcile
    // process used for the incident this webhook was built to prevent.
    res.status(200).json({ status: "missing metadata, skipped" });
    return;
  }

  const db = init({
    appId: process.env.VITE_INSTANT_APP_ID as string,
    adminToken: process.env.INSTANT_APP_ADMIN_TOKEN as string,
    schema,
  });

  try {
    const existing = await db.query({
      payments: { $: { where: { transactionId: reference } } },
    });
    if (existing.payments.length > 0) {
      res.status(200).json({ status: "already recorded" });
      return;
    }

    const { feeTypes, students } = await db.query({
      feeTypes: { $: { where: { id: feeTypeId } } },
      students: { $: { where: { id: studentId } }, payments: { feeType: {} } },
    });
    const feeType = feeTypes[0];
    const student = students[0];
    if (!feeType || !student) {
      res.status(200).json({ status: "unknown student or fee type, skipped" });
      return;
    }

    const alreadyPaid = (student.payments ?? [])
      .filter((p) => p.feeType?.id === feeTypeId)
      .reduce((sum, p) => sum + (p.amountPaid ?? 0), 0);
    const remainingBalance = Math.max(0, (feeType.amount ?? 0) - alreadyPaid);
    const amountPaid = amount / 100;
    const newBalance = Math.max(0, remainingBalance - amountPaid);
    const paidAtMs = paid_at ? Date.parse(paid_at) : Date.now();

    const newPaymentId = id();
    await db.transact([
      tx.payments[newPaymentId]
        .update({
          transactionId: reference,
          amountPaid,
          balance: newBalance,
          paymentMethod: "Paystack",
          paymentDate: paidAtMs,
          term,
          feeName: feeType.feeName ?? "",
          feeAmount: feeType.amount ?? 0,
          currency: currency ?? "GHS",
          createdAt: paidAtMs,
        })
        .link({ feeType: feeTypeId }),
      tx.students[studentId].link({ payments: newPaymentId }),
    ]);

    res.status(200).json({ status: "recorded" });
  } catch (err) {
    // A transient failure here should make Paystack retry the webhook later
    // rather than silently losing the payment a second time.
    res.status(500).json({ error: err instanceof Error ? err.message : "Failed to record payment." });
  }
}
