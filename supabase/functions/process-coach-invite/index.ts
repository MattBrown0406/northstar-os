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
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    const { invite_code, client_user_id } = await req.json();

    if (!invite_code || !client_user_id) {
      return new Response(JSON.stringify({ error: "invite_code and client_user_id are required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Look up invite link
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

    // Check if relationship already exists
    const { data: existing } = await supabase
      .from("coach_clients")
      .select("id")
      .eq("coach_user_id", invite.coach_user_id)
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
      coach_user_id: invite.coach_user_id,
      client_user_id,
      assigned_tier: invite.assigned_tier,
    });

    if (linkError) throw linkError;

    // Update client's plan tier
    const { error: profileError } = await supabase
      .from("profiles")
      .update({ plan_tier: invite.assigned_tier })
      .eq("user_id", client_user_id);

    if (profileError) {
      console.error("Profile tier update error:", profileError);
    }

    // Increment uses count
    await supabase
      .from("coach_invite_links")
      .update({ uses_count: invite.uses_count + 1 })
      .eq("id", invite.id);

    return new Response(JSON.stringify({ success: true, coach_user_id: invite.coach_user_id }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Process invite error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
