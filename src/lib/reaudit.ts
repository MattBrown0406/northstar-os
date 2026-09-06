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
  const { data: history, error: historyError } = await supabase
    .from("audit_history")
    .select("archived_at")
    .eq("user_id", userId)
    .order("archived_at", { ascending: false })
    .limit(1);

  if (historyError) return { eligible: false, reason: "Unable to check re-audit eligibility. Please try again." };
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
  const key = `intentus_reaudit_operation:${userId}`;
  let auditId = sessionStorage.getItem(key);
  if (!auditId) {
    const { data, error } = await supabase.from("baseline_audits").select("id")
      .eq("user_id", userId).eq("status", "completed").order("created_at", { ascending: false }).limit(1).single();
    if (error || !data) throw new Error(error?.message ?? "No completed audit found.");
    auditId = data.id;
    sessionStorage.setItem(key, auditId);
  }
  const rpc = supabase.rpc.bind(supabase) as unknown as (
    name: "archive_and_reset_audit", args: { p_audit_id: string }
  ) => PromiseLike<{ data: number | null; error: { message: string } | null }>;
  const { data, error } = await rpc("archive_and_reset_audit", { p_audit_id: auditId });
  if (error || data === null) throw new Error(error?.message ?? "No archive acknowledgement received.");
  sessionStorage.removeItem(key);
  return data;
}

/**
 * Get the full audit history for a user (oldest first).
 */
export async function getAuditHistory(userId: string): Promise<AuditHistoryEntry[]> {
  const { data, error } = await supabase
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
