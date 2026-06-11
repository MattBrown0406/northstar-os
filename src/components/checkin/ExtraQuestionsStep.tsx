import { Textarea } from "@/components/ui/textarea";
import type { CoachingQuestion } from "@/lib/coaching-questions";

interface ExtraQuestionsStepProps {
  questions: CoachingQuestion[];
  values: Record<string, string | number>;
  setValue: (id: string, value: string | number) => void;
}

export const ExtraQuestionsStep = ({ questions, values, setValue }: ExtraQuestionsStepProps) => {
  if (questions.length === 0) return null;

  return (
    <div className="w-full max-w-full space-y-6 overflow-hidden">
      <div>
        <h3 className="font-heading text-lg font-bold text-foreground">A few more signals</h3>
        <p className="text-sm text-muted-foreground mt-1.5 leading-relaxed">
          Optional, but the more honest signal you give, the sharper your coaching gets. Skip any that don't apply.
        </p>
      </div>

      <div className="space-y-7">
        {questions.map((q) => (
          <div key={q.id} className="w-full max-w-full space-y-2.5 overflow-hidden">
            <div>
              <label className="font-heading text-base font-semibold text-foreground block">{q.label}</label>
              <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{q.helper}</p>
            </div>

            {q.type === "scale" ? (
              <div className="space-y-2">
                <div className="flex gap-0.5 sm:gap-1 w-full">
                  {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => {
                    const current = typeof values[q.id] === "number" ? (values[q.id] as number) : 0;
                    return (
                      <button
                        key={n}
                        type="button"
                        onClick={() => setValue(q.id, n)}
                        className={`flex-1 min-w-0 h-10 rounded-md sm:rounded-lg border text-xs font-medium transition-all ${
                          n === current
                            ? "bg-primary text-primary-foreground border-primary scale-105 sm:scale-110"
                            : n <= current
                            ? "bg-primary/10 border-primary/30 text-primary"
                            : "border-border text-muted-foreground hover:border-primary/50"
                        }`}
                      >
                        {n}
                      </button>
                    );
                  })}
                </div>
                {q.scaleLabels && (
                  <div className="grid min-w-0 grid-cols-3 gap-1 text-[10px] text-muted-foreground">
                    <span className="min-w-0 break-words text-left">{q.scaleLabels[0]}</span>
                    <span className="min-w-0 break-words text-center">{q.scaleLabels[1]}</span>
                    <span className="min-w-0 break-words text-right">{q.scaleLabels[2]}</span>
                  </div>
                )}
              </div>
            ) : (
              <Textarea
                value={(values[q.id] as string) ?? ""}
                onChange={(e) => setValue(q.id, e.target.value)}
                placeholder={q.placeholder}
                className={`min-w-0 text-sm resize-none ${q.type === "short_text" ? "min-h-[70px]" : "min-h-[100px]"}`}
              />
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
