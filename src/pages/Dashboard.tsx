import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import {
  Compass, LogOut, Target, TrendingUp, Flame, Calendar,
  CheckCircle, AlertTriangle, ArrowRight, BarChart3, Clock
} from "lucide-react";
import { format, differenceInDays } from "date-fns";

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

  // Calculate stats
  const streak = calculateStreak(checkIns);
  const avgMood = checkIns.length > 0
    ? (checkIns.reduce((acc, c) => acc + (c.mood_score ?? 0), 0) / checkIns.filter(c => c.mood_score).length).toFixed(1)
    : "—";
  const avgEnergy = checkIns.length > 0
    ? (checkIns.reduce((acc, c) => acc + (c.energy_score ?? 0), 0) / checkIns.filter(c => c.energy_score).length).toFixed(1)
    : "—";
  const driftCount = checkIns.filter(c => c.drift_detected).length;
  const recentCommitments = checkIns[0]?.commitments ?? [];

  return (
    <div className="min-h-screen bg-background">
      {/* Nav */}
      <nav className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto flex items-center justify-between h-14 px-4">
          <div className="flex items-center gap-2">
            <div className="bg-gradient-primary rounded-lg p-1.5">
              <Compass className="h-4 w-4 text-primary-foreground" />
            </div>
            <span className="font-heading text-lg font-bold text-foreground">Northstar OS</span>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={() => navigate("/audit")}>Audit</Button>
            <Button variant="ghost" size="sm" onClick={() => navigate("/check-in")}>Check-in</Button>
            <Button variant="ghost" size="icon" onClick={signOut}><LogOut className="h-4 w-4" /></Button>
          </div>
        </div>
      </nav>

      <div className="container mx-auto px-4 py-8 max-w-5xl">
        {/* Greeting */}
        <div className="mb-8">
          <h1 className="font-heading text-2xl font-bold text-foreground">
            Welcome back{profile?.display_name ? `, ${profile.display_name}` : ""}
          </h1>
          <p className="text-muted-foreground">Here's your operating snapshot.</p>
        </div>

        {/* Quick action banner */}
        {!auditCompleted && (
          <div className="bg-gradient-subtle rounded-2xl p-6 border border-primary/20 mb-8 flex items-center justify-between">
            <div>
              <h3 className="font-heading font-bold text-foreground">Complete your Baseline Audit</h3>
              <p className="text-sm text-muted-foreground">Get your strategic report and 90-day plan</p>
            </div>
            <Button variant="hero" onClick={() => navigate("/audit")}>
              Start audit <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        )}

        {/* Stats grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <StatCard icon={<Flame className="h-5 w-5 text-accent" />} label="Streak" value={`${streak} days`} />
          <StatCard icon={<TrendingUp className="h-5 w-5 text-primary" />} label="Avg Mood" value={avgMood} />
          <StatCard icon={<BarChart3 className="h-5 w-5 text-primary" />} label="Avg Energy" value={avgEnergy} />
          <StatCard icon={<AlertTriangle className="h-5 w-5 text-accent" />} label="Drift alerts" value={String(driftCount)} />
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Recent commitments */}
          <div className="bg-card rounded-2xl border border-border p-6">
            <h3 className="font-heading font-bold text-foreground mb-4 flex items-center gap-2">
              <Target className="h-5 w-5 text-primary" /> Current Commitments
            </h3>
            {recentCommitments.length > 0 ? (
              <ul className="space-y-2">
                {recentCommitments.map((c, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm">
                    <CheckCircle className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                    <span className="text-foreground">{c}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground">No commitments yet. Complete a check-in to set them.</p>
            )}
          </div>

          {/* Recent check-ins */}
          <div className="bg-card rounded-2xl border border-border p-6">
            <h3 className="font-heading font-bold text-foreground mb-4 flex items-center gap-2">
              <Clock className="h-5 w-5 text-primary" /> Recent Check-ins
            </h3>
            {checkIns.length > 0 ? (
              <ul className="space-y-3">
                {checkIns.slice(0, 5).map((c) => (
                  <li key={c.id} className="flex items-center justify-between text-sm border-b border-border pb-2 last:border-0">
                    <span className="text-muted-foreground">{format(new Date(c.created_at), "MMM d, h:mm a")}</span>
                    <div className="flex items-center gap-3">
                      <span className="text-foreground">Mood: {c.mood_score ?? "—"}</span>
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

        {/* CTA */}
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
