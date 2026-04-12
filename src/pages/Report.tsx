import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import {
  ArrowLeft, Printer, Target, AlertTriangle,
  Crosshair, Calendar, TrendingUp, Eye, Zap, CheckCircle, Layers, BrainCircuit,
  RefreshCw, ChevronDown, ChevronUp, Clock,
} from "lucide-react";
import { brandLogo as logo } from "@/lib/brand";
import { formatLensLabel, type IntentModel } from "@/lib/intentus-architecture";
import { canReaudit, archiveAndResetAudit, getAuditHistory, type AuditHistoryEntry } from "@/lib/reaudit";
import { format } from "date-fns";

interface PatternAnalysis {
  themes: { title: string; description: string; areas_affected: string[] }[];
  strengths: string[];
  blind_spots: string[];
}

interface Contradiction {
  stated: string;
  actual: string;
  impact: string;
}

interface Phase {
  title: string;
  actions: string[];
}

interface NinetyDayPlan {
  phase_1: Phase;
  phase_2: Phase;
  phase_3: Phase;
}

interface StrategicReport {
  id: string;
  created_at: string;
  pattern_analysis: PatternAnalysis;
  contradictions: Contradiction[];
  forced_choice: string;
  north_star_focus: string;
  ninety_day_plan: NinetyDayPlan;
  intent_model?: IntentModel | null;
}

