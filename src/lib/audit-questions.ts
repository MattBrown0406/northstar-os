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
  { id: "te1", section: "Time & Energy", sectionIndex: 0, questionIndex: 0, type: "text", text: "Walk me through yesterday — or a typical recent day. Not what was on the calendar. What actually happened, hour by hour?" },
  { id: "te2", section: "Time & Energy", sectionIndex: 0, questionIndex: 1, type: "text", text: "Where do you lose time and you know it? What keeps pulling you back to that thing?" },
  { id: "te3", section: "Time & Energy", sectionIndex: 0, questionIndex: 2, type: "scale", text: "On a scale of 1–10, how intentional are you with your time right now?" },
  { id: "te4", section: "Time & Energy", sectionIndex: 0, questionIndex: 3, type: "text", text: "When do you feel most alive and focused? And when do you feel like you're just going through the motions?" },

  // Section 1: Money & Business
  { id: "mb1", section: "Money & Business", sectionIndex: 1, questionIndex: 0, type: "text", text: "Let's talk money. What's your primary revenue source right now — and is it going in the direction you want?" },
  { id: "mb2", section: "Money & Business", sectionIndex: 1, questionIndex: 1, type: "text", text: "What financial or operating decision have you been avoiding because clarity would force action?" },
  { id: "mb3", section: "Money & Business", sectionIndex: 1, questionIndex: 2, type: "scale", text: "On a scale of 1–10, how confident are you in where you're headed financially?" },
  { id: "mb4", section: "Money & Business", sectionIndex: 1, questionIndex: 3, type: "text", text: "If your revenue dropped by half tomorrow, what would you cut first? And what would you refuse to let go of — even if it didn't make financial sense?" },

  // Section 2: Relationships
  { id: "r1", section: "Relationships", sectionIndex: 2, questionIndex: 0, type: "text", text: "Who are the three people you spend the most time with? And here's the harder question — do they make you better or just more comfortable?" },
  { id: "r2", section: "Relationships", sectionIndex: 2, questionIndex: 1, type: "text", text: "Is there a relationship right now that's costing you more than it's giving you? You don't have to name names — just tell me about it." },
  { id: "r3", section: "Relationships", sectionIndex: 2, questionIndex: 2, type: "scale", text: "On a scale of 1–10, how supported do you feel by the people around you?" },
  { id: "r4", section: "Relationships", sectionIndex: 2, questionIndex: 3, type: "text", text: "What's a conversation you've been avoiding? Not the small stuff — the one that sits in your chest." },

  // Section 3: Health & Body
  { id: "h1", section: "Health & Body", sectionIndex: 3, questionIndex: 0, type: "text", text: "How did you sleep last week? And be honest — are you the kind of person who wears exhaustion like a badge?" },
  { id: "h2", section: "Health & Body", sectionIndex: 3, questionIndex: 1, type: "text", text: "What does your exercise routine actually look like right now — not what you wish it was?" },
  { id: "h3", section: "Health & Body", sectionIndex: 3, questionIndex: 2, type: "scale", text: "On a scale of 1–10, how would you rate your physical energy right now?" },
  { id: "h4", section: "Health & Body", sectionIndex: 3, questionIndex: 3, type: "text", text: "What's the one health habit you keep telling yourself you'll start — but haven't? What's really stopping you?" },

  // Section 4: Purpose & Identity
  { id: "p1", section: "Purpose & Identity", sectionIndex: 4, questionIndex: 0, type: "text", text: "If you had to explain what you're building your life around right now — in one honest sentence — what would you say?" },
  { id: "p2", section: "Purpose & Identity", sectionIndex: 4, questionIndex: 1, type: "text", text: "How far is your daily life from that vision? Where's the gap between what you say matters and what you actually do?" },
  { id: "p3", section: "Purpose & Identity", sectionIndex: 4, questionIndex: 2, type: "scale", text: "On a scale of 1–10, how aligned do you feel with your purpose right now?" },
  { id: "p4", section: "Purpose & Identity", sectionIndex: 4, questionIndex: 3, type: "text", text: "What would you stop doing tomorrow if nobody was watching and nobody would judge you?" },

  // Section 5: Environment & Systems
  { id: "e1", section: "Environment & Systems", sectionIndex: 5, questionIndex: 0, type: "text", text: "Look at your environment — your workspace, your home, your tools. Is your setup helping you or quietly working against you?" },
  { id: "e2", section: "Environment & Systems", sectionIndex: 5, questionIndex: 1, type: "text", text: "What systems are you using to manage your life? And — honestly — are they running your life or are you still running them?" },
  { id: "e3", section: "Environment & Systems", sectionIndex: 5, questionIndex: 2, type: "scale", text: "On a scale of 1–10, how organized does your life actually feel right now?" },
  { id: "e4", section: "Environment & Systems", sectionIndex: 5, questionIndex: 3, type: "text", text: "If you could only fix one thing in your life this week — one system, one habit, one decision — what would make the biggest difference?" },
];
