import { useEffect, useId, useRef, useState } from "react";
import { Button } from "@/components/ui/button";

const questions = [
  { title: "What needs your attention today?", options: ["Work", "Relationships", "Personal wellbeing"] },
  { title: "What is getting in the way?", options: ["Too many priorities", "An unclear next step", "Low energy"] },
  { title: "How much time can you make?", options: ["5 minutes", "15 minutes", "30 minutes"] },
];
const actions = [
  "List your priorities, circle one that matters most today, and defer one other task.",
  "Write down your desired outcome and choose the smallest concrete step toward it.",
  "Choose one gentle, manageable task and give yourself permission to stop after your time is up.",
];

/** A fixed-rule preview: all answers remain in component memory only. */
export default function InteractiveSample() {
  const id = useId();
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<(number | null)[]>([null, null, null]);
  const heading = useRef<HTMLHeadingElement>(null);
  const previousStep = useRef(step);
  const complete = step === questions.length;
  useEffect(() => {
    if (previousStep.current !== step) heading.current?.focus();
    previousStep.current = step;
  }, [step]);
  const reset = () => {
    setAnswers([null, null, null]);
    setStep(0);
    heading.current?.focus();
  };

  return (
    <section aria-labelledby={`${id}-title`} className="mx-auto max-w-2xl rounded-2xl border bg-card p-6 text-card-foreground shadow-sm sm:p-8">
      <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-primary">Sample experience</p>
      <h2 id={`${id}-title`} className="text-2xl font-semibold">Try a short reflection</h2>
      <p className="mt-3 text-sm text-muted-foreground">
        Three questions, then a SAMPLE report using fixed rules—not AI analysis or a diagnosis.
        Your answers are not sent or saved and disappear when you leave this page.
      </p>
      <p role="status" className="my-4 text-sm font-medium">{complete ? "Sample complete" : `Question ${step + 1} of 3`}</p>
      <h3 ref={heading} tabIndex={-1} className="mb-4 text-lg font-semibold focus:outline-none">
        {complete ? "Your SAMPLE report" : questions[step].title}
      </h3>
      {complete ? (
        <div className="space-y-5">
          <p className="text-sm text-muted-foreground">An illustrative reflection based only on your selections, not a live assessment.</p>
          <dl className="space-y-3">
            {questions.map((question, index) => (
              <div key={question.title} className="rounded-lg border p-3">
                <dt className="text-sm text-muted-foreground">{question.title}</dt>
                <dd className="mt-1 flex flex-wrap items-center justify-between gap-2">
                  <span>{question.options[answers[index]!]}</span>
                  <Button type="button" variant="ghost" size="sm" onClick={() => setStep(index)} aria-label={`Edit answer ${index + 1}`}>Edit</Button>
                </dd>
              </div>
            ))}
          </dl>
          <div className="rounded-lg bg-muted p-4">
            <h4 className="font-semibold">One practical next action</h4>
            <p className="mt-2">For {questions[0].options[answers[0]!].toLowerCase()}, set aside {questions[2].options[answers[2]!]}. {actions[answers[1]!]}</p>
            <p className="mt-2 text-sm">Afterward, note what helped and what you would change next time.</p>
          </div>
          <p className="text-sm text-muted-foreground">Want to explore Intentus? Create an account. These sample answers will not carry over.</p>
          <Button asChild><a href="/auth?mode=signup">Sign up for Intentus</a></Button>
        </div>
      ) : (
        <form onSubmit={(event) => {
          event.preventDefault();
          if (answers[step] !== null) setStep(step + 1);
        }}>
          <fieldset>
            <legend className="sr-only">{questions[step].title}</legend>
            <div className="space-y-3">
              {questions[step].options.map((option, index) => (
                <label key={`${step}-${option}`} className="flex cursor-pointer items-center gap-3 rounded-lg border p-4 hover:bg-muted">
                  <input type="radio" name={`${id}-question-${step}`} value={index} required checked={answers[step] === index}
                    className="h-4 w-4 accent-primary"
                    onChange={() => setAnswers((current) => current.map((answer, position) => position === step ? index : answer))} />
                  <span>{option}</span>
                </label>
              ))}
            </div>
          </fieldset>
          <div className="mt-5 flex flex-wrap gap-3">
            {step > 0 && <Button type="button" variant="outline" onClick={() => setStep(step - 1)}>Back</Button>}
            <Button type="submit" disabled={answers[step] === null}>{step === 2 ? "See sample report" : "Continue"}</Button>
          </div>
        </form>
      )}
      <Button type="button" variant="link" className="mt-4 px-0" onClick={reset}>Reset sample</Button>
    </section>
  );
}
