import type { Tables } from "@/integrations/supabase/types";

export interface GettingStartedData {
  audits: Pick<Tables<"baseline_audits">, "id" | "status">[];
  reports: Pick<Tables<"strategic_reports">, "id">[];
  goals: Pick<Tables<"north_star_goals">, "title" | "is_active">[];
  commitments: Pick<Tables<"weekly_commitments">, "commitment" | "week_start">[];
  checkIns: Pick<Tables<"check_ins">, "created_at">[];
}

export function getGettingStarted(data: GettingStartedData, now = new Date()) {
  const monday = new Date(now);
  monday.setHours(0, 0, 0, 0);
  monday.setDate(monday.getDate() - (monday.getDay() + 6) % 7);
  const week = `${monday.getFullYear()}-${String(monday.getMonth() + 1).padStart(2, "0")}-${String(monday.getDate()).padStart(2, "0")}`;
  const goal = data.goals.find(g => g.is_active && g.title.trim());
  const commitment = data.commitments.find(c => c.week_start === week && c.commitment.trim());
  const hasCommitment = data.commitments.some(c => c.commitment.trim());
  const checkedInThisWeek = data.checkIns.some(c => {
    const date = new Date(c.created_at);
    return date >= monday && date <= now;
  });
  const steps = [
    { id: "audit", title: "Complete your operating audit", route: "/audit", estimate: "Approx. 20–30 min", complete: data.audits.some(a => a.status === "completed") },
    { id: "report", title: "Generate your strategic report", route: "/report", estimate: "Approx. 2–5 min", complete: data.reports.length > 0 },
    { id: "goals", title: "Set a North Star goal", route: "/goals", estimate: "Approx. 5 min", complete: !!goal },
    { id: "commitment", title: "Save your first weekly commitment", route: "/check-in", estimate: "Approx. 2–5 min", complete: hasCommitment },
    { id: "checkin", title: "Save your first check-in", route: "/check-in", estimate: "Approx. 2–5 min", complete: data.checkIns.length > 0 },
  ];
  const incomplete = steps.find(s => !s.complete);
  const next = incomplete ?? (!commitment
    ? { id: "weekly-commitment", title: "Set this week’s commitment", route: "/check-in", estimate: "Approx. 2–5 min" }
    : !checkedInThisWeek
      ? { id: "weekly-checkin", title: "Check in on this week", route: "/check-in", estimate: "Approx. 2–5 min" }
      : { id: "weekly-review", title: "Review your plan for this week", route: "/report", estimate: "Approx. 5 min" });
  return { steps, next, goal, commitment, complete: !incomplete };
}
