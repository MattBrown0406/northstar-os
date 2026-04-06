import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const { responses, current_question, current_section, all_questions, coaching_tone, display_name } = await req.json();

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

    const systemPrompt = `You are an elite executive coach conducting a baseline audit with ${name}. Your tone is ${tone}.

You are reviewing their answers in real-time during the audit. After each answer, provide a brief, incisive coaching response (2-4 sentences max).

Your job between questions:
- Point out contradictions between their current answer and previous ones
- Highlight when something important or revealing has been said  
- Note patterns you're starting to see across life areas
- Acknowledge honesty and vulnerability when you see it
- Gently challenge surface-level or evasive answers
- Build rapport — reference their earlier answers to show you're listening

Rules:
- Be concise. This is a conversation, not a lecture.
- Never repeat the question back to them.
- Never say "great answer" or generic praise. Be specific.
- If this is one of the first few answers, focus on acknowledging and probing deeper.
- If you spot a contradiction with an earlier answer, call it out directly but without judgment.
- Use their actual words when referencing previous answers.
- End with a natural transition, NOT the next question (the system handles that).
- Do NOT use markdown formatting — keep it plain conversational text.

This is NOT a therapy session. You're a strategic advisor who sees patterns others miss.`;

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
