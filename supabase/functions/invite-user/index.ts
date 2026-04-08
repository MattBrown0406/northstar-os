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

    const { email, display_name, plan_tier, coach_user_id, coach_name } = await req.json();

    if (!email || !display_name) {
      return new Response(JSON.stringify({ error: "email and display_name are required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Invite the user - this sends them an email with a link to set their password
    const { data: inviteData, error: inviteError } = await supabase.auth.admin.inviteUserByEmail(email, {
      data: {
        display_name,
        ...(coach_user_id ? { coach_user_id } : {}),
        ...(coach_name ? { invited_by: coach_name } : {}),
      },
      redirectTo: `${req.headers.get("origin") || "https://truenorthos.lovable.app"}/onboarding`,
    });

    if (inviteError) {
      throw inviteError;
    }

    const userId = inviteData.user.id;

    // Create profile with the specified plan tier
    const { error: profileError } = await supabase.from("profiles").upsert({
      user_id: userId,
      display_name,
      plan_tier: plan_tier || "free",
      onboarding_completed: false,
    }, { onConflict: "user_id" });

    if (profileError) {
      console.error("Profile creation error:", profileError);
    }

    // If this is a coach invite, create the coach-client relationship
    if (coach_user_id) {
      const { error: linkError } = await supabase.from("coach_clients").insert({
        coach_user_id,
        client_user_id: userId,
        assigned_tier: plan_tier || "free",
      });
      if (linkError) {
        console.error("Coach-client link error:", linkError);
      }
    }

    return new Response(JSON.stringify({ success: true, user_id: userId }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Invite error:", error);
    return new Response(JSON.stringify({ error: (error as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
