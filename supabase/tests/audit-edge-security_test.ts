import { chatMode, inviteTier, revenueCatEventDecision, verifySquareSignature } from "../functions/_shared/payment-security.ts";
import { handler } from "../functions/revenuecat-webhook/index.ts";
function equal(actual: unknown, expected: unknown) { if (actual !== expected) throw new Error(`${actual} !== ${expected}`); }
const event = { id: "evt-1", environment: "PRODUCTION", app_user_id: "11111111-1111-4111-8111-111111111111", type: "INITIAL_PURCHASE", product_id: "intentus_premium_monthly" };
Deno.test("RevenueCat rejects sandbox, unknown products and unsafe downgrades", () => {
  equal(revenueCatEventDecision(event), "requires_atomic_entitlement_application");
  for (const update of [{ environment: "SANDBOX" }, { product_id: "unrelated" }, { type: "CANCELLATION" }, { type: "BILLING_ISSUE" }]) equal(revenueCatEventDecision({ ...event, ...update }), "ignore");
  equal(revenueCatEventDecision({ ...event, id: "" }), "invalid");
  equal(revenueCatEventDecision({ ...event, app_user_id: "$RCAnonymousID:x" }), "invalid");
});
Deno.test("Square HMAC binds exact URL, body and dedicated key", async () => {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey("raw", enc.encode("test-key"), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const url = "https://example.test/functions/v1/square-webhook", body = '{"id":"one"}';
  const sig = btoa(String.fromCharCode(...new Uint8Array(await crypto.subtle.sign("HMAC", key, enc.encode(url + body)))));
  equal(await verifySquareSignature("test-key", url, body, sig), true);
  equal(await verifySquareSignature("other-app", url, body, sig), false);
  equal(await verifySquareSignature("test-key", url + "/", body, sig), false);
  equal(await verifySquareSignature("test-key", url, body + " ", sig), false);
  equal(await verifySquareSignature("test-key", url, body, "bad!"), false);
});
Deno.test("Invite cannot mint Coach and absent chat mode cannot bypass tier checks", () => {
  equal(inviteTier("coach"), null); equal(inviteTier("admin"), null);
  equal(inviteTier("premium"), "premium"); equal(inviteTier(undefined), "free");
  equal(chatMode(undefined), "chat"); equal(chatMode("bypass"), null); equal(chatMode(null), null);
});
Deno.test("Actual RevenueCat handler fails closed and rejects incomplete authenticated events", async () => {
  const previous = Deno.env.get("REVENUECAT_WEBHOOK_SECRET");
  const request = (authorization?: string) => new Request("https://example.test", { method: "POST", headers: authorization ? { Authorization: authorization } : {}, body: JSON.stringify({ event }) });
  try {
    Deno.env.delete("REVENUECAT_WEBHOOK_SECRET");
    equal((await handler(request())).status, 503);
    Deno.env.set("REVENUECAT_WEBHOOK_SECRET", "local-test-only");
    equal((await handler(request())).status, 401);
    equal((await handler(request("Bearer wrong"))).status, 401);
    // This legacy fixture omits app/store/timestamps; reject it before configuration or DB access.
    // Valid-event transient DB failures are covered by audit-rc-handler_test.ts.
    for (let i = 0; i < 2; i++) equal((await handler(request("Bearer local-test-only"))).status, 400);
  } finally {
    if (previous === undefined) Deno.env.delete("REVENUECAT_WEBHOOK_SECRET"); else Deno.env.set("REVENUECAT_WEBHOOK_SECRET", previous);
  }
});
