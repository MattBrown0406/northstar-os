const steps = [
  { number: "01", title: "Assess", desc: "Complete an evidence-based leadership audit in 20–45 minutes.", color: "bg-primary/10 text-primary" },
  { number: "02", title: "Expose", desc: "Intentus surfaces patterns, contradictions, blind spots, and hidden strengths.", color: "bg-accent/10 text-accent" },
  { number: "03", title: "Prioritize", desc: "Select the metrics and operating priorities that define the next 90 days.", color: "bg-primary/10 text-primary" },
  { number: "04", title: "Check in", desc: "Get daily or weekly coaching on adherence, drift, and recent wins or misses.", color: "bg-accent/10 text-accent" },
  { number: "05", title: "Adjust", desc: "Refine commitments as reality changes without losing the plot.", color: "bg-primary/10 text-primary" },
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
            From honest assessment to disciplined execution in five steps.
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
