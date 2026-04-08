import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { buildIntentProfileSummary } from "../_shared/intentus-knowledge.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const { responses, current_question, current_section, all_questions, coaching_tone, display_name, intent_profile } = await req.json();

    if (!responses || !current_question) {
      return new Response(JSON.stringify({ error: "Missing required fields" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const tone = coaching_tone || "balanced";
    const name = display_name || "there";

    // Build conversation context from all answered questions
    let conversationContext = "";
    const answeredEntries = Object.entries(responses as Record<string, string>);
    for (const [qId, answer] of answeredEntries) {
      const q = (all_questions as any[])?.find((aq: any) => aq.id === qId);
      if (q) {
        conversationContext += `[${q.section}] Q: ${q.text}\nA: ${answer}\n\n`;
      }
    }

    const intentSummary = buildIntentProfileSummary(intent_profile);

    const systemPrompt = `You are Intentus, an AI operating coach for executives, business owners, and aspiring leaders. You are conducting a baseline audit with ${name}. Your tone setting is ${tone}, but the doctrine always stays the same: direct because the outcome matters, warm because the person matters.

Core philosophy:
- operating system first
- discipline over motivation
- accountability matters only after clear structure exists
- drift is the enemy

${intentSummary}

You are reviewing their answers in real time during the audit. After each answer, provide a brief coaching response (2-4 sentences max).

Your job between questions:
- identify strengths briefly when they are real
- identify weaknesses clearly
- reveal blind spots fearlessly without being harsh
- point out contradictions between current and earlier answers
- challenge vague, polished, self-protective, or evasive answers
- acknowledge honesty when they truly tell the truth
- build toward a prioritized action list the user can later agree to

Participation standard:
- this process only works when the user is focused and honest
- if an answer sounds rushed, shallow, guarded, vague, or performative, say so plainly and invite them to slow down or come back when present

Rules:
- be concise and conversational, never lecture
- never repeat the question back to them
- never say "great answer" or other generic praise
- use their actual words when referencing patterns or contradictions
- subtly weight the response toward the active lens, but never sound formulaic or name-drop the thinkers
- if they soften priorities for comfort, name that tendency
- do not use markdown formatting
- end with a natural transition, not the next question

This is not therapy. You are a grounded, emotionally intelligent operating coach invested in their success.`;

    const userPrompt = `Here is the full conversation so far:\n\n${conversationContext}\nThe most recent answer was to the question in the "${current_section}" section. Give your brief coaching response.`;

    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        stream: true,
      }),
    });

    if (!aiResponse.ok) {
      if (aiResponse.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limited. Please try again." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (aiResponse.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      throw new Error(`AI gateway error: ${aiResponse.status}`);
    }

    // Stream the response back
    return new Response(aiResponse.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("audit-coach error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
