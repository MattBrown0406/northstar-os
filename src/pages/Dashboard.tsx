import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import MoodEnergyChart from "@/components/dashboard/MoodEnergyChart";
import DriftTracker from "@/components/dashboard/DriftTracker";
import { useAdminCheck } from "@/hooks/useAdminCheck";
import {
  LogOut, Target, TrendingUp, Flame,
  CheckCircle, AlertTriangle, ArrowRight, BarChart3, Clock,
  FileText, Users, MessageSquare, Sparkles, Lock, Settings, Shield, Circle,
  RefreshCw,
} from "lucide-react";
import { format, differenceInDays } from "date-fns";
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { formatLensLabel, type IntentModel, type IntentProfile } from "@/lib/intentus-architecture";
import { getCurrentWeekCommitment, getPreviousWeekCommitment, setWeeklyCommitment, type WeeklyCommitment } from "@/lib/commitments";
import { canReaudit } from "@/lib/reaudit";

interface Profile {
  display_name: string | null;
  coaching_tone: string | null;
  check_in_cadence: string | null;
  intent_profile?: IntentProfile | null;
  plan_tier: string | null;
  onboarding_completed: boolean | null;
}

interface StrategicReportSummary {
  intent_model?: IntentModel | null;
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
  const { isAdmin } = useAdminCheck();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [checkIns, setCheckIns] = useState<CheckIn[]>([]);
  const [auditCompleted, setAuditCompleted] = useState(false);
  const [reportSummary, setReportSummary] = useState<StrategicReportSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentCommitment, setCurrentCommitment] = useState<WeeklyCommitment | null>(null);
  const [lastCommitment, setLastCommitment] = useState<WeeklyCommitment | null>(null);
  const [showOneThingModal, setShowOneThingModal] = useState(false);
  const [oneThingInput, setOneThingInput] = useState("");
  const [oneThingSaving, setOneThingSaving] = useState(false);
  const [reauditEligible, setReauditEligible] = useState(false);
  const [reauditNextDate, setReauditNextDate] = useState<Date | undefined>();

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      const [profileRes, checkInsRes, auditRes, reportRes] = await Promise.all([
        supabase.from("profiles").select("*").eq("user_id", user.id).single(),
        supabase.from("check_ins").select("*").eq("user_id", user.id).order("created_at", { ascending: false }).limit(30),
        supabase.from("baseline_audits").select("status").eq("user_id", user.id).eq("status", "completed").limit(1),
        supabase.from("strategic_reports").select("intent_model").eq("user_id", user.id).order("created_at", { ascending: false }).limit(1),
      ]);
      if (profileRes.data) setProfile(profileRes.data as any);
      if (checkInsRes.data) setCheckIns(checkInsRes.data as any);
      setAuditCompleted((auditRes.data?.length ?? 0) > 0);
      if (reportRes.data?.[0]) setReportSummary(reportRes.data[0] as unknown as StrategicReportSummary);
      setLoading(false);
    };
    load();

    // Load commitment data
    const loadCommitments = async () => {
      if (!user) return;
      const [curr, prev] = await Promise.all([
        getCurrentWeekCommitment(user.id),
        getPreviousWeekCommitment(user.id),
      ]);
      setCurrentCommitment(curr);
      setLastCommitment(prev);
    };
    loadCommitments();

    // Load re-audit eligibility (Premium/Coach only)
    const loadReaudit = async () => {
      if (!user) return;
      const { data: prof } = await supabase
        .from("profiles")
        .select("plan_tier")
        .eq("user_id", user.id)
        .single();
      const tier = prof?.plan_tier ?? "free";
      if (tier === "premium" || tier === "coach") {
        const result = await canReaudit(user.id);
        setReauditEligible(result.eligible);
        setReauditNextDate(result.nextEligibleDate);
      }
    };
    loadReaudit();
  }, [user]);

  const handleSaveOneThing = async () => {
    if (!user || !oneThingInput.trim()) return;
    setOneThingSaving(true);
    try {
      const saved = await setWeeklyCommitment(user.id, oneThingInput.trim());
      setCurrentCommitment(saved);
      setShowOneThingModal(false);
      setOneThingInput("");
    } catch (e) {
      console.error("Error saving one thing:", e);
    }
    setOneThingSaving(false);
  };

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
  const activeLens = reportSummary?.intent_model?.primary_lens || profile?.intent_profile?.primaryLens;

  return (
    <div className="min-h-screen bg-background">
      <nav className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto flex items-center justify-between h-14 px-4">
          <div className="flex items-center">
            <span className="font-heading text-xl font-extrabold tracking-tight text-foreground uppercase">Intentus</span>
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
            <Button variant="ghost" size="sm" onClick={() => navigate("/settings")}>
              <Settings className="h-4 w-4 mr-1" /> Settings
            </Button>
            {isAdmin && (
              <Button variant="ghost" size="sm" onClick={() => navigate("/admin")}>
                <Shield className="h-4 w-4 mr-1" /> Admin
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
          <p className="text-muted-foreground">Here's your operating snapshot — current rhythm, current signal, current priority.</p>
          {activeLens && (
            <div className="mt-3 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-xs font-medium text-primary">
              <Sparkles className="h-3.5 w-3.5" /> Active coaching lens: {formatLensLabel(activeLens)}
            </div>
          )}
        </div>

        <div className="mb-8">
          <Button variant="hero" size="lg" onClick={() => navigate("/check-in")}>
            Start check-in <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>

        {!auditCompleted ? (
          <div className="bg-gradient-subtle rounded-2xl p-6 border border-primary/20 mb-8 flex items-center justify-between gap-4">
            <div>
              <h3 className="font-heading font-bold text-foreground">Complete your Operating Audit</h3>
              <p className="text-sm text-muted-foreground">Get clarity on your strengths, weaknesses, blind spots, and the 90-day plan worth agreeing to</p>
            </div>
            <Button variant="hero" onClick={() => navigate("/audit")}>
              Start audit <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        ) : (
          <div className="bg-gradient-subtle rounded-2xl p-6 border border-primary/20 mb-8 flex items-center justify-between gap-4">
            <div>
              <h3 className="font-heading font-bold text-foreground">Your Operating Report is ready</h3>
              <p className="text-sm text-muted-foreground">Review your patterns, blind spots, forced choice, and 90-day operating plan</p>
              {(planTier === "premium" || planTier === "coach") && (
                <button
                  className="mt-2 flex items-center gap-1.5 text-xs text-primary hover:underline"
                  onClick={() => navigate("/report")}
                >
                  <RefreshCw className="h-3 w-3" />
                  {reauditEligible
                    ? "Re-audit available"
                    : reauditNextDate
                    ? `Re-audit available ${format(reauditNextDate, "MMM d")}`
                    : null}
                </button>
              )}
            </div>
            <Button variant="hero" onClick={() => navigate("/report")}>
              View report <FileText className="ml-2 h-4 w-4" />
            </Button>
          </div>
        )}

        {/* This Week Section */}
        <div className="bg-card rounded-2xl border border-border p-5 mb-8">
          <h3 className="font-heading font-bold text-foreground mb-3 flex items-center gap-2">
            <Target className="h-5 w-5 text-primary" /> This Week
          </h3>
          {currentCommitment ? (
            <div className="space-y-2">
              <p className="text-sm text-foreground leading-relaxed">
                <span className="text-muted-foreground mr-1">"</span>
                {currentCommitment.commitment}
                <span className="text-muted-foreground ml-1">"</span>
              </p>
              {lastCommitment?.outcome && (
                <div className="flex items-center gap-1.5 mt-1">
                  <Circle
                    className={`h-2.5 w-2.5 fill-current ${
                      lastCommitment.outcome === "yes"
                        ? "text-green-500"
                        : lastCommitment.outcome === "partially"
                        ? "text-yellow-500"
                        : "text-destructive"
                    }`}
                  />
                  <span className="text-xs text-muted-foreground">
                    Last week:{" "}
                    {lastCommitment.outcome === "yes"
                      ? "Done"
                      : lastCommitment.outcome === "partially"
                      ? "Partial"
                      : "Missed"}
                  </span>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center justify-between gap-4">
              <p className="text-sm text-muted-foreground">What's your one thing this week?</p>
              <Button variant="outline" size="sm" onClick={() => setShowOneThingModal(true)}>
                Set it
              </Button>
            </div>
          )}
        </div>

        {/* One Thing Modal */}
        {showOneThingModal && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowOneThingModal(false)}>
            <div className="bg-card rounded-2xl border border-border p-6 w-full max-w-md space-y-4" onClick={(e) => e.stopPropagation()}>
              <h3 className="font-heading font-bold text-foreground">What's the one thing this week?</h3>
              <p className="text-sm text-muted-foreground">If you actually did this — and nothing else — it would make the most difference.</p>
              <Input
                value={oneThingInput}
                onChange={(e) => setOneThingInput(e.target.value)}
                placeholder="This week I will..."
                onKeyDown={(e) => e.key === "Enter" && handleSaveOneThing()}
                autoFocus
              />
              <div className="flex gap-3">
                <Button variant="outline" className="flex-1" onClick={() => setShowOneThingModal(false)}>Cancel</Button>
                <Button variant="hero" className="flex-1" onClick={handleSaveOneThing} disabled={oneThingSaving || !oneThingInput.trim()}>
                  {oneThingSaving ? "Saving..." : "Save"}
                </Button>
              </div>
            </div>
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
                      : "Complete a few honest check-ins to unlock a real trendline."}
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
                  Your trend view populates from real check-ins, not filler data. Start one focused check-in and the dashboard will begin plotting your operating rhythm over time.
                </div>
              )}

              <div className="mt-5 grid gap-3 sm:grid-cols-3">
                <TrendCallout label="Trend window" value={tierSummary.windowLabel} tone="primary" />
                <TrendCallout label="Drift flags" value={driftCount ? `${driftCount} detected` : "None flagged"} tone="accent" />
                <TrendCallout label="Cadence" value={profile?.check_in_cadence ? capitalize(profile.check_in_cadence) : "Set during onboarding"} tone="neutral" />
                {activeLens && <TrendCallout label="Adaptive lens" value={formatLensLabel(activeLens)} tone="primary" />}
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
                <p className="text-sm text-muted-foreground">No commitments yet. Complete a check-in to set your next disciplined actions.</p>
              )}
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-card rounded-2xl border border-border p-6">
              <h3 className="font-heading font-bold text-foreground mb-3 flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-primary" /> Tier Access
              </h3>
              <p className="text-sm text-muted-foreground mb-4">Your dashboard mirrors what your current plan actually includes without inventing signal that doesn't exist.</p>
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
                <p className="text-sm text-muted-foreground">No check-ins yet. Start one when you can answer honestly.</p>
              )}
            </div>
          </div>
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
