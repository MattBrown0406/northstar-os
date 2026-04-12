import { ArrowUpRight, BarChart3, CheckCircle2, Target, TrendingUp } from "lucide-react";
import logo from "@/assets/intentus-logo.png";
import { Area, AreaChart, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

const momentumData = [
  { week: "W1", focus: 58, energy: 52 },
  { week: "W2", focus: 60, energy: 55 },
  { week: "W3", focus: 63, energy: 59 },
  { week: "W4", focus: 67, energy: 62 },
  { week: "W5", focus: 71, energy: 66 },
  { week: "W6", focus: 74, energy: 69 },
];

const scorecardData = [
  { label: "Focus", value: 74 },
  { label: "Energy", value: 69 },
  { label: "Execution", value: 81 },
  { label: "Drift", value: 18 },
];

const commitments = [
  "Protect two 90-minute strategy blocks",
  "Close weekly leadership review by Friday",
  "Delegate recurring approval handoffs",
];

const coachingSignals = [
  { label: "Decision clarity", value: "Strong" },
  { label: "Check-in cadence", value: "Weekly" },
  { label: "Primary risk", value: "Reactive calendar creep" },
];

const HeroDashboardMock = () => {
  return (
    <div className="relative px-4 md:px-10 py-6 md:py-10 bg-gradient-to-br from-background via-background to-primary/5">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(34,211,238,0.18),transparent_32%),radial-gradient(circle_at_left,rgba(20,184,166,0.16),transparent_28%)]" />

      <div className="relative mx-auto max-w-6xl">
        <div className="relative rounded-[28px] border border-white/50 bg-background/90 shadow-[0_30px_120px_rgba(15,23,42,0.14)] backdrop-blur-xl">
          <div className="flex items-center justify-between border-b border-border/70 px-5 py-4 md:px-6">
            <div className="flex items-center gap-3">
              <img src={logo} alt="Intentus" className="h-8 w-auto" />
              <div>
                <p className="text-sm font-semibold text-foreground">Intentus Operating Dashboard</p>
                <p className="text-xs text-muted-foreground">Weekly executive snapshot</p>
              </div>
            </div>
            <div className="hidden md:flex items-center gap-2 rounded-full border border-primary/15 bg-primary/5 px-3 py-1 text-xs font-medium text-primary">
              <TrendingUp className="h-3.5 w-3.5" /> Momentum is improving
            </div>
          </div>

          <div className="grid gap-4 p-4 md:grid-cols-[1.6fr_0.95fr] md:p-6">
            <div className="space-y-4">
              <div className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
                <div className="rounded-2xl border border-border/70 bg-card/90 p-4">
                  <div className="mb-4 flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-foreground">Momentum trend</p>
                      <p className="text-xs text-muted-foreground">Focus and energy from recent check-ins</p>
                    </div>
                    <div className="rounded-full bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary">Last 6 weeks</div>
                  </div>
                  <div className="h-56">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={momentumData}>
                        <CartesianGrid stroke="hsl(var(--border))" strokeDasharray="3 3" vertical={false} />
                        <XAxis dataKey="week" axisLine={false} tickLine={false} />
                        <YAxis domain={[40, 90]} axisLine={false} tickLine={false} width={28} />
                        <Tooltip
                          cursor={{ stroke: "hsl(var(--border))", strokeDasharray: "4 4" }}
                          contentStyle={{
                            borderRadius: 12,
                            border: "1px solid hsl(var(--border))",
                            background: "hsl(var(--background))",
                          }}
                        />
                        <Line type="monotone" dataKey="focus" stroke="hsl(var(--primary))" strokeWidth={3} dot={{ r: 0 }} activeDot={{ r: 5 }} />
                        <Line type="monotone" dataKey="energy" stroke="hsl(var(--accent))" strokeWidth={3} dot={{ r: 0 }} activeDot={{ r: 5 }} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className="rounded-2xl border border-border/70 bg-card/90 p-4">
                  <div className="mb-4 flex items-center gap-2">
                    <BarChart3 className="h-4 w-4 text-primary" />
                    <p className="text-sm font-semibold text-foreground">Operating scorecard</p>
                  </div>
                  <div className="space-y-4">
                    {scorecardData.map((metric) => (
                      <div key={metric.label} className="space-y-1.5">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-muted-foreground">{metric.label}</span>
                          <span className="font-medium text-foreground">{metric.value}%</span>
                        </div>
                        <div className="h-2 overflow-hidden rounded-full bg-muted">
                          <div
                            className={`h-full rounded-full ${metric.label === "Drift" ? "bg-accent" : "bg-gradient-primary"}`}
                            style={{ width: `${metric.value}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="grid gap-4 lg:grid-cols-[1.05fr_0.95fr]">
                <div className="rounded-2xl border border-border/70 bg-card/90 p-4">
                  <div className="mb-4 flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-foreground">90-day plan</p>
                      <p className="text-xs text-muted-foreground">Three commitments tied to the next operating sprint</p>
                    </div>
                    <Target className="h-4 w-4 text-primary" />
                  </div>
                  <div className="space-y-3">
                    {commitments.map((commitment, index) => (
                      <div key={commitment} className="flex items-start gap-3 rounded-xl border border-border/60 bg-background/70 px-3 py-3">
                        <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                          0{index + 1}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-foreground">{commitment}</p>
                          <p className="text-xs text-muted-foreground">Assigned to this week’s accountability review</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="rounded-2xl border border-border/70 bg-card/90 p-4">
                  <div className="mb-4 flex items-center justify-between">
                    <div>
                      <p className="text-sm font-semibold text-foreground">Coach summary</p>
                      <p className="text-xs text-muted-foreground">Quick-glance context for the next conversation</p>
                    </div>
                    <div className="rounded-full bg-accent/10 px-2.5 py-1 text-xs font-medium text-accent">1 open risk</div>
                  </div>
                  <div className="mb-4 rounded-xl border border-primary/15 bg-primary/5 p-3">
                    <p className="text-xs uppercase tracking-[0.2em] text-primary/80">Current operating focus</p>
                    <p className="mt-1 text-sm font-medium text-foreground">Build an operating rhythm that scales without founder bottlenecks.</p>
                  </div>
                  <div className="space-y-3">
                    {coachingSignals.map((signal) => (
                      <div key={signal.label} className="flex items-center justify-between rounded-xl bg-muted/40 px-3 py-2 text-sm">
                        <span className="text-muted-foreground">{signal.label}</span>
                        <span className="font-medium text-foreground">{signal.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="rounded-2xl border border-primary/15 bg-gradient-to-br from-primary/10 via-background to-background p-4 shadow-sm">
                <div className="mb-4 flex items-center justify-between">
                  <div>
                    <p className="text-xs uppercase tracking-[0.2em] text-primary/80">Weekly review</p>
                    <p className="text-lg font-semibold text-foreground">Execution quality</p>
                  </div>
                  <div className="rounded-full bg-background px-3 py-1 text-sm font-semibold text-primary shadow-sm">81%</div>
                </div>
                <div className="h-36">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={momentumData}>
                      <defs>
                        <linearGradient id="heroArea" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.4} />
                          <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0.05} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid stroke="hsl(var(--border))" strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="week" axisLine={false} tickLine={false} />
                      <Tooltip
                        contentStyle={{
                          borderRadius: 12,
                          border: "1px solid hsl(var(--border))",
                          background: "hsl(var(--background))",
                        }}
                      />
                      <Area type="monotone" dataKey="focus" stroke="hsl(var(--primary))" fill="url(#heroArea)" strokeWidth={2.5} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
                <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
                  <ArrowUpRight className="h-3.5 w-3.5 text-primary" /> Trend reflects steadier follow-through across the current sprint.
                </div>
              </div>

              <div className="rounded-2xl border border-border/70 bg-card/90 p-4">
                <div className="mb-3 flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-primary" />
                  <p className="text-sm font-semibold text-foreground">Next actions</p>
                </div>
                <div className="space-y-2">
                  {[
                    "Finish the operating audit",
                    "Review the strategic report",
                    "Lock next week’s commitments",
                  ].map((item) => (
                    <div key={item} className="flex items-center justify-between rounded-xl border border-border/60 bg-background/80 px-3 py-2.5 text-sm">
                      <span className="text-foreground">{item}</span>
                      <span className="text-xs font-medium text-muted-foreground">Actionable now</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="absolute -left-2 top-20 hidden w-52 rounded-2xl border border-white/60 bg-background/90 p-4 shadow-[0_24px_60px_rgba(15,23,42,0.12)] backdrop-blur-xl lg:block">
          <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Signal</p>
          <p className="mt-2 text-2xl font-bold text-foreground">+12%</p>
          <p className="text-sm text-muted-foreground">Improvement in execution consistency over 30 days</p>
        </div>

        <div className="absolute -right-3 bottom-10 hidden w-56 rounded-2xl border border-white/60 bg-background/90 p-4 shadow-[0_24px_60px_rgba(15,23,42,0.12)] backdrop-blur-xl xl:block">
          <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Coach-ready</p>
          <p className="mt-2 text-sm font-medium text-foreground">Clear trendline. Clean priorities. No placeholder nonsense.</p>
        </div>
      </div>
    </div>
  );
};

export default HeroDashboardMock;
