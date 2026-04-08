import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import MoodEnergyChart from "@/components/dashboard/MoodEnergyChart";
import DriftTracker from "@/components/dashboard/DriftTracker";
import {
  Compass, LogOut, Target, TrendingUp, Flame,
  CheckCircle, AlertTriangle, ArrowRight, BarChart3, Clock,
  FileText, Users, MessageSquare, Sparkles, Lock,
} from "lucide-react";
import { format, differenceInDays } from "date-fns";
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

interface Profile {
  display_name: string | null;
  coaching_tone: string | null;
  check_in_cadence: string | null;
  plan_tier: string | null;
  onboarding_completed: boolean | null;
}

interface CheckIn {
  id: string;
  mood_score: number | null;
  energy_score: number | null;
  wins: string[] | null;
  blockers: string[] | null;
  commitments: string[] | null;
  drift_detected: boolean | null;
  created_at: string;
}

const Dashboard = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [checkIns, setCheckIns] = useState<CheckIn[]>([]);
  const [auditCompleted, setAuditCompleted] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      const [profileRes, checkInsRes, auditRes] = await Promise.all([
        supabase.from("profiles").select("*").eq("user_id", user.id).single(),
        supabase.from("check_ins").select("*").eq("user_id", user.id).order("created_at", { ascending: false }).limit(30),
        supabase.from("baseline_audits").select("status").eq("user_id", user.id).eq("status", "completed").limit(1),
      ]);
      if (profileRes.data) setProfile(profileRes.data as any);
      if (checkInsRes.data) setCheckIns(checkInsRes.data as any);
      setAuditCompleted((auditRes.data?.length ?? 0) > 0);
      setLoading(false);
    };
    load();
  }, [user]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  const streak = calculateStreak(checkIns);
  const moodSamples = checkIns.filter((c) => c.mood_score !== null);
  const energySamples = checkIns.filter((c) => c.energy_score !== null);
  const avgMood = moodSamples.length > 0
    ? (moodSamples.reduce((acc, c) => acc + (c.mood_score ?? 0), 0) / moodSamples.length).toFixed(1)
    : "—";
  const avgEnergy = energySamples.length > 0
    ? (energySamples.reduce((acc, c) => acc + (c.energy_score ?? 0), 0) / energySamples.length).toFixed(1)
    : "—";
  const driftCount = checkIns.filter((c) => c.drift_detected).length;
  const recentCommitments = checkIns[0]?.commitments ?? [];
  const planTier = profile?.plan_tier ?? "free";
  const trendWindow = planTier === "premium" || planTier === "coach" ? 10 : planTier === "pro" ? 7 : 4;
  const trendData = [...checkIns]
    .slice(0, trendWindow)
    .reverse()
    .map((checkIn, index) => ({
      label: checkIn.created_at ? format(new Date(checkIn.created_at), "MMM d") : `Check-in ${index + 1}`,
      focus: checkIn.mood_score ?? null,
      energy: checkIn.energy_score ?? null,
      drift: checkIn.drift_detected ? 1 : 0,
    }));
  const hasTrendData = trendData.some((point) => point.focus !== null || point.energy !== null);
  const tierSummary = getTierSummary(planTier);

  return (
    <div className="min-h-screen bg-background">
      <nav className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto flex items-center justify-between h-14 px-4">
          <div className="flex items-center gap-2">
            <div className="bg-gradient-primary rounded-lg p-1.5">
              <Compass className="h-4 w-4 text-primary-foreground" />
            </div>
            <span className="font-heading text-lg font-bold text-foreground">Intentus</span>
          </div>
          <div className="flex items-center gap-2">
            {profile?.plan_tier === "coach" && (
              <Button variant="outline" size="sm" onClick={() => navigate("/coach")} className="border-primary text-primary">
                <Users className="h-4 w-4 mr-1" /> Coach Portal
              </Button>
            )}
            <Button variant="ghost" size="sm" onClick={() => navigate("/audit")}>Audit</Button>
            <Button variant="ghost" size="sm" onClick={() => navigate("/check-in")}>Check-in</Button>
            <Button variant="ghost" size="sm" onClick={() => navigate("/coaching")}>
              <MessageSquare className="h-4 w-4 mr-1" /> Coach
            </Button>
            {auditCompleted && (
              <Button variant="ghost" size="sm" onClick={() => navigate("/report")}>
                <FileText className="h-4 w-4 mr-1" /> Report
              </Button>
            )}
            <Button variant="ghost" size="icon" onClick={signOut}><LogOut className="h-4 w-4" /></Button>
          </div>
        </div>
      </nav>

      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="mb-8">
          <h1 className="font-heading text-2xl font-bold text-foreground">
            Welcome back{profile?.display_name ? `, ${profile.display_name}` : ""}
          </h1>
          <p className="text-muted-foreground">Here’s your operating snapshot.</p>
        </div>

        {!auditCompleted ? (
          <div className="bg-gradient-subtle rounded-2xl p-6 border border-primary/20 mb-8 flex items-center justify-between gap-4">
            <div>
              <h3 className="font-heading font-bold text-foreground">Complete your Operating Audit</h3>
              <p className="text-sm text-muted-foreground">Get your operating report, priority focus, and 90-day plan</p>
            </div>
            <Button variant="hero" onClick={() => navigate("/audit")}>
              Start audit <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        ) : (
          <div className="bg-gradient-subtle rounded-2xl p-6 border border-primary/20 mb-8 flex items-center justify-between gap-4">
            <div>
              <h3 className="font-heading font-bold text-foreground">Your Operating Report is ready</h3>
              <p className="text-sm text-muted-foreground">Review your patterns, blind spots, and 90-day operating plan</p>
            </div>
            <Button variant="hero" onClick={() => navigate("/report")}>
              View report <FileText className="ml-2 h-4 w-4" />
            </Button>
          </div>
        )}

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <StatCard icon={<Flame className="h-5 w-5 text-accent" />} label="Streak" value={`${streak} days`} />
          <StatCard icon={<TrendingUp className="h-5 w-5 text-primary" />} label="Avg focus" value={avgMood} />
          <StatCard icon={<BarChart3 className="h-5 w-5 text-primary" />} label="Avg energy" value={avgEnergy} />
          <StatCard icon={<AlertTriangle className="h-5 w-5 text-accent" />} label="Drift flags" value={String(driftCount)} />
        </div>

        <div className="grid gap-6 xl:grid-cols-[1.35fr_0.95fr]">
          <div className="space-y-6">
            <div className="bg-card rounded-2xl border border-border p-6">
              <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <h3 className="font-heading font-bold text-foreground flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-primary" /> Operating Trend
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {hasTrendData
                      ? `Showing your last ${trendData.length} check-ins based on your ${tierSummary.label} tier.`
                      : "Complete a few check-ins to unlock a real trendline."}
                  </p>
                </div>
                <div className="inline-flex items-center gap-2 rounded-full border border-primary/15 bg-primary/5 px-3 py-1 text-xs font-medium text-primary">
                  <Sparkles className="h-3.5 w-3.5" /> {tierSummary.badge}
                </div>
              </div>

              {hasTrendData ? (
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={trendData}>
                      <CartesianGrid stroke="hsl(var(--border))" strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="label" axisLine={false} tickLine={false} minTickGap={24} />
                      <YAxis domain={[0, 10]} axisLine={false} tickLine={false} width={26} />
                      <Tooltip
                        cursor={{ stroke: "hsl(var(--border))", strokeDasharray: "4 4" }}
                        contentStyle={{
                          borderRadius: 12,
                          border: "1px solid hsl(var(--border))",
                          background: "hsl(var(--background))",
                        }}
                      />
                      <Line type="monotone" dataKey="focus" name="Focus" stroke="hsl(var(--primary))" strokeWidth={3} dot={{ r: 0 }} connectNulls />
                      <Line type="monotone" dataKey="energy" name="Energy" stroke="hsl(var(--accent))" strokeWidth={3} dot={{ r: 0 }} connectNulls />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="rounded-2xl border border-dashed border-border bg-muted/20 p-6 text-sm text-muted-foreground">
                  Your trend view will populate from real check-ins. For now, start one check-in and the dashboard will begin plotting focus and energy over time.
                </div>
              )}

              <div className="mt-5 grid gap-3 sm:grid-cols-3">
                <TrendCallout label="Trend window" value={tierSummary.windowLabel} tone="primary" />
                <TrendCallout label="Drift flags" value={driftCount ? `${driftCount} detected` : "None flagged"} tone="accent" />
                <TrendCallout label="Cadence" value={profile?.check_in_cadence ? capitalize(profile.check_in_cadence) : "Set during onboarding"} tone="neutral" />
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <MoodEnergyChart checkIns={checkIns} />
              <DriftTracker checkIns={checkIns} />
            </div>

            <div className="bg-card rounded-2xl border border-border p-6">
              <h3 className="font-heading font-bold text-foreground mb-4 flex items-center gap-2">
                <Target className="h-5 w-5 text-primary" /> Current Commitments
              </h3>
              {recentCommitments.length > 0 ? (
                <ul className="space-y-3">
                  {recentCommitments.map((c, i) => (
                    <li key={i} className="flex items-start gap-3 rounded-xl border border-border/70 bg-background/70 px-4 py-3 text-sm">
                      <CheckCircle className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                      <span className="text-foreground">{c}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-muted-foreground">No commitments yet. Complete a check-in to set them.</p>
              )}
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-card rounded-2xl border border-border p-6">
              <h3 className="font-heading font-bold text-foreground mb-3 flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-primary" /> Tier Access
              </h3>
              <p className="text-sm text-muted-foreground mb-4">Your dashboard mirrors what’s available on your current plan without faking data that doesn’t exist.</p>
              <div className="rounded-2xl border border-primary/15 bg-primary/5 p-4 mb-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-xs uppercase tracking-[0.2em] text-primary/80">Current tier</p>
                    <p className="font-heading text-xl font-bold text-foreground">{tierSummary.label}</p>
                  </div>
                  <div className="rounded-full bg-background px-3 py-1 text-xs font-medium text-primary shadow-sm">{tierSummary.badge}</div>
                </div>
              </div>
              <div className="space-y-3">
                {tierSummary.features.map((feature) => (
                  <div key={feature.label} className="flex items-center justify-between rounded-xl border border-border/70 bg-background/70 px-4 py-3 text-sm">
                    <div className="flex items-center gap-2">
                      {feature.available ? <CheckCircle className="h-4 w-4 text-primary" /> : <Lock className="h-4 w-4 text-muted-foreground" />}
                      <span className="text-foreground">{feature.label}</span>
                    </div>
                    <span className={`text-xs font-medium ${feature.available ? "text-primary" : "text-muted-foreground"}`}>{feature.status}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-card rounded-2xl border border-border p-6">
              <h3 className="font-heading font-bold text-foreground mb-4 flex items-center gap-2">
                <Clock className="h-5 w-5 text-primary" /> Recent Check-ins
              </h3>
              {checkIns.length > 0 ? (
                <ul className="space-y-3">
                  {checkIns.slice(0, 5).map((c) => (
                    <li key={c.id} className="flex items-center justify-between gap-3 text-sm border-b border-border pb-3 last:border-0">
                      <span className="text-muted-foreground">{format(new Date(c.created_at), "MMM d, h:mm a")}</span>
                      <div className="flex items-center gap-3 flex-wrap justify-end">
                        <span className="text-foreground">Focus: {c.mood_score ?? "—"}</span>
                        <span className="text-foreground">Energy: {c.energy_score ?? "—"}</span>
                        {c.drift_detected && <AlertTriangle className="h-4 w-4 text-accent" />}
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-muted-foreground">No check-ins yet.</p>
              )}
            </div>
          </div>
        </div>

        <div className="mt-8 text-center">
          <Button variant="hero" size="lg" onClick={() => navigate("/check-in")}>
            Start check-in <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};

function StatCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="bg-card rounded-2xl border border-border p-4">
      <div className="flex items-center gap-2 mb-2">{icon}<span className="text-xs text-muted-foreground">{label}</span></div>
      <p className="font-heading text-2xl font-bold text-foreground">{value}</p>
    </div>
  );
}

function TrendCallout({ label, value, tone }: { label: string; value: string; tone: "primary" | "accent" | "neutral" }) {
  const toneClass = tone === "primary"
    ? "border-primary/20 bg-primary/5 text-primary"
    : tone === "accent"
      ? "border-accent/20 bg-accent/5 text-accent"
      : "border-border bg-muted/30 text-foreground";

  return (
    <div className={`rounded-2xl border px-4 py-3 ${toneClass}`}>
      <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">{label}</p>
      <p className="mt-1 text-sm font-medium">{value}</p>
    </div>
  );
}

function getTierSummary(planTier: string) {
  switch (planTier) {
    case "premium":
      return {
        label: "Premium",
        badge: "Extended trends",
        windowLabel: "Last 10 check-ins",
        features: [
          { label: "Momentum chart", status: "10-point view", available: true },
          { label: "Commitment tracking", status: "Included", available: true },
          { label: "AI coaching chat", status: "Included", available: true },
        ],
      };
    case "coach":
      return {
        label: "Coach",
        badge: "Full visibility",
        windowLabel: "Last 10 check-ins",
        features: [
          { label: "Momentum chart", status: "10-point view", available: true },
          { label: "Client-facing workflows", status: "Included", available: true },
          { label: "AI coaching chat", status: "Included", available: true },
        ],
      };
    case "pro":
      return {
        label: "Pro",
        badge: "Balanced visibility",
        windowLabel: "Last 7 check-ins",
        features: [
          { label: "Momentum chart", status: "7-point view", available: true },
          { label: "Commitment tracking", status: "Included", available: true },
          { label: "Extended trend history", status: "Premium tier", available: false },
        ],
      };
    default:
      return {
        label: "Free",
        badge: "Starter view",
        windowLabel: "Last 4 check-ins",
        features: [
          { label: "Momentum chart", status: "4-point view", available: true },
          { label: "Commitment tracking", status: "Included", available: true },
          { label: "Extended trend history", status: "Upgrade required", available: false },
        ],
      };
  }
}

function capitalize(value: string) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function calculateStreak(checkIns: CheckIn[]): number {
  if (checkIns.length === 0) return 0;
  let streak = 1;
  const sorted = [...checkIns].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  for (let i = 1; i < sorted.length; i++) {
    const diff = differenceInDays(new Date(sorted[i - 1].created_at), new Date(sorted[i].created_at));
    if (diff <= 1) streak++;
    else break;
  }
  return streak;
}

export default Dashboard;
