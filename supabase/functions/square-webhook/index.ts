import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-square-hmacsha256-signature",
};

async function verifySquareSignature(
  signatureKey: string,
  notificationUrl: string,
  rawBody: string,
  providedSignature: string,
): Promise<boolean> {
  try {
    const enc = new TextEncoder();
    const key = await crypto.subtle.importKey(
      "raw",
      enc.encode(signatureKey),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign"],
    );
    const sig = await crypto.subtle.sign("HMAC", key, enc.encode(notificationUrl + rawBody));
    const computed = btoa(String.fromCharCode(...new Uint8Array(sig)));
    return computed === providedSignature;
  } catch (e) {
    console.error("Signature verification error:", e);
    return false;
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const rawBody = await req.text();

  try {
    const signatureKey = Deno.env.get("SQUARE_WEBHOOK_SIGNATURE_KEY");
    const providedSignature = req.headers.get("x-square-hmacsha256-signature");
    const notificationUrl = `${Deno.env.get("SUPABASE_URL")!.replace(/\/$/, "")}/functions/v1/square-webhook`;

    if (!signatureKey || !providedSignature) {
      return new Response(JSON.stringify({ error: "Missing signature" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const valid = await verifySquareSignature(signatureKey, notificationUrl, rawBody, providedSignature);
    if (!valid) {
      return new Response(JSON.stringify({ error: "Invalid signature" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const admin = createClient(supabaseUrl, serviceRoleKey);

    const payload = JSON.parse(rawBody);
    const eventType: string = payload?.type ?? "unknown";
    const data = payload?.data?.object ?? {};

    // Find buyer email from payload (varies by event type)
    const buyerEmail: string | undefined =
      data?.payment?.buyer_email_address ??
      data?.order?.buyer_email_address ??
      data?.subscription?.buyer_email_address ??
      payload?.data?.object?.buyer_email_address;

    // Log raw event
    await admin.from("revenuecat_events").insert({
      event_type: eventType,
      app_user_id: buyerEmail ?? "unknown",
      product_id: data?.payment?.id ?? data?.subscription?.id ?? null,
      raw_payload: payload,
      source: "web",
    });

    // Determine plan_tier change
    let newTier: string | null = null;
    if (eventType === "payment.completed" || eventType === "payment.updated") {
      const status = data?.payment?.status;
      if (status === "COMPLETED" || status === "APPROVED") newTier = "coach";
    } else if (eventType === "subscription.updated") {
      const status = data?.subscription?.status;
      if (status === "CANCELED" || status === "DEACTIVATED") newTier = "free";
    }

    if (newTier && buyerEmail) {
      // Look up user by email via auth.admin
      const { data: usersData, error: listError } = await admin.auth.admin.listUsers();
      if (listError) {
        console.error("Failed to list users:", listError);
      } else {
        const matched = usersData?.users?.find((u) => u.email?.toLowerCase() === buyerEmail.toLowerCase());
        if (matched) {
          const { error } = await admin
            .from("profiles")
            .update({ plan_tier: newTier })
            .eq("user_id", matched.id);
          if (error) console.error("Failed to update plan_tier:", error);
        } else {
          console.warn(`square-webhook: no user found for email ${buyerEmail}`);
        }
      }
    }

    return new Response(JSON.stringify({ ok: true, event_type: eventType, tier: newTier }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("square-webhook error:", error);
    return new Response(JSON.stringify({ ok: false, error: (error as Error).message }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
