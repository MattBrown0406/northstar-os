const trustItems = [
  {
    title: "Built for operating reality",
    description:
      "Intentus is designed around scoreboards, commitments, drift, blind spots, and quarterly focus, not generic motivation prompts.",
  },
  {
    title: "Private by design",
    description:
      "Leaders can reflect on pressure points, weak spots, and execution misses in a system meant for honest internal use, not public performance.",
  },
  {
    title: "Useful for solo leaders or coach-led programs",
    description:
      "Founders can run their own rhythm, and coaches can extend that same structure across client accountability engagements.",
  },
];

const TrustSection = () => {
  return (
    <section className="bg-background py-24">
      <div className="container mx-auto px-4">
        <div className="mx-auto max-w-5xl rounded-3xl border border-border/60 bg-card p-8 shadow-medium md:p-12">
          <div className="grid gap-8 md:grid-cols-[0.9fr_1.1fr]">
            <div>
              <p className="mb-3 text-sm font-semibold uppercase tracking-[0.18em] text-primary">Trust and privacy</p>
              <h2 className="font-heading text-3xl font-bold text-foreground md:text-4xl">
                Accountability software should feel credible before it asks for honesty
              </h2>
              <p className="mt-4 leading-relaxed text-muted-foreground">
                The pitch is simple: tell the truth about how you are operating, get a plan that matches reality, and keep the feedback loop tight enough to matter.
              </p>
            </div>
            <div className="grid gap-4">
              {trustItems.map((item) => (
                <div key={item.title} className="rounded-2xl border border-border/50 bg-muted/40 p-5">
                  <h3 className="font-heading text-lg font-bold text-foreground">{item.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{item.description}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default TrustSection;
