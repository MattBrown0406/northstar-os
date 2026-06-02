import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

    // Require authenticated caller — prevents tier spoofing via body params
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userSupabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const {
      data: { user },
      error: authError,
    } = await userSupabase.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey);

    const { invite_code, coach_user_id: directCoachId } = await req.json();
    const client_user_id = user.id;

    let coachUserId: string;
    let assignedTier = "free";

    if (invite_code && invite_code !== "__branded__") {
      // Standard invite link flow
      const { data: invite, error: inviteError } = await supabase
        .from("coach_invite_links")
        .select("*")
        .eq("invite_code", invite_code)
        .eq("is_active", true)
        .single();

      if (inviteError || !invite) {
        return new Response(JSON.stringify({ error: "Invalid or expired invite link" }), {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      coachUserId = invite.coach_user_id;
      assignedTier = invite.assigned_tier;

      // Increment uses count
      await supabase
        .from("coach_invite_links")
        .update({ uses_count: invite.uses_count + 1 })
        .eq("id", invite.id);
    } else if (directCoachId) {
      // Branded page flow — link directly to coach
      coachUserId = directCoachId;
    } else {
      return new Response(JSON.stringify({ error: "invite_code or coach_user_id required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check if relationship already exists
    const { data: existing } = await supabase
      .from("coach_clients")
      .select("id")
      .eq("coach_user_id", coachUserId)
      .eq("client_user_id", client_user_id)
      .single();

    if (existing) {
      return new Response(JSON.stringify({ success: true, message: "Already linked" }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Create coach-client relationship
    const { error: linkError } = await supabase.from("coach_clients").insert({
      coach_user_id: coachUserId,
      client_user_id,
      assigned_tier: assignedTier,
    });

    if (linkError) throw linkError;

    // Update client's plan tier
    await supabase
      .from("profiles")
      .update({ plan_tier: assignedTier })
      .eq("user_id", client_user_id);

    return new Response(JSON.stringify({ success: true, coach_user_id: coachUserId }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Process invite error:", error);
    return new Response(JSON.stringify({ error: (error as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
