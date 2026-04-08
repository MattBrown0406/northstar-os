import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get user from JWT
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: userError } = await createClient(
      supabaseUrl,
      Deno.env.get("SUPABASE_ANON_KEY")!,
    ).auth.getUser(token);
    if (userError || !user) throw new Error("Unauthorized");

    const { audit_id } = await req.json();
    if (!audit_id) throw new Error("audit_id is required");

    // Get audit data
    const { data: audit, error: auditError } = await supabase
      .from("baseline_audits")
      .select("*")
      .eq("id", audit_id)
      .eq("user_id", user.id)
      .single();

    if (auditError || !audit) throw new Error("Audit not found");
    if (audit.status !== "completed") throw new Error("Audit not completed");

    // Check if report already exists
    const { data: existing } = await supabase
      .from("strategic_reports")
      .select("id")
      .eq("audit_id", audit_id)
      .eq("user_id", user.id)
      .limit(1);

    if (existing && existing.length > 0) {
      return new Response(JSON.stringify({ report_id: existing[0].id, already_exists: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get profile for coaching tone
    const { data: profile } = await supabase
      .from("profiles")
      .select("display_name, coaching_tone")
      .eq("user_id", user.id)
      .single();

    // Build prompt from audit responses
    const responses = audit.responses as Record<string, string>;
    const sections = [
      { name: "Time & Energy", keys: ["te1", "te2", "te3", "te4"] },
      { name: "Money & Business", keys: ["mb1", "mb2", "mb3", "mb4"] },
      { name: "Relationships", keys: ["r1", "r2", "r3", "r4"] },
      { name: "Health & Body", keys: ["h1", "h2", "h3", "h4"] },
      { name: "Purpose & Identity", keys: ["p1", "p2", "p3", "p4"] },
      { name: "Environment & Systems", keys: ["e1", "e2", "e3", "e4"] },
    ];

    let auditSummary = "";
    for (const section of sections) {
      auditSummary += `\n## ${section.name}\n`;
      for (const key of section.keys) {
        if (responses[key]) auditSummary += `- ${responses[key]}\n`;
      }
    }

    const tone = profile?.coaching_tone || "balanced";
    const name = profile?.display_name || "there";

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const systemPrompt = `You are an elite executive coach and strategic advisor. Your tone is ${tone}. You are generating a Strategic Report for ${name} based on their baseline audit responses.

You must return a JSON object using the tool provided. Analyze the responses deeply. Look for:
1. Pattern Analysis: recurring themes across all 6 life areas
2. Contradictions: where their stated values conflict with their actions
3. A Forced Choice: the single most important decision they're avoiding
4. Operating Focus: one decisive sentence capturing the singular intent they should orient their next 90 days around
5. 90-Day Plan: 3 phases (30/60/90 days) with 2-3 specific actions each

Be brutally honest but constructive. Reference their actual words. No generic advice.`;

    const userPrompt = `Here are the baseline audit responses:\n${auditSummary}\n\nGenerate the strategic report.`;

    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "create_strategic_report",
              description: "Create a strategic report based on audit analysis",
              parameters: {
                type: "object",
                properties: {
                  pattern_analysis: {
                    type: "object",
                    properties: {
                      themes: {
                        type: "array",
                        items: {
                          type: "object",
                          properties: {
                            title: { type: "string" },
                            description: { type: "string" },
                            areas_affected: { type: "array", items: { type: "string" } },
                          },
                          required: ["title", "description", "areas_affected"],
                        },
                      },
                      strengths: { type: "array", items: { type: "string" } },
                      blind_spots: { type: "array", items: { type: "string" } },
                    },
                    required: ["themes", "strengths", "blind_spots"],
                  },
                  contradictions: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        stated: { type: "string" },
                        actual: { type: "string" },
                        impact: { type: "string" },
                      },
                      required: ["stated", "actual", "impact"],
                    },
                  },
                  forced_choice: { type: "string" },
                  north_star_focus: { type: "string" },
                  ninety_day_plan: {
                    type: "object",
                    properties: {
                      phase_1: {
                        type: "object",
                        properties: {
                          title: { type: "string" },
                          actions: { type: "array", items: { type: "string" } },
                        },
                        required: ["title", "actions"],
                      },
                      phase_2: {
                        type: "object",
                        properties: {
                          title: { type: "string" },
                          actions: { type: "array", items: { type: "string" } },
                        },
                        required: ["title", "actions"],
                      },
                      phase_3: {
                        type: "object",
                        properties: {
                          title: { type: "string" },
                          actions: { type: "array", items: { type: "string" } },
                        },
                        required: ["title", "actions"],
                      },
                    },
                    required: ["phase_1", "phase_2", "phase_3"],
                  },
                },
                required: ["pattern_analysis", "contradictions", "forced_choice", "north_star_focus", "ninety_day_plan"],
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "create_strategic_report" } },
      }),
    });

    if (!aiResponse.ok) {
      const status = aiResponse.status;
      if (status === 429) {
        return new Response(JSON.stringify({ error: "Rate limited. Please try again in a moment." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      throw new Error(`AI gateway error: ${status}`);
    }

    const aiData = await aiResponse.json();
    const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall) throw new Error("No tool call in AI response");

    const reportData = JSON.parse(toolCall.function.arguments);

    // Save report
    const { data: report, error: reportError } = await supabase
      .from("strategic_reports")
      .insert({
        user_id: user.id,
        audit_id,
        pattern_analysis: reportData.pattern_analysis,
        contradictions: reportData.contradictions,
        forced_choice: reportData.forced_choice,
        north_star_focus: reportData.north_star_focus,
        ninety_day_plan: reportData.ninety_day_plan,
      })
      .select("id")
      .single();

    if (reportError) throw reportError;

    return new Response(JSON.stringify({ report_id: report.id }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("generate-report error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
