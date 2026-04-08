import { Button } from "@/components/ui/button";
import { Check } from "lucide-react";

const plans = [
  {
    name: "Starter",
    price: "$0",
    desc: "Get initial clarity on how you operate and what needs attention now.",
    features: [
      "Operating audit (lite)",
      "90-day priority snapshot",
      "1 accountability check-in per week",
      "Recent check-in history",
    ],
    cta: "Start assessment",
    featured: false,
  },
  {
    name: "Executive",
    price: "$29",
    period: "/mo",
    desc: "For operators who want a tighter execution rhythm around the priorities and numbers that matter.",
    features: [
      "Full operating audit",
      "Full strengths, blind spots, and contradictions report",
      "Custom daily or weekly check-ins",
      "Unlimited history",
      "Drift vs adherence tracking",
      "Decision- and metric-focused accountability",
      "Exportable report + plan",
    ],
    cta: "Choose Executive",
    featured: true,
  },
  {
    name: "Premium",
    price: "$99",
    period: "/mo",
    desc: "A stricter mirror and faster drift correction for serious operators.",
    features: [
      "Everything in Executive",
      "Mirror Mode (harder call-outs)",
      "Quarterly re-audits",
      "AI plan refreshes",
    ],
    cta: "Choose Premium",
    featured: false,
  },
  {
    name: "Coach",
    price: "$399",
    period: "/mo",
    desc: "For professional coaches running a branded accountability layer for clients.",
    features: [
      "Everything in Premium",
      "Unlimited client accounts",
      "Assign clients to any tier",
      "View client audits & reports",
      "Edit client 90-day plans",
      "Track client check-in progress",
      "White-label support + shareable invite links",
    ],
    cta: "Apply for Coach Access",
    featured: false,
  },
];

const PricingSection = () => {
  return (
    <section id="pricing" className="py-24 bg-background">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="font-heading text-3xl md:text-4xl font-bold text-foreground mb-4">
            Pricing for the level of structure and accountability you want
          </h2>
          <p className="text-lg text-muted-foreground">
            Start with clarity. Upgrade for disciplined follow-through. Scale it for yourself or for client accountability programs.
          </p>
        </div>
        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`relative rounded-2xl p-8 border transition-all duration-300 hover:-translate-y-1 ${
                plan.featured
                  ? "bg-card shadow-glow border-primary/30 ring-1 ring-primary/20"
                  : "bg-card shadow-soft border-border/50"
              }`}
            >
              {plan.featured && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-gradient-primary text-primary-foreground text-xs font-semibold">
                  Most Popular
                </div>
              )}
              <h3 className="font-heading text-xl font-bold text-foreground">{plan.name}</h3>
              <div className="mt-3 mb-1">
                <span className="font-heading text-4xl font-bold text-foreground">{plan.price}</span>
                {plan.period && <span className="text-muted-foreground">{plan.period}</span>}
              </div>
              <p className="text-sm text-muted-foreground mb-6">{plan.desc}</p>
              <Button
                variant={plan.featured ? "hero" : "hero-outline"}
                className="w-full mb-6"
              >
                {plan.cta}
              </Button>
              <ul className="space-y-3">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-start gap-2.5 text-sm text-foreground">
                    <Check className="h-4 w-4 shrink-0 text-primary mt-0.5" />
                    {f}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <p className="text-center text-sm text-muted-foreground mt-8">Cancel anytime.</p>
      </div>
    </section>
  );
};

export default PricingSection;
