import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";
import { buildIntentProfileSummary } from "../_shared/intentus-knowledge.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { messages, mode } = await req.json();
    // mode: "check-in-debrief" or "chat"

    // Gather user context
    const [profileRes, checkInsRes, auditRes, reportRes] = await Promise.all([
      supabase.from("profiles").select("*").eq("user_id", user.id).single(),
      supabase.from("check_ins").select("*").eq("user_id", user.id).order("created_at", { ascending: false }).limit(10),
      supabase.from("baseline_audits").select("responses, scores, status").eq("user_id", user.id).eq("status", "completed").limit(1),
      supabase.from("strategic_reports").select("north_star_focus, forced_choice, contradictions, pattern_analysis, ninety_day_plan, intent_model").eq("user_id", user.id).order("created_at", { ascending: false }).limit(1),
    ]);

    const profile = profileRes.data;
    const checkIns = checkInsRes.data || [];
    const audit = auditRes.data?.[0];
    const report = reportRes.data?.[0];
    const tone = profile?.coaching_tone || "balanced";
    const name = profile?.display_name || "there";

    // Build rich context
    let userContext = `User: ${name}\nCoaching tone preference: ${tone}\n\n`;

    const intentSummary = buildIntentProfileSummary((profile?.intent_profile as any) || null);
    userContext += `${intentSummary}\n\n`;

    if (report) {
      userContext += `--- STRATEGIC REPORT ---\n`;
      if (report.north_star_focus) userContext += `Operating Focus: ${report.north_star_focus}\n`;
      if (report.forced_choice) userContext += `Forced Choice: ${report.forced_choice}\n`;
      if (report.contradictions) userContext += `Key Contradictions: ${JSON.stringify(report.contradictions)}\n`;
      if (report.pattern_analysis) userContext += `Patterns: ${JSON.stringify(report.pattern_analysis)}\n`;
      if (report.ninety_day_plan) userContext += `90-Day Plan: ${JSON.stringify(report.ninety_day_plan)}\n`;
      if (report.intent_model) userContext += `Intent Model: ${JSON.stringify(report.intent_model)}\n`;
      userContext += "\n";
    }

    if (checkIns.length > 0) {
      userContext += `--- RECENT CHECK-INS (last ${checkIns.length}) ---\n`;
      for (const ci of checkIns.slice(0, 5)) {
        userContext += `${ci.created_at}: Mood=${ci.mood_score}, Energy=${ci.energy_score}`;
        if (ci.drift_detected) userContext += " [DRIFT DETECTED]";
        if (ci.wins?.length) userContext += `, Wins: ${ci.wins.join("; ")}`;
        if (ci.blockers?.length) userContext += `, Blockers: ${ci.blockers.join("; ")}`;
        if (ci.commitments?.length) userContext += `, Commitments: ${ci.commitments.join("; ")}`;
        userContext += "\n";
      }

      // Trend analysis
      const moods = checkIns.filter(c => c.mood_score).map(c => c.mood_score);
      const energies = checkIns.filter(c => c.energy_score).map(c => c.energy_score);
      if (moods.length >= 2) {
        const moodTrend = moods[0] - moods[moods.length - 1];
        userContext += `Mood trend: ${moodTrend > 0 ? "improving" : moodTrend < 0 ? "declining" : "stable"} (latest: ${moods[0]}, avg: ${(moods.reduce((a, b) => a + b, 0) / moods.length).toFixed(1)})\n`;
      }
      if (energies.length >= 2) {
        const energyTrend = energies[0] - energies[energies.length - 1];
        userContext += `Energy trend: ${energyTrend > 0 ? "improving" : energyTrend < 0 ? "declining" : "stable"} (latest: ${energies[0]}, avg: ${(energies.reduce((a, b) => a + b, 0) / energies.length).toFixed(1)})\n`;
      }
      const driftRate = checkIns.filter(c => c.drift_detected).length / checkIns.length;
      userContext += `Drift rate: ${(driftRate * 100).toFixed(0)}% of recent check-ins\n`;
    }

    let systemPrompt = "";

    if (mode === "check-in-debrief") {
      systemPrompt = `You are Intentus, an AI operating coach for executives, business owners, and aspiring leaders. You are providing a debrief after ${name}'s check-in. Your tone setting is ${tone}, but your doctrine stays constant: direct because the outcome matters, warm because the person matters.

${userContext}

Based on this check-in and their history, provide a personalized coaching debrief:

1. **Pattern Recognition**: What trends do you see across their recent check-ins? Is mood/energy improving or declining?
2. **Alignment Check**: Are their wins and commitments aligned with their operating focus and 90-day plan?
3. **Drift Analysis**: If drift was detected, what might be causing it? Reference specific data.
4. **Actionable Insight**: Give ONE specific, actionable piece of advice for the next 24 hours.
5. **Accountability**: Reference their previous commitments — did their wins reflect follow-through?

Coaching sequence to reflect:
- identify strengths briefly
- identify weaknesses clearly
- reveal blind spots without flinching
- reinforce the current priority and decisive next action
- correct drift, vague language, rationalization, pat answers, or self-protection when present
- let the active lens shape the emphasis: execution, decision quality, blind spots, business value, or responsibility/meaning

Participation standard:
- if the check-in reads thin, rushed, vague, or guarded, call that out directly and tell them to come back more honestly next time

Keep it concise (4-6 sentences). Be direct, human, and specific. Use their actual data. No headers or bullet points in the final answer. End with a refocusing line that pushes decisiveness.`;
    } else {
      systemPrompt = `You are Intentus, an AI operating coach for executives, business owners, and aspiring leaders. You are having an ongoing conversation with ${name}. Your tone setting is ${tone}, but the doctrine stays constant: direct because the outcome matters, warm because the person matters.

${userContext}

You have full access to their baseline audit data, strategic report, and check-in history. Use this data to provide deeply personalized coaching.

Your approach:
- Reference their specific data, scores, patterns, and stated goals
- Connect current concerns back to their operating focus, current priority, and 90-day plan
- Identify strengths briefly, weaknesses clearly, and blind spots fearlessly without becoming harsh
- Point out contradictions between what they say they want and what their data shows
- Detect drift, vague language, rationalization, self-protection, and softened priorities for comfort
- Give actionable, specific advice — never generic platitudes
- Ask for decisiveness and agreement when priorities or actions need to be set
- Encourage reflective listening or reading when the same harmful pattern keeps repeating

Core philosophy:
- operating system first
- discipline over motivation
- accountability only matters once clear structure exists
- drift is the enemy

Knowledge architecture guidance:
- keep the six core anchors available at all times: James Clear, Stephen Covey, Marshall Goldsmith, Annie Duke, Peter Drucker, Carl Rogers
- weight the response toward the active adaptive lens from the profile/report intent model
- use Jordan Peterson, Viktor Frankl, Gabor Maté, Jung, Dalio, or Naval only as subtle background framing when the pattern clearly calls for it
- never name-drop authors unless the user explicitly asks where the framing comes from

You are not a therapist. You are a grounded, emotionally intelligent operating coach.
Keep responses focused and conversational. Do not lecture. Do not be permissive.`;
    }

    const aiMessages = [
      { role: "system", content: systemPrompt },
      ...(messages || []),
    ];

    if (mode === "check-in-debrief" && (!messages || messages.length === 0)) {
      aiMessages.push({ role: "user", content: "I just completed my check-in. Give me your coaching debrief." });
    }

    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash-preview",
        messages: aiMessages,
        stream: true,
      }),
    });

    if (!aiResponse.ok) {
      if (aiResponse.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limited. Please try again in a moment." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (aiResponse.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted. Please add funds." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await aiResponse.text();
      console.error("AI gateway error:", aiResponse.status, t);
      throw new Error(`AI gateway error: ${aiResponse.status}`);
    }

    return new Response(aiResponse.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("coaching-chat error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
