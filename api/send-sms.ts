// Minimal request/response typing that matches Vercel's Node.js runtime shape
// (req.body is auto-parsed JSON, res has status()/json() helpers). Avoids taking
// on @vercel/node purely for types, since it drags in unrelated build-tooling
// dependencies with unresolved high-severity advisories.
interface ApiRequest {
  method?: string;
  body?: unknown;
}
interface ApiResponse {
  status(code: number): ApiResponse;
  json(body: unknown): void;
}

// Vercel's isolated build-time type-check for /api functions doesn't reliably
// pick up @types/node via this repo's tsconfig project-reference setup, so
// declare just what this file needs rather than depending on ambient globals.
declare const process: { env: Record<string, string | undefined> };

const ARKESEL_SEND_URL = "https://sms.arkesel.com/api/v2/sms/send";
const BATCH_SIZE = 100;
const PHONE_PATTERN = /^233\d{9}$/;

type SendResult = {
  status: "sent" | "failed" | "partial";
  recipientCount: number;
  sentCount: number;
  failedCount: number;
  messageIds: string[];
  creditsUsed: number;
  errors: string[];
};

function chunk<T>(items: T[], size: number): T[][] {
  const batches: T[][] = [];
  for (let i = 0; i < items.length; i += size) {
    batches.push(items.slice(i, i + size));
  }
  return batches;
}

async function sendBatch(
  batch: string[],
  message: string,
  apiKey: string,
  senderId: string
): Promise<{ ok: boolean; messageId?: string; creditsUsed: number; error?: string }> {
  try {
    const response = await fetch(ARKESEL_SEND_URL, {
      method: "POST",
      headers: {
        "api-key": apiKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        sender: senderId,
        message,
        recipients: batch,
      }),
    });

    const data = (await response.json().catch(() => null)) as
      | { status?: string; data?: { id?: string; credits_used?: number }; message?: string; error?: string }
      | null;

    if (!response.ok || !data || data.status !== "success") {
      const errorMessage =
        data?.message ?? data?.error ?? `Arkesel request failed (HTTP ${response.status}).`;
      return { ok: false, creditsUsed: 0, error: errorMessage };
    }

    return {
      ok: true,
      messageId: data.data?.id,
      creditsUsed: data.data?.credits_used ?? 0,
    };
  } catch (err) {
    return {
      ok: false,
      creditsUsed: 0,
      error: err instanceof Error ? err.message : "Network error contacting Arkesel.",
    };
  }
}

export default async function handler(req: ApiRequest, res: ApiResponse) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed." });
    return;
  }

  const body = (req.body ?? {}) as { message?: unknown; recipients?: unknown };
  const message = typeof body.message === "string" ? body.message.trim() : "";
  const recipients = Array.isArray(body.recipients)
    ? body.recipients.filter((r): r is string => typeof r === "string")
    : [];

  if (!message) {
    res.status(400).json({ error: "Message is required." });
    return;
  }

  const validRecipients = recipients.filter((r) => PHONE_PATTERN.test(r));
  if (validRecipients.length === 0) {
    res.status(400).json({ error: "No valid recipients were provided." });
    return;
  }

  const apiKey = process.env.ARKESEL_API_KEY;
  const senderId = process.env.ARKESEL_SENDER_ID;
  if (!apiKey || !senderId) {
    res.status(500).json({ error: "SMS service is not configured." });
    return;
  }

  const batches = chunk(validRecipients, BATCH_SIZE);
  const messageIds: string[] = [];
  const errors: string[] = [];
  let sentCount = 0;
  let creditsUsed = 0;

  for (const batch of batches) {
    const result = await sendBatch(batch, message, apiKey, senderId);
    if (result.ok) {
      sentCount += batch.length;
      creditsUsed += result.creditsUsed;
      if (result.messageId) messageIds.push(result.messageId);
    } else {
      errors.push(result.error ?? "Unknown error.");
    }
  }

  const failedCount = validRecipients.length - sentCount;
  const status: SendResult["status"] =
    failedCount === 0 ? "sent" : sentCount === 0 ? "failed" : "partial";

  const result: SendResult = {
    status,
    recipientCount: validRecipients.length,
    sentCount,
    failedCount,
    messageIds,
    creditsUsed,
    errors,
  };

  res.status(200).json(result);
}
