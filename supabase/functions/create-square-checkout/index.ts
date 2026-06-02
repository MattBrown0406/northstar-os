import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const PLAN_CONFIG: Record<string, { amountCents: number; name: string; description: string }> = {
  coach_monthly: {
    amountCents: 29999,
    name: "Intentus Coach — Monthly",
    description: "Intentus Coach — Monthly ($299.99/mo)",
  },
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const userSupabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user }, error: authError } = await userSupabase.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json().catch(() => ({}));
    const plan: string = body?.plan ?? "coach_monthly";
    const config = PLAN_CONFIG[plan];
    if (!config) {
      return new Response(JSON.stringify({ error: "Invalid plan" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const squareToken = Deno.env.get("SQUARE_ACCESS_TOKEN");
    if (!squareToken) {
      return new Response(JSON.stringify({ error: "Square not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const idempotencyKey = crypto.randomUUID();
    const squareBody = {
      idempotency_key: idempotencyKey,
      quick_pay: {
        name: config.name,
        price_money: { amount: config.amountCents, currency: "USD" },
        location_id: Deno.env.get("SQUARE_LOCATION_ID") ?? undefined,
      },
      description: config.description,
      checkout_options: {
        redirect_url: "https://intentus.app/subscribe?payment=success",
        ask_for_shipping_address: false,
        merchant_support_email: "support@intentus.app",
      },
      pre_populated_data: {
        buyer_email: user.email ?? undefined,
      },
    };

    // Omit location_id if missing — Square will use default location
    if (!squareBody.quick_pay.location_id) delete (squareBody.quick_pay as Record<string, unknown>).location_id;

    const squareRes = await fetch("https://connect.squareup.com/v2/online-checkout/payment-links", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${squareToken}`,
        "Content-Type": "application/json",
        "Square-Version": "2024-10-17",
      },
      body: JSON.stringify(squareBody),
    });

    const squareData = await squareRes.json();
    if (!squareRes.ok) {
      console.error("Square checkout error:", squareData);
      return new Response(JSON.stringify({ error: "Square checkout failed", details: squareData }), {
        status: 502,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const checkoutUrl: string | undefined = squareData?.payment_link?.url;
    if (!checkoutUrl) {
      return new Response(JSON.stringify({ error: "Square did not return a checkout URL" }), {
        status: 502,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ checkout_url: checkoutUrl }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("create-square-checkout error:", error);
    return new Response(JSON.stringify({ error: (error as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
