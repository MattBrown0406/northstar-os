const steps = [
  { number: "01", title: "Arrive", desc: "Start only when you can answer thoughtfully, without multitasking or rushing.", color: "bg-primary/10 text-primary" },
  { number: "02", title: "Audit", desc: "Complete a clear-eyed operating audit that favors truth over polished self-description.", color: "bg-accent/10 text-accent" },
  { number: "03", title: "Expose", desc: "Intentus identifies strengths briefly, weaknesses clearly, and blind spots without flinching.", color: "bg-primary/10 text-primary" },
  { number: "04", title: "Commit", desc: "Agree to a prioritized 90-day plan built around decision clarity and disciplined action.", color: "bg-accent/10 text-accent" },
  { number: "05", title: "Correct", desc: "Use check-ins to catch drift, vague language, rationalization, and softened priorities early.", color: "bg-primary/10 text-primary" },
];

const HowItWorksSection = () => {
  return (
    <section id="how-it-works" className="py-24 bg-background">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="font-heading text-3xl md:text-4xl font-bold text-foreground mb-4">
            How Intentus works
          </h2>
          <p className="text-lg text-muted-foreground">
            From honest assessment to drift correction in five steps.
          </p>
        </div>
        <div className="max-w-3xl mx-auto space-y-0">
          {steps.map((step, i) => (
            <div key={i} className="flex items-start gap-6 group">
              <div className="flex flex-col items-center">
                <div className={`w-12 h-12 rounded-full ${step.color} flex items-center justify-center font-heading font-bold text-sm`}>
                  {step.number}
                </div>
                {i < steps.length - 1 && <div className="w-px h-16 bg-border" />}
              </div>
              <div className="pt-2.5 pb-8">
                <h3 className="font-heading text-lg font-bold text-foreground mb-1">{step.title}</h3>
                <p className="text-muted-foreground">{step.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HowItWorksSection;
