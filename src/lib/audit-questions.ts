export interface AuditQuestion {
  id: string;
  section: string;
  sectionIndex: number;
  questionIndex: number;
  text: string;
  followUp?: string;
  type: "text" | "number" | "scale";
}

export const AUDIT_SECTIONS = [
  "Time & Energy",
  "Money & Business",
  "Relationships",
  "Health & Body",
  "Purpose & Identity",
  "Environment & Systems",
];

export const AUDIT_QUESTIONS: AuditQuestion[] = [
  // Section 0: Time & Energy
  { id: "te1", section: "Time & Energy", sectionIndex: 0, questionIndex: 0, type: "text", text: "Walk me through a typical day in the last 7 days. What did you actually do — not what you planned to do?" },
  { id: "te2", section: "Time & Energy", sectionIndex: 0, questionIndex: 1, type: "text", text: "What's the biggest time sink you know you should stop, but haven't?" },
  { id: "te3", section: "Time & Energy", sectionIndex: 0, questionIndex: 2, type: "scale", text: "On a scale of 1–10, how intentional are you with your time right now?" },
  { id: "te4", section: "Time & Energy", sectionIndex: 0, questionIndex: 3, type: "text", text: "When do you feel most energized? When do you feel most drained?" },

  // Section 1: Money & Business
  { id: "mb1", section: "Money & Business", sectionIndex: 1, questionIndex: 0, type: "text", text: "What's your primary revenue source right now? Is it growing, flat, or declining?" },
  { id: "mb2", section: "Money & Business", sectionIndex: 1, questionIndex: 1, type: "text", text: "What financial decision have you been avoiding?" },
  { id: "mb3", section: "Money & Business", sectionIndex: 1, questionIndex: 2, type: "scale", text: "On a scale of 1–10, how confident are you in your financial trajectory?" },
  { id: "mb4", section: "Money & Business", sectionIndex: 1, questionIndex: 3, type: "text", text: "If your revenue dropped 50% tomorrow, what would you cut first?" },

  // Section 2: Relationships
  { id: "r1", section: "Relationships", sectionIndex: 2, questionIndex: 0, type: "text", text: "Who are the 3 people you spend the most time with? How do they affect your energy?" },
  { id: "r2", section: "Relationships", sectionIndex: 2, questionIndex: 1, type: "text", text: "Is there a relationship that's costing you more than it's giving? Be honest." },
  { id: "r3", section: "Relationships", sectionIndex: 2, questionIndex: 2, type: "scale", text: "On a scale of 1–10, how supported do you feel by the people around you?" },
  { id: "r4", section: "Relationships", sectionIndex: 2, questionIndex: 3, type: "text", text: "What conversation have you been avoiding? With whom?" },

  // Section 3: Health & Body
  { id: "h1", section: "Health & Body", sectionIndex: 3, questionIndex: 0, type: "text", text: "How many hours of sleep did you average this week? How's the quality?" },
  { id: "h2", section: "Health & Body", sectionIndex: 3, questionIndex: 1, type: "text", text: "What does your exercise routine actually look like — not what you wish it was?" },
  { id: "h3", section: "Health & Body", sectionIndex: 3, questionIndex: 2, type: "scale", text: "On a scale of 1–10, how would you rate your physical energy right now?" },
  { id: "h4", section: "Health & Body", sectionIndex: 3, questionIndex: 3, type: "text", text: "What health habit do you know would change everything, but you keep putting off?" },

  // Section 4: Purpose & Identity
  { id: "p1", section: "Purpose & Identity", sectionIndex: 4, questionIndex: 0, type: "text", text: "In one sentence, what are you building your life toward right now?" },
  { id: "p2", section: "Purpose & Identity", sectionIndex: 4, questionIndex: 1, type: "text", text: "Does your daily reality match that vision? Where's the gap?" },
  { id: "p3", section: "Purpose & Identity", sectionIndex: 4, questionIndex: 2, type: "scale", text: "On a scale of 1–10, how aligned do you feel with your purpose?" },
  { id: "p4", section: "Purpose & Identity", sectionIndex: 4, questionIndex: 3, type: "text", text: "What would you stop doing tomorrow if no one was watching?" },

  // Section 5: Environment & Systems
  { id: "e1", section: "Environment & Systems", sectionIndex: 5, questionIndex: 0, type: "text", text: "Describe your workspace. Does it help or hurt your focus?" },
  { id: "e2", section: "Environment & Systems", sectionIndex: 5, questionIndex: 1, type: "text", text: "What systems or tools are you using to manage your life? Are they working?" },
  { id: "e3", section: "Environment & Systems", sectionIndex: 5, questionIndex: 2, type: "scale", text: "On a scale of 1–10, how organized is your life right now?" },
  { id: "e4", section: "Environment & Systems", sectionIndex: 5, questionIndex: 3, type: "text", text: "If you could fix one system in your life this week, what would it be?" },
];
