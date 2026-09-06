import { supabase } from "@/integrations/supabase/client";

export interface StorySnapshot {
  completed_at?: string | null;
  report_data?: unknown;
}
export interface StoryCommitment { week_start: string; outcome: string | null }
export interface StoryCheckIn { created_at: string; mood_score?: number | null; energy_score?: number | null }
export interface ProgressStoryData {
  history: StorySnapshot[];
  latest: Record<string, unknown> | null;
  commitments: StoryCommitment[];
  checkIns: StoryCheckIn[];
}
const record = (v: unknown): Record<string, unknown> => v && typeof v === "object" && !Array.isArray(v) ? v as Record<string, unknown> : {};
const text = (v: unknown) => typeof v === "string" && v.trim() ? v.trim() : null;
const timestamp = (v: unknown) => typeof v === "string" ? Date.parse(v) : NaN;

export function buildProgressStory(data: ProgressStoryData) {
  // report_data is the exact strategic_reports row archived by archive_and_reset_audit.
  const snapshots = data.history.map(h => ({ report: record(h.report_data), date: h.completed_at }))
    .concat(data.latest ? [{ report: data.latest, date: text(data.latest.created_at) }] : [])
    .filter(s => Number.isFinite(timestamp(s.date)) && Object.keys(s.report).length > 0)
    .sort((a, b) => timestamp(a.date) - timestamp(b.date));
  const latest = snapshots.at(-1);
  const previous = snapshots.slice(0, -1).reverse().find(s => timestamp(s.date) < timestamp(latest?.date));
  const changes: { label: string; before: string; after: string; changed: boolean }[] = [];
  if (previous && latest) {
    for (const [key, label] of [["north_star_focus", "Operating focus"], ["forced_choice", "Key tradeoff"]]) {
      const before = text(previous.report[key]);
      const after = text(latest.report[key]);
      if (before && after) changes.push({ label, before, after, changed: before !== after });
    }
  }
  const counts = { completed: 0, partial: 0, notCompleted: 0, unreported: 0 };
  for (const c of data.commitments) {
    if (c.outcome === "yes") counts.completed++;
    else if (c.outcome === "partially") counts.partial++;
    else if (c.outcome === "no") counts.notCompleted++;
    else counts.unreported++;
  }
  const adjustment = counts.partial + counts.notCompleted > 0
    ? "Make your next commitment smaller: choose one observable step and give it a specific time this week."
    : counts.unreported > 0
      ? "At your next check-in, record an outcome for a past commitment before choosing another."
      : "Choose one observable action from your operating focus and record its outcome at your next check-in.";
  return { changes, counts, adjustment, checkInCount: data.checkIns.length,
    from: previous?.date, to: latest?.date, focus: text(latest?.report.north_star_focus),
    insufficientBaseline: changes.length === 0 };
}

export async function fetchProgressStory(userId: string): Promise<ProgressStoryData> {
  if (!userId) throw new Error("Sign in to view your progress.");
  const since = new Date(Date.now() - 56 * 86400000).toISOString();
  const results = await Promise.all([
    supabase.from("audit_history").select("completed_at, report_data").eq("user_id", userId).order("completed_at", { ascending: false }).limit(20),
    supabase.from("strategic_reports").select("id, created_at, north_star_focus, forced_choice").eq("user_id", userId).order("created_at", { ascending: false }).order("id", { ascending: false }).limit(1),
    supabase.from("weekly_commitments").select("week_start, outcome").eq("user_id", userId).gte("week_start", since.slice(0, 10)).order("week_start", { ascending: false }),
    supabase.from("check_ins").select("created_at").eq("user_id", userId).gte("created_at", since).order("created_at", { ascending: false }),
  ]);
  const labels = ["audit history", "latest report", "commitments", "check-ins"];
  results.forEach((result, i) => {
    if (result.error || !Array.isArray(result.data)) throw new Error(`Could not load ${labels[i]}. Please retry.`);
  });
  return { history: results[0].data!, latest: results[1].data![0] ?? null,
    commitments: results[2].data!, checkIns: results[3].data! };
}
