export type AdaptiveLens = "discipline_execution" | "decision_making" | "self_awareness" | "business_value" | "responsibility_meaning";

export type IntentProfile = {
  primaryLens?: AdaptiveLens;
  secondaryLens?: AdaptiveLens;
  pressureState?: string;
  focusArea?: string;
  supportMode?: string;
};

const LENS_GUIDANCE: Record<AdaptiveLens, { label: string; anchors: string[]; emphasis: string; background: string[] }> = {
  discipline_execution: {
    label: "Discipline & execution",
    anchors: ["James Clear", "Stephen Covey", "Marshall Goldsmith"],
    emphasis: "bias toward systems, commitments, habit design, and weekly integrity between stated priorities and lived behavior",
    background: ["Jordan Peterson on order and responsibility", "Ray Dalio on principles when useful"],
  },
  decision_making: {
    label: "Decision-making",
    anchors: ["Annie Duke", "Peter Drucker", "Stephen Covey"],
    emphasis: "bias toward tradeoffs, probabilities, reversibility, opportunity cost, and making clean decisions on incomplete information",
    background: ["Ray Dalio on believability and principles", "Naval on leverage when useful"],
  },
  self_awareness: {
    label: "Self-awareness & blind spots",
    anchors: ["Carl Rogers", "Marshall Goldsmith", "Annie Duke"],
    emphasis: "bias toward honest self-observation, contradictions, recurring interpersonal patterns, and behaviors that create friction or blindness",
    background: ["Jungian shadow concepts when useful", "Gabor Maté on adaptive patterns when relevant"],
  },
  business_value: {
    label: "Business & value creation",
    anchors: ["Peter Drucker", "Stephen Covey", "Annie Duke"],
    emphasis: "bias toward value creation, customer impact, strategic focus, leverage, measurable traction, and what actually moves the business",
    background: ["Naval on leverage", "Dalio on systems and evidence when useful"],
  },
  responsibility_meaning: {
    label: "Responsibility & meaning",
    anchors: ["Carl Rogers", "Stephen Covey", "Peter Drucker"],
    emphasis: "bias toward responsibility, role integrity, meaning, identity coherence, and whether effort is connected to a burden worth carrying",
    background: ["Viktor Frankl on meaning", "Jordan Peterson on responsibility", "Gabor Maté when pain or avoidance is shaping the pattern"],
  },
};

export function buildIntentProfileSummary(intentProfile?: IntentProfile | null) {
  if (!intentProfile) return "No explicit intent profile selected. Infer the most useful coaching lens from the user's words and behavior.";

  const primary = intentProfile.primaryLens ? LENS_GUIDANCE[intentProfile.primaryLens] : null;
  const secondary = intentProfile.secondaryLens ? LENS_GUIDANCE[intentProfile.secondaryLens] : null;

  return [
    "--- INTENTUS KNOWLEDGE ARCHITECTURE ---",
    "Core anchors always available: James Clear, Stephen Covey, Marshall Goldsmith, Annie Duke, Peter Drucker, Carl Rogers.",
    primary ? `Primary lens: ${primary.label} — ${primary.emphasis}.` : "Primary lens: infer from context.",
    secondary ? `Secondary lens: ${secondary.label} — use as a supporting perspective, not the lead frame.` : "Secondary lens: infer from context when needed.",
    intentProfile.pressureState ? `Current pressure state: ${intentProfile.pressureState}.` : null,
    intentProfile.focusArea ? `Declared focus area: ${intentProfile.focusArea}.` : null,
    intentProfile.supportMode ? `Preferred support mode: ${intentProfile.supportMode}.` : null,
    primary ? `Anchor weighting: favor ${primary.anchors.join(", ")} first, then blend the remaining core anchors only when helpful.` : null,
    primary ? `Background philosophy: ${primary.background.join("; ")}. Use these as subtle framing only, never as name-dropping.` : null,
    secondary ? `Secondary support anchors: ${secondary.anchors.join(", ")}.` : null,
    "Use the lens to shape what you emphasize: discipline/execution, decision quality, blind spots, business value, or responsibility/meaning.",
    "Do not turn this into therapy, self-help trivia, or abstract philosophy. Keep it buildable, behavioral, and specific.",
  ].filter(Boolean).join("\n");
}

export function buildIntentModelInstructions() {
  return `In addition to the main report, infer and return an intent_model object with:
- primary_lens: one of discipline_execution, decision_making, self_awareness, business_value, responsibility_meaning
- secondary_lens: one of the same five options
- lens_rationale: brief explanation grounded in the user's words
- anchor_emphasis: 3-4 core anchors with a short reason each
- background_threads: up to 3 subtle supporting philosophical threads
- coaching_posture: one short sentence describing how the coach should show up
- report_framing: one short sentence describing the frame the user most needs right now`;
}
