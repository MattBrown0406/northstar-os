import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
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
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user }, error: authError } = await userClient.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const admin = createClient(supabaseUrl, serviceRoleKey);

    // Tables keyed by user_id — delete in a loop with error handling so we don't
    // end up with a partially-deleted account that's hard to recover from.
    const tables = [
      "coach_clients",
      "coach_invite_links",
      "coach_annotations",
      "coaching_messages",
      "check_ins",
      "weekly_commitments",
      "commitment_callbacks",
      "plan_action_completions",
      "north_star_goals",
      "baseline_audits",
      "strategic_reports",
      "audit_history",
    ];

    // coach_clients references the user via two columns — handle separately.
    {
      const { error } = await admin
        .from("coach_clients")
        .delete()
        .or(`coach_user_id.eq.${user.id},client_user_id.eq.${user.id}`);
      if (error) throw new Error(`Failed to delete from coach_clients: ${error.message}`);
    }

    for (const table of tables.filter((t) => t !== "coach_clients")) {
      const column = table === "coach_invite_links" ? "coach_user_id" : "user_id";
      const { error } = await admin.from(table).delete().eq(column, user.id);
      if (error) throw new Error(`Failed to delete from ${table}: ${error.message}`);
    }

    {
      const { error } = await admin.from("coach_branding").delete().eq("coach_user_id", user.id);
      if (error) throw new Error(`Failed to delete from coach_branding: ${error.message}`);
    }
    {
      const { error } = await admin.from("profiles").delete().eq("user_id", user.id);
      if (error) throw new Error(`Failed to delete from profiles: ${error.message}`);
    }

    const { error: deleteError } = await admin.auth.admin.deleteUser(user.id);
    if (deleteError) throw deleteError;


    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("delete-account error:", error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
