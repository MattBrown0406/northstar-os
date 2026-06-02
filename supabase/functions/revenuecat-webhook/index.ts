import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const PRODUCT_TIER_MAP: Record<string, string> = {
  intentus_premium_monthly: "premium",
  intentus_coach_monthly: "coach",
};

const DOWNGRADE_EVENTS = new Set([
  "CANCELLATION",
  "EXPIRATION",
  "BILLING_ISSUE",
]);

const UPGRADE_EVENTS = new Set([
  "INITIAL_PURCHASE",
  "RENEWAL",
  "PRODUCT_CHANGE",
  "UNCANCELLATION",
]);

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Optional shared-secret check (RevenueCat sends Authorization header you configure)
    const expectedSecret = Deno.env.get("REVENUECAT_WEBHOOK_SECRET");
    if (expectedSecret) {
      const auth = req.headers.get("Authorization");
      if (auth !== `Bearer ${expectedSecret}`) {
        return new Response(JSON.stringify({ error: "Unauthorized" }), {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const admin = createClient(supabaseUrl, serviceRoleKey);

    const payload = await req.json();
    const event = payload?.event ?? payload;
    const eventType: string = event?.type ?? "UNKNOWN";
    const appUserId: string | undefined = event?.app_user_id ?? event?.original_app_user_id;
    const productId: string | undefined = event?.product_id;

    // Always log the raw event
    await admin.from("revenuecat_events").insert({
      event_type: eventType,
      app_user_id: appUserId ?? "unknown",
      product_id: productId ?? null,
      raw_payload: payload,
    });

    if (!appUserId) {
      return new Response(JSON.stringify({ ok: true, note: "no app_user_id" }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let newTier: string | null = null;
    if (DOWNGRADE_EVENTS.has(eventType)) {
      newTier = "free";
    } else if (UPGRADE_EVENTS.has(eventType) && productId) {
      newTier = PRODUCT_TIER_MAP[productId] ?? null;
    }

    if (newTier) {
      const { error } = await admin
        .from("profiles")
        .update({ plan_tier: newTier })
        .eq("user_id", appUserId);
      if (error) console.error("Failed to update plan_tier:", error);
    }

    return new Response(JSON.stringify({ ok: true, event_type: eventType, tier: newTier }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("revenuecat-webhook error:", error);
    // Still return 200 so RevenueCat doesn't retry indefinitely on malformed events
    return new Response(JSON.stringify({ ok: false, error: (error as Error).message }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
