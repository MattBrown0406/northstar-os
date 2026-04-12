import { supabase } from "@/integrations/supabase/client";

export interface WeeklyCommitment {
  id: string;
  user_id: string;
  week_start: string;
  commitment: string;
  outcome: string | null;
  reflection: string | null;
  created_at: string;
  completed_at: string | null;
}

/**
 * Returns the ISO date string of the Monday of the week containing `date`.
 */
function getMondayOfWeek(date: Date): string {
  const d = new Date(date);
  const day = d.getDay(); // 0=Sun, 1=Mon, ...
  const diff = (day === 0 ? -6 : 1 - day);
  d.setDate(d.getDate() + diff);
  return d.toISOString().split("T")[0];
}

/**
 * Get the current week's commitment for the user (if it exists).
 */
export async function getCurrentWeekCommitment(userId: string): Promise<WeeklyCommitment | null> {
  const weekStart = getMondayOfWeek(new Date());
  const { data, error } = await supabase
    .from("weekly_commitments")
    .select("*")
    .eq("user_id", userId)
    .eq("week_start", weekStart)
    .maybeSingle();
  if (error) {
    console.error("getCurrentWeekCommitment error:", error);
    return null;
  }
  return data as WeeklyCommitment | null;
}

/**
 * Get the most recent PREVIOUS week's commitment (not the current week).
 * Used at the start of a check-in to ask about follow-through.
 */
export async function getPreviousWeekCommitment(userId: string): Promise<WeeklyCommitment | null> {
  const thisWeekStart = getMondayOfWeek(new Date());
  const { data, error } = await supabase
    .from("weekly_commitments")
    .select("*")
    .eq("user_id", userId)
    .lt("week_start", thisWeekStart)
    .order("week_start", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) {
    console.error("getPreviousWeekCommitment error:", error);
    return null;
  }
  return data as WeeklyCommitment | null;
}

/**
 * Set (upsert) this week's "one thing" commitment.
 */
export async function setWeeklyCommitment(userId: string, commitment: string): Promise<WeeklyCommitment> {
  const weekStart = getMondayOfWeek(new Date());
  const { data, error } = await supabase
    .from("weekly_commitments")
    .upsert(
      { user_id: userId, week_start: weekStart, commitment },
      { onConflict: "user_id,week_start" }
    )
    .select()
    .single();
  if (error) throw new Error(`setWeeklyCommitment error: ${error.message}`);
  return data as WeeklyCommitment;
}

/**
 * Record the outcome of a previous week's commitment.
 */
export async function recordCommitmentOutcome(
  commitmentId: string,
  outcome: "yes" | "partially" | "no",
  reflection?: string
): Promise<void> {
  const updates: Record<string, string> = { outcome };
  if (outcome === "yes") updates.completed_at = new Date().toISOString();
  if (reflection) updates.reflection = reflection;

  const { error } = await supabase
    .from("weekly_commitments")
    .update(updates)
    .eq("id", commitmentId);
  if (error) throw new Error(`recordCommitmentOutcome error: ${error.message}`);
}

/**
 * Get the follow-through summary for the user over the last N weeks.
 * Returns a rate (0–1), a human-readable pattern string, and recent outcomes.
 */
export async function getFollowThroughSummary(
  userId: string,
  weeks = 8
): Promise<{ rate: number; pattern: string; recentOutcomes: string[] }> {
  // Go back `weeks` Mondays
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - weeks * 7);
  const cutoffStr = cutoff.toISOString().split("T")[0];

  const { data, error } = await supabase
    .from("weekly_commitments")
    .select("outcome")
    .eq("user_id", userId)
    .gte("week_start", cutoffStr)
    .order("week_start", { ascending: false });

  if (error || !data || data.length === 0) {
    return { rate: 0, pattern: "insufficient data", recentOutcomes: [] };
  }

  const withOutcomes = data.filter((d) => d.outcome !== null);
  if (withOutcomes.length === 0) {
    return { rate: 0, pattern: "insufficient data", recentOutcomes: [] };
  }

  const yesCount = withOutcomes.filter((d) => d.outcome === "yes").length;
  const partialCount = withOutcomes.filter((d) => d.outcome === "partially").length;
  // Partial counts as 0.5
  const rate = (yesCount + partialCount * 0.5) / withOutcomes.length;

  let pattern: string;
  if (withOutcomes.length < 3) {
    pattern = "not enough data yet to identify a pattern";
  } else if (rate >= 0.8) {
    pattern = "You complete most of what you commit to";
  } else if (rate >= 0.6) {
    pattern = "You follow through more often than not";
  } else if (rate >= 0.4) {
    pattern = "You consistently start strong but rarely finish";
  } else {
    pattern = "Your commitments are consistently not being completed — this needs direct attention";
  }

  const recentOutcomes = withOutcomes.slice(0, weeks).map((d) => d.outcome as string);
  return { rate, pattern, recentOutcomes };
}

interface NinetyDayPlan {
  phases?: Array<{
    phase?: string | number;
    title?: string;
    days?: string;
    actions?: string[];
    focus?: string;
    [key: string]: unknown;
  }>;
  [key: string]: unknown;
}

/**
 * Get the 90-day plan actions from the user's most recent strategic report,
 * filtered to the phase that matches where they are in their journey.
 */
export async function getPlanActionsForCurrentPhase(userId: string): Promise<string[]> {
  const { data: reportData, error } = await supabase
    .from("strategic_reports")
    .select("ninety_day_plan, created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error || !reportData?.ninety_day_plan) return [];

  const plan = reportData.ninety_day_plan as NinetyDayPlan;
  const reportCreated = new Date(reportData.created_at);
  const daysSinceReport = Math.floor((Date.now() - reportCreated.getTime()) / (1000 * 60 * 60 * 24));

  // Determine which phase based on days elapsed
  const phases = plan?.phases;
  if (!Array.isArray(phases) || phases.length === 0) return [];

  let targetPhase = phases[0];
  if (daysSinceReport >= 60 && phases.length >= 3) {
    targetPhase = phases[2];
  } else if (daysSinceReport >= 30 && phases.length >= 2) {
    targetPhase = phases[1];
  }

  const actions = targetPhase?.actions;
  return Array.isArray(actions) ? actions : [];
}
