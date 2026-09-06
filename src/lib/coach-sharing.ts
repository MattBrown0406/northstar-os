import { supabase } from "@/integrations/supabase/client";
import { bounded } from "@/contexts/AuthContext";
import { z } from "zod";

export const SHARING_CATEGORIES = [
  "Profile (including preferences and account details)",
  "Baseline audits, responses and audit history",
  "Strategic reports and plans (including coach edits)",
  "Check-ins, including wins, blockers and commitments recorded there",
  "North Star goals and plan action completions",
  "AI coaching conversation history",
  "Coach annotations about you",
] as const;
const schema = z.object({ enabled: z.boolean(), legacy: z.boolean(), coaches: z.array(z.object({ id: z.string(), name: z.string().nullable(), eligible: z.boolean() })) });
export type CoachSharing = z.infer<typeof schema>;
export function sharingStatus(state: CoachSharing): string {
  if (!state.enabled) return "Human-coach sharing is off.";
  if (!state.coaches.some(c => c.eligible)) return "No eligible linked human coach currently has access. Sharing is enabled for eligible linked coaches.";
  return "Human-coach sharing is on for eligible linked coaches.";
}
// Narrow adapter for the newly migrated RPCs, before generated DB types are refreshed.
const rpc = supabase.rpc.bind(supabase) as unknown as (name: string, args?: Record<string, boolean>) => PromiseLike<{data: unknown; error: {message: string} | null}>;
export async function loadCoachSharing(): Promise<CoachSharing> {
  const { data, error } = await bounded(rpc("get_coach_sharing"));
  if (error) throw new Error(error.message);
  return schema.parse(data);
}
export async function saveCoachSharing(enabled: boolean, acknowledged: boolean): Promise<CoachSharing> {
  if (!acknowledged) throw new Error("Please acknowledge the sharing scope.");
  const { error } = await bounded(rpc("set_coach_sharing", {p_enabled: enabled, p_acknowledged: acknowledged}));
  if (error) throw new Error(error.message);
  const saved = await loadCoachSharing();
  if (saved.enabled !== enabled) throw new Error("The saved preference could not be confirmed. Reload to check current access.");
  return saved;
}
