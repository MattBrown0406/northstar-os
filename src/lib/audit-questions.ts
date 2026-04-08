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
  "How You're Showing Up",
  "Where Your Time Actually Goes",
  "The People Around You",
  "What You're Building Toward",
  "Money & the Hard Truths",
  "What Needs to Change",
];

export const AUDIT_QUESTIONS: AuditQuestion[] = [
  // Section 0: How You're Showing Up — start safe, observable, body-based
  { id: "s1", section: "How You're Showing Up", sectionIndex: 0, questionIndex: 0, type: "text", text: "Before we get into anything — how are you actually doing right now? Not the polished answer. The real one." },
  { id: "s2", section: "How You're Showing Up", sectionIndex: 0, questionIndex: 1, type: "text", text: "How did you sleep last week? And be honest — are you the kind of person who wears exhaustion like a badge?" },
  { id: "s3", section: "How You're Showing Up", sectionIndex: 0, questionIndex: 2, type: "scale", text: "On a scale of 1–10, how would you rate your physical energy right now?" },
  { id: "s4", section: "How You're Showing Up", sectionIndex: 0, questionIndex: 3, type: "text", text: "What's the one health habit you keep telling yourself you'll start — but haven't? What's really stopping you?" },

  // Section 1: Where Your Time Actually Goes — still relatively safe, builds self-awareness
  { id: "t1", section: "Where Your Time Actually Goes", sectionIndex: 1, questionIndex: 0, type: "text", text: "Walk me through yesterday. Not what was on the calendar — what actually happened, hour by hour." },
  { id: "t2", section: "Where Your Time Actually Goes", sectionIndex: 1, questionIndex: 1, type: "text", text: "Where do you lose time and you know it? What keeps pulling you back to that thing?" },
  { id: "t3", section: "Where Your Time Actually Goes", sectionIndex: 1, questionIndex: 2, type: "scale", text: "On a scale of 1–10, how intentional are you with your time right now?" },
  { id: "t4", section: "Where Your Time Actually Goes", sectionIndex: 1, questionIndex: 3, type: "text", text: "When do you feel most alive and focused? And when do you feel like you're just going through the motions?" },

  // Section 2: The People Around You — getting more personal, relational honesty
  { id: "r1", section: "The People Around You", sectionIndex: 2, questionIndex: 0, type: "text", text: "Who are the three people you spend the most time with? And here's the harder question — do they make you better or just more comfortable?" },
  { id: "r2", section: "The People Around You", sectionIndex: 2, questionIndex: 1, type: "text", text: "Is there a relationship right now that's costing you more than it's giving you? You don't have to name names — just tell me about it." },
  { id: "r3", section: "The People Around You", sectionIndex: 2, questionIndex: 2, type: "scale", text: "On a scale of 1–10, how supported do you feel by the people around you?" },
  { id: "r4", section: "The People Around You", sectionIndex: 2, questionIndex: 3, type: "text", text: "What's a conversation you've been avoiding? Not the small stuff — the one that sits in your chest." },

  // Section 3: What You're Building Toward — identity, purpose, the deeper layer
  { id: "p1", section: "What You're Building Toward", sectionIndex: 3, questionIndex: 0, type: "text", text: "If you had to explain what you're building your life around right now — in one honest sentence — what would you say?" },
  { id: "p2", section: "What You're Building Toward", sectionIndex: 3, questionIndex: 1, type: "text", text: "How far is your daily life from that vision? Where's the gap between what you say matters and what you actually do?" },
  { id: "p3", section: "What You're Building Toward", sectionIndex: 3, questionIndex: 2, type: "scale", text: "On a scale of 1–10, how aligned do you feel with your purpose right now?" },
  { id: "p4", section: "What You're Building Toward", sectionIndex: 3, questionIndex: 3, type: "text", text: "What would you stop doing tomorrow if nobody was watching and nobody would judge you?" },

  // Section 4: Money & the Hard Truths — vulnerability, shame, fear territory
  { id: "m1", section: "Money & the Hard Truths", sectionIndex: 4, questionIndex: 0, type: "text", text: "Let's talk money. What's your primary source of income right now — and is it going in the direction you want?" },
  { id: "m2", section: "Money & the Hard Truths", sectionIndex: 4, questionIndex: 1, type: "text", text: "What financial decision have you been avoiding? Not the one you're working on — the one you don't even want to think about." },
  { id: "m3", section: "Money & the Hard Truths", sectionIndex: 4, questionIndex: 2, type: "scale", text: "On a scale of 1–10, how confident are you in where you're headed financially?" },
  { id: "m4", section: "Money & the Hard Truths", sectionIndex: 4, questionIndex: 3, type: "text", text: "If your income dropped by half tomorrow, what would you cut first? And what would you refuse to let go of — even if it didn't make financial sense?" },

  // Section 5: What Needs to Change — forward-looking, empowering close
  { id: "c1", section: "What Needs to Change", sectionIndex: 5, questionIndex: 0, type: "text", text: "Look at your environment — your workspace, your home, your tools. Is your setup helping you or quietly working against you?" },
  { id: "c2", section: "What Needs to Change", sectionIndex: 5, questionIndex: 1, type: "text", text: "What systems are you using to manage your life? And — honestly — are they running your life or are you still running them?" },
  { id: "c3", section: "What Needs to Change", sectionIndex: 5, questionIndex: 2, type: "scale", text: "On a scale of 1–10, how organized does your life actually feel right now?" },
  { id: "c4", section: "What Needs to Change", sectionIndex: 5, questionIndex: 3, type: "text", text: "If you could only fix one thing in your life this week — one system, one habit, one decision — what would make the biggest difference?" },
];
