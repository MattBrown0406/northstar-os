import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

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
      supabase.from("strategic_reports").select("north_star_focus, forced_choice, contradictions, pattern_analysis, ninety_day_plan").eq("user_id", user.id).order("created_at", { ascending: false }).limit(1),
    ]);

    const profile = profileRes.data;
    const checkIns = checkInsRes.data || [];
    const audit = auditRes.data?.[0];
    const report = reportRes.data?.[0];
    const tone = profile?.coaching_tone || "balanced";
    const name = profile?.display_name || "there";

    // Build rich context
    let userContext = `User: ${name}\nCoaching tone preference: ${tone}\n\n`;

    if (report) {
      userContext += `--- STRATEGIC REPORT ---\n`;
      if (report.north_star_focus) userContext += `Operating Focus: ${report.north_star_focus}\n`;
      if (report.forced_choice) userContext += `Forced Choice: ${report.forced_choice}\n`;
      if (report.contradictions) userContext += `Key Contradictions: ${JSON.stringify(report.contradictions)}\n`;
      if (report.pattern_analysis) userContext += `Patterns: ${JSON.stringify(report.pattern_analysis)}\n`;
      if (report.ninety_day_plan) userContext += `90-Day Plan: ${JSON.stringify(report.ninety_day_plan)}\n`;
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
      systemPrompt = `You are an elite executive coach providing a debrief after ${name}'s check-in. Your tone is ${tone}.

${userContext}

Based on this check-in and their history, provide a personalized coaching debrief:

1. **Pattern Recognition**: What trends do you see across their recent check-ins? Is mood/energy improving or declining?
2. **Alignment Check**: Are their wins and commitments aligned with their operating focus and 90-day plan?
3. **Drift Analysis**: If drift was detected, what might be causing it? Reference specific data.
4. **Actionable Insight**: Give ONE specific, actionable piece of advice for the next 24 hours.
5. **Accountability**: Reference their previous commitments — did their wins reflect follow-through?

Keep it concise (4-6 sentences). Be direct, not generic. Use their actual data. End with something that makes them think.
Do NOT use headers or bullet points — write it as natural coaching prose.`;
    } else {
      systemPrompt = `You are an elite executive coach having an ongoing conversation with ${name}. Your tone is ${tone}.

${userContext}

You have full access to their baseline audit data, strategic report, and check-in history. Use this data to provide deeply personalized coaching.

Your approach:
- Reference their specific data, scores, patterns, and stated goals
- Connect current concerns back to their operating focus and 90-day plan
- Point out contradictions between what they say they want and what their data shows
- Give actionable, specific advice — never generic platitudes
- Challenge them when appropriate; celebrate genuine progress
- Track accountability on their commitments
- If they're drifting, name it directly with evidence

You are NOT a therapist. You are a strategic advisor who sees patterns others miss.
Keep responses focused and conversational. Don't lecture.`;
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
        model: "google/gemini-3-flash-preview",
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
