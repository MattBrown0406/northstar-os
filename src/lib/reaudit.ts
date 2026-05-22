import { supabase } from "@/integrations/supabase/client";
import { addDays, differenceInDays } from "date-fns";

export interface AuditHistoryEntry {
  id: string;
  user_id: string;
  audit_data: Record<string, unknown>;
  report_data: Record<string, unknown> | null;
  audit_number: number;
  completed_at: string;
  archived_at: string;
}

/**
 * Check if a user is eligible to start a re-audit.
 * Eligible if: plan_tier is 'premium' or 'coach' AND no re-audit within the last 30 days.
 */
export async function canReaudit(userId: string): Promise<{
  eligible: boolean;
  reason?: string;
  nextEligibleDate?: Date;
}> {
  // Check plan tier
  const { data: profile } = await supabase
    .from("profiles")
    .select("plan_tier")
    .eq("user_id", userId)
    .single();

  const tier = profile?.plan_tier;
  if (tier !== "premium" && tier !== "coach") {
    return {
      eligible: false,
      reason: "Re-audit is available on the Premium and Coach plans.",
    };
  }

  // Check cooldown: most recent archived audit
  const { data: history } = await (supabase as any)
    .from("audit_history")
    .select("archived_at")
    .eq("user_id", userId)
    .order("archived_at", { ascending: false })
    .limit(1);

  if (history && history.length > 0) {
    const lastArchived = new Date(history[0].archived_at);
    const daysSince = differenceInDays(new Date(), lastArchived);
    if (daysSince < 30) {
      const nextDate = addDays(lastArchived, 30);
      return {
        eligible: false,
        reason: `You can re-audit once every 30 days.`,
        nextEligibleDate: nextDate,
      };
    }
  }

  return { eligible: true };
}

/**
 * Archive the current completed audit and its report, then reset so a new audit can begin.
 * Returns the audit_number assigned to the archived entry (i.e. what the new session will be).
 */
export async function archiveAndResetAudit(userId: string): Promise<number> {
  // 1. Fetch the current completed audit
  const { data: auditRows, error: auditErr } = await supabase
    .from("baseline_audits")
    .select("*")
    .eq("user_id", userId)
    .eq("status", "completed")
    .order("created_at", { ascending: false })
    .limit(1);

  if (auditErr) throw new Error(`Failed to fetch audit: ${auditErr.message}`);
  const audit = auditRows?.[0];
  if (!audit) throw new Error("No completed audit found to archive.");

  // 2. Fetch the most recent strategic report for this user
  const { data: reportRows } = await supabase
    .from("strategic_reports")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(1);

  const report = reportRows?.[0] ?? null;

  // 3. Determine the next audit_number (count existing history entries + 1)
  const { count } = await (supabase as any)
    .from("audit_history")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId);

  const auditNumber = (count ?? 0) + 1;

  // 4. Insert snapshot into audit_history
  const historyPayload = {
    user_id: userId,
    audit_data: {
      id: audit.id,
      responses: audit.responses,
      scores: audit.scores,
      completed_at: audit.completed_at,
      created_at: audit.created_at,
    },
    report_data: report
      ? {
          id: report.id,
          north_star_focus: report.north_star_focus,
          forced_choice: report.forced_choice,
          pattern_analysis: report.pattern_analysis,
          contradictions: report.contradictions,
          ninety_day_plan: report.ninety_day_plan,
          intent_model: (report as Record<string, unknown>).intent_model ?? null,
          created_at: report.created_at,
        }
      : null,
    audit_number: auditNumber,
    completed_at: audit.completed_at ?? new Date().toISOString(),
  };

  const { error: insertErr } = await (supabase as any)
    .from("audit_history")
    .insert(historyPayload);

  if (insertErr) throw new Error(`Failed to archive audit: ${insertErr.message}`);

  // 5. Delete the current strategic report (a new one will be generated after re-audit)
  if (report) {
    await supabase.from("strategic_reports").delete().eq("id", report.id);
  }

  // 6. Delete the completed audit so the Audit page creates a fresh one
  const { error: deleteErr } = await supabase
    .from("baseline_audits")
    .delete()
    .eq("id", audit.id);

  if (deleteErr) throw new Error(`Failed to reset audit: ${deleteErr.message}`);

  return auditNumber;
}

/**
 * Get the full audit history for a user (oldest first).
 */
export async function getAuditHistory(userId: string): Promise<AuditHistoryEntry[]> {
  const { data, error } = await (supabase as any)
    .from("audit_history")
    .select("*")
    .eq("user_id", userId)
    .order("audit_number", { ascending: true });

  if (error) {
    console.error("Failed to fetch audit history:", error.message);
    return [];
  }

  return (data ?? []) as AuditHistoryEntry[];
}