const Report = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  const [report, setReport] = useState<StrategicReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);

  // Re-audit state
  const [planTier, setPlanTier] = useState<string>("free");
  const [reauditEligible, setReauditEligible] = useState(false);
  const [reauditReason, setReauditReason] = useState<string | undefined>();
  const [nextEligibleDate, setNextEligibleDate] = useState<Date | undefined>();
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [reauditInProgress, setReauditInProgress] = useState(false);
  const [auditHistory, setAuditHistory] = useState<AuditHistoryEntry[]>([]);
  const [historyExpanded, setHistoryExpanded] = useState(false);
  const [expandedEntry, setExpandedEntry] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    const loadReport = async () => {
      const reportId = searchParams.get("id");

      if (reportId) {
        const { data } = await supabase
          .from("strategic_reports")
          .select("*")
          .eq("id", reportId)
          .eq("user_id", user.id)
          .single();
        if (data) setReport(data as unknown as StrategicReport);
        setLoading(false);
        return;
      }

      // Load latest report
      const { data } = await supabase
        .from("strategic_reports")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(1);

      if (data && data.length > 0) {
        setReport(data[0] as unknown as StrategicReport);
        setLoading(false);
        return;
      }

      // No report exists — try to generate one
      const { data: audit } = await supabase
        .from("baseline_audits")
        .select("id")
        .eq("user_id", user.id)
        .eq("status", "completed")
        .order("created_at", { ascending: false })
        .limit(1);

      if (audit && audit.length > 0) {
        setGenerating(true);
        setLoading(false);
        try {
          const { data: fnData, error: fnError } = await supabase.functions.invoke("generate-report", {
            body: { audit_id: audit[0].id },
          });
          if (fnError) throw fnError;

          // Reload report
          const { data: newReport } = await supabase
            .from("strategic_reports")
            .select("*")
            .eq("id", fnData.report_id)
            .single();
          if (newReport) setReport(newReport as unknown as StrategicReport);
        } catch (e: unknown) {
          const err = e as { message?: string };
          toast({ title: "Error generating report", description: err.message, variant: "destructive" });
        } finally {
          setGenerating(false);
        }
      } else {
        setLoading(false);
      }
    };
    loadReport();
  }, [user]);

  // Load re-audit eligibility and history after report is available
  useEffect(() => {
    if (!user) return;
    const loadReauditData = async () => {
      // Load plan tier
      const { data: profileData } = await supabase
        .from("profiles")
        .select("plan_tier")
        .eq("user_id", user.id)
        .single();
      const tier = profileData?.plan_tier ?? "free";
      setPlanTier(tier);

      if (tier === "premium" || tier === "coach") {
        const result = await canReaudit(user.id);
        setReauditEligible(result.eligible);
        setReauditReason(result.reason);
        setNextEligibleDate(result.nextEligibleDate);

        const history = await getAuditHistory(user.id);
        setAuditHistory(history);
      }
    };
    loadReauditData();
  }, [user]);

  const handleConfirmReaudit = async () => {
    if (!user) return;
    setReauditInProgress(true);
    try {
      await archiveAndResetAudit(user.id);
      toast({ title: "Audit archived", description: "Starting your new operating audit." });
      navigate("/audit");
    } catch (e: unknown) {
      const err = e as { message?: string };
      toast({ title: "Re-audit failed", description: err.message ?? "Something went wrong.", variant: "destructive" });
    } finally {
      setReauditInProgress(false);
      setShowConfirmModal(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (generating) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary mx-auto" />
          <h2 className="font-heading text-xl font-bold text-foreground">Generating your Operating Report…</h2>
          <p className="text-muted-foreground text-sm max-w-md">Intentus is analyzing your audit responses for strengths, weaknesses, blind spots, contradictions, and your next 90-day operating plan. This may take 30–60 seconds.</p>
        </div>
      </div>
    );
  }

  if (!report) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <h2 className="font-heading text-xl font-bold text-foreground">No report yet</h2>
          <p className="text-muted-foreground">Complete your operating audit first to generate your report.</p>
          <Button variant="hero" onClick={() => navigate("/audit")}>Start Audit</Button>
        </div>
      </div>
    );
  }

  const { pattern_analysis, contradictions, forced_choice, north_star_focus, ninety_day_plan, intent_model } = report;
  const isPremiumTier = planTier === "premium" || planTier === "coach";

  return (
    <div className="min-h-screen bg-background">
      {/* Nav - hidden in print */}
      <nav className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-10 print:hidden">
        <div className="container mx-auto flex items-center justify-between h-14 px-4">
          <div className="flex items-center gap-2">
            <img src={logo} alt="Intentus" className="h-7 w-auto" />
            <span className="font-heading text-lg font-bold text-foreground">Operating Report</span>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={() => navigate("/dashboard")}>
              <ArrowLeft className="h-4 w-4 mr-1" /> Dashboard
            </Button>
            <Button variant="outline" size="sm" onClick={() => window.print()}>
              <Printer className="h-4 w-4 mr-1" /> Print / PDF
            </Button>
          </div>
        </div>
      </nav>

      <div className="container mx-auto px-4 py-8 max-w-3xl print:max-w-none print:py-0">
        {/* Print header */}
        <div className="hidden print:block mb-8 pt-4">
          <div className="flex items-center gap-2 mb-2">
            <img src={logo} alt="Intentus" className="h-8 w-auto print:h-8" />
            <span className="font-heading text-2xl font-bold">Operating Report</span>
          </div>
          <p className="text-sm text-muted-foreground">Generated {new Date(report.created_at).toLocaleDateString()}</p>
        </div>

        {/* Strategic Focus */}
        <section className="mb-8">
          <div className="bg-gradient-subtle rounded-2xl p-8 border border-primary/20 text-center print:border print:border-foreground/20">
            <Crosshair className="h-8 w-8 text-accent mx-auto mb-3" />
            <h2 className="font-heading text-sm font-semibold text-primary uppercase tracking-wider mb-2">Your Current Priority</h2>
            <p className="font-heading text-2xl font-bold text-foreground leading-relaxed">{north_star_focus}</p>
            <p className="mt-3 text-sm text-muted-foreground">Protect this priority. Drift usually starts when secondary concerns start sounding equally urgent.</p>
          </div>
        </section>

        {intent_model && (
          <section className="mb-8 print:break-inside-avoid">
            <h2 className="font-heading text-xl font-bold text-foreground mb-4 flex items-center gap-2">
              <Layers className="h-5 w-5 text-primary" /> Adaptive Coaching Architecture
            </h2>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="bg-card rounded-xl border border-border p-5">
                <p className="text-xs uppercase tracking-wider text-primary mb-2">Active lenses</p>
                <p className="font-heading text-lg font-bold text-foreground">{formatLensLabel(intent_model.primary_lens)}</p>
                <p className="text-sm text-muted-foreground mt-1">Supported by {formatLensLabel(intent_model.secondary_lens)}</p>
                <p className="text-sm text-foreground mt-4">{intent_model.lens_rationale}</p>
                <p className="text-sm text-muted-foreground mt-4">{intent_model.report_framing}</p>
              </div>
              <div className="bg-card rounded-xl border border-border p-5">
                <p className="text-xs uppercase tracking-wider text-primary mb-2">Coaching posture</p>
                <p className="text-sm text-foreground mb-4">{intent_model.coaching_posture}</p>
                <p className="text-xs uppercase tracking-wider text-primary/80 mb-2">Background threads</p>
                <div className="flex flex-wrap gap-2">
                  {intent_model.background_threads?.map((thread) => (
                    <span key={thread} className="rounded-full bg-primary/10 px-2.5 py-1 text-xs text-primary">{thread}</span>
                  ))}
                </div>
              </div>
            </div>
            <div className="mt-4 bg-card rounded-xl border border-border p-5">
              <h3 className="font-heading font-semibold text-foreground mb-3 flex items-center gap-2">
                <BrainCircuit className="h-4 w-4 text-accent" /> Core anchor emphasis
              </h3>
              <div className="grid gap-3 md:grid-cols-2">
                {intent_model.anchor_emphasis?.map((anchor) => (
                  <div key={anchor.name} className="rounded-xl border border-border/70 bg-background/70 p-4">
                    <p className="font-medium text-foreground">{anchor.name}</p>
                    <p className="text-sm text-muted-foreground mt-1">{anchor.reason}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Pattern Analysis */}
        <section className="mb-8 print:break-inside-avoid">
          <h2 className="font-heading text-xl font-bold text-foreground mb-4 flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary" /> Pattern Analysis
          </h2>

          {/* Themes */}
          <div className="space-y-4 mb-6">
            {pattern_analysis.themes.map((theme, i) => (
              <div key={i} className="bg-card rounded-xl border border-border p-5 print:break-inside-avoid">
                <h3 className="font-heading font-bold text-foreground mb-1">{theme.title}</h3>
                <p className="text-sm text-muted-foreground mb-2">{theme.description}</p>
                <div className="flex flex-wrap gap-1">
                  {theme.areas_affected.map((area) => (
                    <span key={area} className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary">{area}</span>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Strengths & Blind Spots */}
          <div className="grid md:grid-cols-2 gap-4">
            <div className="bg-card rounded-xl border border-border p-5">
              <h3 className="font-heading font-semibold text-foreground mb-3 flex items-center gap-2">
                <Zap className="h-4 w-4 text-accent" /> Strengths
              </h3>
              <ul className="space-y-2">
                {pattern_analysis.strengths.map((s, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm">
                    <CheckCircle className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                    <span className="text-foreground">{s}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="bg-card rounded-xl border border-border p-5">
              <h3 className="font-heading font-semibold text-foreground mb-3 flex items-center gap-2">
                <Eye className="h-4 w-4 text-accent" /> Blind Spots
              </h3>
              <ul className="space-y-2">
                {pattern_analysis.blind_spots.map((b, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm">
                    <AlertTriangle className="h-4 w-4 text-accent mt-0.5 shrink-0" />
                    <span className="text-foreground">{b}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        {/* Contradictions */}
        <section className="mb-8 print:break-inside-avoid">
          <h2 className="font-heading text-xl font-bold text-foreground mb-4 flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-accent" /> Contradictions
          </h2>
          <div className="space-y-4">
            {contradictions.map((c, i) => (
              <div key={i} className="bg-card rounded-xl border border-border p-5 print:break-inside-avoid">
                <div className="grid md:grid-cols-2 gap-4 mb-3">
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">What you say</p>
                    <p className="text-sm text-foreground font-medium">"{c.stated}"</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">What you do</p>
                    <p className="text-sm text-foreground font-medium">"{c.actual}"</p>
                  </div>
                </div>
                <p className="text-sm text-accent font-medium">Impact: {c.impact}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Forced Choice */}
        <section className="mb-8 print:break-inside-avoid">
          <h2 className="font-heading text-xl font-bold text-foreground mb-4 flex items-center gap-2">
            <Crosshair className="h-5 w-5 text-primary" /> The Forced Choice
          </h2>
          <div className="bg-gradient-subtle rounded-2xl p-6 border border-primary/20 print:border print:border-foreground/20">
            <p className="text-foreground leading-relaxed">{forced_choice}</p>
            <p className="text-sm text-muted-foreground mt-4">Don't soften this for comfort. Agreement matters because this is the tradeoff your next quarter will actually be built on.</p>
          </div>
        </section>

        {/* 90-Day Plan */}
        <section className="mb-8 print:break-inside-avoid">
          <h2 className="font-heading text-xl font-bold text-foreground mb-4 flex items-center gap-2">
            <Calendar className="h-5 w-5 text-primary" /> 90-Day Plan
          </h2>
          <div className="grid md:grid-cols-3 gap-4">
            {[
              { phase: ninety_day_plan.phase_1, label: "Days 1–30", color: "primary" },
              { phase: ninety_day_plan.phase_2, label: "Days 31–60", color: "primary" },
              { phase: ninety_day_plan.phase_3, label: "Days 61–90", color: "primary" },
            ].map(({ phase, label }) => (
              <div key={label} className="bg-card rounded-xl border border-border p-5 print:break-inside-avoid">
                <p className="text-xs text-primary uppercase tracking-wider font-semibold mb-1">{label}</p>
                <h3 className="font-heading font-bold text-foreground mb-3">{phase.title}</h3>
                <ul className="space-y-2">
                  {phase.actions.map((a, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm">
                      <Target className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                      <span className="text-foreground">{a}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>

        {/* Disclaimer */}
        <section className="mb-8 text-center print:break-inside-avoid">
          <p className="text-xs text-muted-foreground">
            This report is AI-generated coaching guidance, not professional medical, legal, or financial advice.
            Always consult qualified professionals for critical decisions.
          </p>
        </section>

        {/* CTA - hidden in print */}
        <div className="text-center pb-8 print:hidden">
          <Button variant="hero" size="lg" onClick={() => navigate("/dashboard")}>
            Back to Dashboard <ArrowLeft className="ml-2 h-4 w-4" />
          </Button>
        </div>

        {/* ── Re-Audit Section (Premium/Coach only, hidden in print) ── */}
        {isPremiumTier && (
          <div className="print:hidden mb-8 space-y-4">
            {/* Re-audit card */}
            <div className="bg-card rounded-2xl border border-primary/20 p-6">
              <div className="flex items-start gap-4">
                <div className="rounded-xl bg-primary/10 p-3 shrink-0">
                  <RefreshCw className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-heading font-bold text-foreground mb-1">Ready for a fresh look?</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Your operating system evolves. A quarterly re-audit surfaces what's shifted — new blind spots, changed priorities, updated commitments.
                  </p>
                  {reauditEligible ? (
                    <Button
                      variant="hero"
                      size="sm"
                      onClick={() => setShowConfirmModal(true)}
                    >
                      <RefreshCw className="h-4 w-4 mr-1.5" /> Start Re-Audit
                    </Button>
                  ) : (
                    <Button variant="outline" size="sm" disabled>
                      <Clock className="h-4 w-4 mr-1.5" />
                      {nextEligibleDate
                        ? `Available ${format(nextEligibleDate, "MMM d")}`
                        : reauditReason ?? "Not available"}
                    </Button>
                  )}
                </div>
              </div>
            </div>

            {/* Audit history */}
            {auditHistory.length > 0 && (
              <div className="bg-card rounded-2xl border border-border overflow-hidden">
                <button
                  className="w-full flex items-center justify-between px-6 py-4 text-left hover:bg-muted/30 transition-colors"
                  onClick={() => setHistoryExpanded((v) => !v)}
                >
                  <span className="font-heading font-semibold text-foreground text-sm">
                    Past Audits ({auditHistory.length})
                  </span>
                  {historyExpanded ? (
                    <ChevronUp className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <ChevronDown className="h-4 w-4 text-muted-foreground" />
                  )}
                </button>

                {historyExpanded && (
                  <div className="border-t border-border divide-y divide-border">
                    {auditHistory.map((entry) => {
                      const isOpen = expandedEntry === entry.id;
                      const reportSnap = entry.report_data as Record<string, string> | null;
                      return (
                        <div key={entry.id}>
                          <button
                            className="w-full flex items-center justify-between px-6 py-3 text-left hover:bg-muted/20 transition-colors"
                            onClick={() => setExpandedEntry(isOpen ? null : entry.id)}
                          >
                            <span className="text-sm text-foreground">
                              Audit #{entry.audit_number} — completed{" "}
                              {format(new Date(entry.completed_at), "MMM d, yyyy")}
                            </span>
                            {isOpen ? (
                              <ChevronUp className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                            ) : (
                              <ChevronDown className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                            )}
                          </button>

                          {isOpen && reportSnap && (
                            <div className="px-6 pb-4 space-y-3 bg-muted/10">
                              {reportSnap.north_star_focus && (
                                <div>
                                  <p className="text-xs text-primary uppercase tracking-wider mb-1">Priority</p>
                                  <p className="text-sm text-foreground">{reportSnap.north_star_focus}</p>
                                </div>
                              )}
                              {reportSnap.forced_choice && (
                                <div>
                                  <p className="text-xs text-primary uppercase tracking-wider mb-1">Forced choice</p>
                                  <p className="text-sm text-foreground">{reportSnap.forced_choice}</p>
                                </div>
                              )}
                              {!reportSnap.north_star_focus && !reportSnap.forced_choice && (
                                <p className="text-sm text-muted-foreground">No report snapshot available for this audit.</p>
                              )}
                            </div>
                          )}

                          {isOpen && !reportSnap && (
                            <div className="px-6 pb-4 bg-muted/10">
                              <p className="text-sm text-muted-foreground">No report snapshot saved for this audit.</p>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── Confirmation Modal ── */}
      {showConfirmModal && (
        <div
          className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
          onClick={() => !reauditInProgress && setShowConfirmModal(false)}
        >
          <div
            className="bg-card rounded-2xl border border-border p-6 w-full max-w-md space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-accent/10 p-2.5 shrink-0">
                <RefreshCw className="h-5 w-5 text-accent" />
              </div>
              <h3 className="font-heading font-bold text-foreground">Archive this audit and start fresh?</h3>
            </div>
            <p className="text-sm text-muted-foreground">
              Your current audit and report will be saved to your history. You'll begin a new 24-question audit. This cannot be undone.
            </p>
            <div className="flex gap-3 pt-2">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setShowConfirmModal(false)}
                disabled={reauditInProgress}
              >
                Cancel
              </Button>
              <Button
                variant="hero"
                className="flex-1"
                onClick={handleConfirmReaudit}
                disabled={reauditInProgress}
              >
                {reauditInProgress ? (
                  <span className="flex items-center gap-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current" />
                    Archiving…
                  </span>
                ) : (
                  "Yes, start re-audit"
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Report;
