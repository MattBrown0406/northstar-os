// Pure validation helpers: no network or database side effects.
export function revenueCatEventDecision(event: Record<string, unknown>) {
  if (event.environment !== "PRODUCTION") return "ignore";
  if (typeof event.id !== "string" || !event.id ||
      typeof event.app_user_id !== "string" ||
      !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(event.app_user_id)) return "invalid";
  // Cancellation disables renewal; billing issues may be in a grace period.
  // Neither is proof that current access has expired.
  if (!["INITIAL_PURCHASE", "RENEWAL", "PRODUCT_CHANGE", "UNCANCELLATION", "EXPIRATION"].includes(String(event.type))) return "ignore";
  if (!["intentus_premium_monthly", "intentus_coach_monthly"].includes(String(event.product_id))) return "ignore";
  return "requires_atomic_entitlement_application";
}

export async function verifySquareSignature(
  signatureKey: string, notificationUrl: string, rawBody: string, providedSignature: string,
): Promise<boolean> {
  try {
    const enc = new TextEncoder();
    const key = await crypto.subtle.importKey("raw", enc.encode(signatureKey),
      { name: "HMAC", hash: "SHA-256" }, false, ["verify"]);
    const signature = Uint8Array.from(atob(providedSignature), (c) => c.charCodeAt(0));
    return await crypto.subtle.verify("HMAC", key, signature, enc.encode(notificationUrl + rawBody));
  } catch {
    return false;
  }
}

export function inviteTier(value: unknown): "free" | "pro" | "premium" | null {
  if (value === undefined || value === null) return "free";
  return value === "free" || value === "pro" || value === "premium" ? value : null;
}

export function chatMode(value: unknown): "chat" | "check-in-debrief" | null {
  if (value === undefined) return "chat";
  return value === "chat" || value === "check-in-debrief" ? value : null;
}
