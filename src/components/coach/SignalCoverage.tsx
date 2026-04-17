import { COACHING_QUESTIONS } from "@/lib/coaching-questions";
import { Compass, Clock } from "lucide-react";

interface SignalCoverageProps {
  checkIns: { created_at: string; extras: Record<string, unknown> | null }[];
}

interface Latest {
  questionId: string;
  label: string;
  type: "scale" | "text" | "short_text";
  value: unknown;
  daysAgo: number;
  isCore: boolean;
}

const daysSince = (iso: string): number => Math.floor((Date.now() - new Date(iso).getTime()) / (1000 * 60 * 60 * 24));

export const SignalCoverage = ({ checkIns }: SignalCoverageProps) => {
  // Build the latest non-empty value per question
  const latestById = new Map<string, Latest>();
  for (const ci of checkIns) {
    const extras = (ci.extras ?? {}) as Record<string, unknown>;
    for (const [key, value] of Object.entries(extras)) {
      if (value === null || value === undefined || value === "") continue;
      if (latestById.has(key)) continue; // checkIns ordered newest first → first hit wins
      const q = COACHING_QUESTIONS.find((qq) => qq.id === key);
      if (!q) continue;
      latestById.set(key, {
        questionId: key,
        label: q.label,
        type: q.type,
        value,
        daysAgo: daysSince(ci.created_at),
        isCore: !!q.core,
      });
    }
  }

  // Build full coverage list including never-answered questions
  const rows: (Latest | { questionId: string; label: string; type: string; isCore: boolean; never: true })[] =
    COACHING_QUESTIONS.map((q) => {
      const hit = latestById.get(q.id);
      if (hit) return hit;
      return { questionId: q.id, label: q.label, type: q.type, isCore: !!q.core, never: true };
    });

  // Core first, then by recency (or never last)
  rows.sort((a, b) => {
    if (a.isCore !== b.isCore) return a.isCore ? -1 : 1;
    const aNever = "never" in a;
    const bNever = "never" in b;
    if (aNever !== bNever) return aNever ? 1 : -1;
    if (!aNever && !bNever) return (a as Latest).daysAgo - (b as Latest).daysAgo;
    return 0;
  });

  const answered = rows.filter((r) => !("never" in r)).length;
  const total = rows.length;

  return (
    <div className="bg-card rounded-2xl border border-border p-5 mb-6">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="font-heading font-bold text-foreground flex items-center gap-2 text-sm">
            <Compass className="h-4 w-4 text-primary" />
            Signal coverage
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5">Freshest answer per coaching question</p>
        </div>
        <span className="text-xs text-muted-foreground">
          {answered}/{total} answered
        </span>
      </div>

      <div className="space-y-2.5">
        {rows.map((row) => {
          const isNever = "never" in row;
          const stale = !isNever && (row as Latest).daysAgo > 14;
          return (
            <div key={row.questionId} className="grid grid-cols-[1fr_auto] gap-3 items-start">
              <div>
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-xs font-medium text-foreground">{row.label}</span>
                  {row.isCore && (
                    <span className="text-[9px] uppercase tracking-wider px-1.5 py-0.5 rounded bg-primary/10 text-primary font-semibold">
                      Core
                    </span>
                  )}
                </div>
                {!isNever && (
                  <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed line-clamp-2">
                    {(row as Latest).type === "scale"
                      ? `${(row as Latest).value}/10`
                      : `"${(row as Latest).value}"`}
                  </p>
                )}
                {isNever && (
                  <p className="text-[11px] text-muted-foreground/70 italic mt-0.5">Not answered yet</p>
                )}
              </div>
              <div className="text-right shrink-0">
                {!isNever ? (
                  <span
                    className={`text-[10px] inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full ${
                      stale
                        ? "bg-accent/10 text-accent"
                        : (row as Latest).daysAgo <= 3
                        ? "bg-primary/10 text-primary"
                        : "bg-muted text-muted-foreground"
                    }`}
                  >
                    <Clock className="h-2.5 w-2.5" />
                    {(row as Latest).daysAgo === 0 ? "Today" : `${(row as Latest).daysAgo}d`}
                  </span>
                ) : (
                  <span className="text-[10px] text-muted-foreground/60">—</span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
