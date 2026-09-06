import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { getGettingStarted, type GettingStartedData } from "@/lib/getting-started";

// A keyed child fences both already-rendered data and delayed requests on account changes.
export default function GettingStarted({ userId }: { userId: string }) {
  return <AccountGettingStarted key={userId} userId={userId} />;
}

function AccountGettingStarted({ userId }: { userId: string }) {
  const [data, setData] = useState<GettingStartedData | null>(null);
  const [failed, setFailed] = useState(false);
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    let active = true;
    setData(null);
    setFailed(false);
    async function load() {
      try {
        if (!userId) throw new Error("Missing account");
        const [audits, reports, goals, commitments, checkIns] = await Promise.all([
          supabase.from("baseline_audits").select("id, status").eq("user_id", userId).eq("status", "completed").limit(1),
          supabase.from("strategic_reports").select("id").eq("user_id", userId).limit(1),
          supabase.from("north_star_goals").select("title, is_active").eq("user_id", userId).eq("is_active", true).order("created_at", { ascending: true }),
          supabase.from("weekly_commitments").select("commitment, week_start").eq("user_id", userId).order("week_start", { ascending: false }).limit(1),
          supabase.from("check_ins").select("created_at").eq("user_id", userId).order("created_at", { ascending: false }).limit(1),
        ]);
        if ([audits, reports, goals, commitments, checkIns].some(r => r.error || !r.data)) throw new Error("Progress unavailable");
        if (active) setData({ audits: audits.data!, reports: reports.data!, goals: goals.data!, commitments: commitments.data!, checkIns: checkIns.data! });
      } catch {
        if (active) setFailed(true);
      }
    }
    void load();
    return () => { active = false; };
  }, [userId, attempt]);

  if (failed) return <section className="rounded-xl border border-border bg-card p-6" aria-label="Getting started">
    <p role="alert">We couldn’t load your progress. Your saved work hasn’t changed.</p>
    <Button variant="outline" className="mt-3" onClick={() => setAttempt(a => a + 1)}>Retry progress</Button>
  </section>;
  if (!data) return <p role="status" className="text-sm text-muted-foreground">Loading your next step…</p>;
  const guide = getGettingStarted(data);
  return <section className="space-y-4" aria-label="Getting started">
    <div className="rounded-xl border border-primary/30 bg-primary/5 p-5 sm:p-6 space-y-3">
      <p className="text-xs uppercase tracking-wide text-primary font-semibold">Your next best action</p>
      <h2 className="font-heading text-xl font-bold">{guide.next.title}</h2>
      <p className="text-sm text-muted-foreground">{guide.next.estimate}. Build direction with your audit and goals, then turn it into one concrete weekly action.</p>
      {guide.goal && <p className="text-sm break-words"><strong>North Star:</strong> {guide.goal.title}</p>}
      {guide.commitment && <p className="text-sm break-words"><strong>This week’s commitment:</strong> {guide.commitment.commitment}</p>}
      {guide.goal && <p className="text-sm text-muted-foreground">{guide.commitment ? "At your next check-in, reflect on whether this commitment moved you toward your North Star." : "Choose one action that moves you toward this goal. Save it at the end of your check-in."}</p>}
      <Button asChild className="h-auto min-h-11 whitespace-normal"><Link to={guide.next.route}>{guide.next.title}</Link></Button>
    </div>
    <details className="rounded-xl border border-border bg-card p-5" open={!guide.complete}>
      <summary className="cursor-pointer font-semibold">Your first-week guide · {guide.steps.filter(s => s.complete).length}/{guide.steps.length} saved milestones</summary>
      <p className="mt-3 text-sm text-muted-foreground">Go at your own pace. Progress comes from saved records, not checked boxes. Commitment and check-in are saved together in the check-in flow. A generated report does not mean you have read it.</p>
      <ol className="mt-4 space-y-3">
        {guide.steps.map(step => <li key={step.id} className="flex items-start gap-3 text-sm">
          <span aria-label={step.complete ? "Complete" : "Not complete"} className="mt-0.5 text-primary">{step.complete ? "✓" : "○"}</span>
          <div><Link className="underline underline-offset-4 hover:text-primary" to={step.route}>{step.title}</Link><p className="text-xs text-muted-foreground mt-1">{step.estimate} · {step.complete ? "Saved" : "Start or continue"}</p></div>
        </li>)}
      </ol>
    </details>
  </section>;
}
