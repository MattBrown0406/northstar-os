export type AdaptiveLens = "discipline_execution" | "decision_making" | "self_awareness" | "business_value" | "responsibility_meaning";

export interface IntentProfile {
  primaryLens: AdaptiveLens;
  secondaryLens: AdaptiveLens;
  pressureState: "stretched" | "foggy" | "plateaued" | "rebuilding" | "scaling";
  focusArea: "self_leadership" | "team_leadership" | "business_growth" | "decision_clarity" | "personal_alignment";
  supportMode: "structure" | "challenge" | "perspective" | "traction" | "meaning";
}

export interface IntentModel {
  primary_lens: AdaptiveLens;
  secondary_lens: AdaptiveLens;
  lens_rationale: string;
  anchor_emphasis: { name: string; reason: string }[];
  background_threads: string[];
  coaching_posture: string;
  report_framing: string;
}

export const CORE_ANCHORS = [
  "James Clear",
  "Stephen Covey",
  "Marshall Goldsmith",
  "Annie Duke",
  "Peter Drucker",
  "Carl Rogers",
] as const;

export const LENS_OPTIONS: { value: AdaptiveLens; label: string; description: string }[] = [
  {
    value: "discipline_execution",
    label: "Discipline & execution",
    description: "For inconsistency, weak follow-through, and loose operating rhythms.",
  },
  {
    value: "decision_making",
    label: "Decision-making",
    description: "For tradeoffs, uncertainty, indecision, and bad bets disguised as complexity.",
  },
  {
    value: "self_awareness",
    label: "Self-awareness & blind spots",
    description: "For repeated patterns, self-protection, and truths you keep circling around.",
  },
  {
    value: "business_value",
    label: "Business & value creation",
    description: "For growth, leverage, metrics, customer value, and owner-level thinking.",
  },
  {
    value: "responsibility_meaning",
    label: "Responsibility & meaning",
    description: "For alignment, purpose, burden, identity, and whether your effort still means something.",
  },
];

export const PRESSURE_OPTIONS = [
  { value: "stretched", label: "Overextended", description: "Too many fronts, not enough control." },
  { value: "foggy", label: "Unclear", description: "You are active, but priority and signal feel muddy." },
  { value: "plateaued", label: "Plateaued", description: "You are functioning, but real movement has slowed." },
  { value: "rebuilding", label: "Rebuilding", description: "You are trying to regain order after disruption or drift." },
  { value: "scaling", label: "Scaling", description: "Things are working, but the system needs to mature with the load." },
] as const;

export const FOCUS_AREA_OPTIONS = [
  { value: "self_leadership", label: "My own habits and standards" },
  { value: "team_leadership", label: "How I lead and relate to other people" },
  { value: "business_growth", label: "Business traction, value, and growth" },
  { value: "decision_clarity", label: "The choices I keep delaying or second-guessing" },
  { value: "personal_alignment", label: "Meaning, identity, and whether my life still fits" },
] as const;

export const SUPPORT_MODE_OPTIONS = [
  { value: "structure", label: "More structure", description: "Help me simplify, sequence, and install better defaults." },
  { value: "challenge", label: "More challenge", description: "Push harder when I rationalize, drift, or soften the truth." },
  { value: "perspective", label: "More perspective", description: "Help me see the pattern, tradeoff, or blind spot I keep missing." },
  { value: "traction", label: "More traction", description: "Keep me oriented around leverage, value, and execution." },
  { value: "meaning", label: "More meaning", description: "Help me reconnect effort, responsibility, and purpose." },
] as const;

export function getLensMeta(lens?: AdaptiveLens | null) {
  return LENS_OPTIONS.find((option) => option.value === lens) ?? LENS_OPTIONS[0];
}

export function formatLensLabel(lens?: AdaptiveLens | null) {
  return getLensMeta(lens).label;
}

export function getFocusPrompt(intentProfile?: Partial<IntentProfile> | null) {
  switch (intentProfile?.primaryLens) {
    case "decision_making":
      return "Where are you delaying the tradeoff you already understand?";
    case "self_awareness":
      return "Where did self-protection, ego, or avoidance show up this week?";
    case "business_value":
      return "What created measurable value, and what was just motion?";
    case "responsibility_meaning":
      return "What responsibility did you carry well, and where did meaning leak out?";
    default:
      return "What moved forward since your last check-in? Be concrete.";
  }
}

export function getBlockerPrompt(intentProfile?: Partial<IntentProfile> | null) {
  switch (intentProfile?.primaryLens) {
    case "decision_making":
      return "What decision, uncertainty, or tradeoff is still muddy or avoided?";
    case "self_awareness":
      return "Where are you spinning, defending, or telling yourself a cleaner story than reality?";
    case "business_value":
      return "Where did value creation stall, and what friction actually caused it?";
    case "responsibility_meaning":
      return "Where did responsibility feel heavy, empty, or disconnected from purpose?";
    default:
      return "Where are you drifting, rationalizing, or hitting real resistance?";
  }
}

export function getCommitmentPrompt(intentProfile?: Partial<IntentProfile> | null) {
  switch (intentProfile?.supportMode) {
    case "structure":
      return "What concrete structure or default will you install before the next check-in?";
    case "challenge":
      return "What hard thing will you stop avoiding before the next check-in?";
    case "perspective":
      return "What conversation, review, or reflection will help you face the real issue before the next check-in?";
    case "meaning":
      return "What action will reconnect effort, responsibility, and meaning before the next check-in?";
    default:
      return "What commitments will you keep before the next check-in? Write what you will actually do.";
  }
}
