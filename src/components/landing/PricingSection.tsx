import { Link } from "react-router-dom";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";

const plans = [
  {
    name: "Starter",
    price: "$0",
    desc: "Get initial clarity on where you stand and what needs attention.",
    features: [
      "Operating audit (lite)",
      "90-day plan snapshot",
      "1 accountability check-in per week",
      "Recent check-in history",
    ],
    cta: "Start assessment",
    ctaTo: "/auth",
    featured: false,
  },
  {
    name: "Executive",
    price: "$29",
    period: "/mo",
    desc: "For operators who want a tighter execution rhythm around the numbers that matter.",
    features: [
      "Full operating audit",
      "Full strengths, blind spots, and contradictions report",
      "Custom daily or weekly check-ins",
      "Unlimited history",
      "Drift vs adherence tracking",
      "Metric-focused accountability",
      "Exportable report + plan",
    ],
    cta: "Choose Executive",
    ctaTo: "/accountability-software",
    featured: true,
  },
  {
    name: "Coach",
    price: "$99",
    period: "/mo",
    desc: "For coaches who want to run a branded accountability layer for clients.",
    features: [
      "Everything in Executive",
      "Quarterly re-audits",
      "AI plan refreshes",
      "Enhanced drift call-outs",
      "White-label support for coach-led client programs",
    ],
    cta: "Choose Coach",
    ctaTo: "/for-coaches",
    featured: false,
  },
];

const PricingSection = () => {
  return (
    <section id="pricing" className="bg-background py-24">
      <div className="container mx-auto px-4">
        <div className="mb-16 text-center">
          <h2 className="mb-4 font-heading text-3xl font-bold text-foreground md:text-4xl">
            Pricing for the level of accountability you want
          </h2>
          <p className="text-lg text-muted-foreground">
            Start with clarity. Upgrade for consistency. Scale it for yourself or for client accountability programs.
          </p>
        </div>
        <div className="mx-auto grid max-w-5xl grid-cols-1 gap-8 md:grid-cols-3">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`relative rounded-2xl border p-8 transition-all duration-300 hover:-translate-y-1 ${
                plan.featured
                  ? "border-primary/30 bg-card shadow-glow ring-1 ring-primary/20"
                  : "border-border/50 bg-card shadow-soft"
              }`}
            >
              {plan.featured && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-gradient-primary px-4 py-1 text-xs font-semibold text-primary-foreground">
                  Most Popular
                </div>
              )}
              <h3 className="font-heading text-xl font-bold text-foreground">{plan.name}</h3>
              <div className="mb-1 mt-3">
                <span className="font-heading text-4xl font-bold text-foreground">{plan.price}</span>
                {plan.period && <span className="text-muted-foreground">{plan.period}</span>}
              </div>
              <p className="mb-6 text-sm text-muted-foreground">{plan.desc}</p>
              <Button asChild variant={plan.featured ? "hero" : "hero-outline"} className="mb-6 w-full">
                <Link to={plan.ctaTo}>{plan.cta}</Link>
              </Button>
              <ul className="space-y-3">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-start gap-2.5 text-sm text-foreground">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                    {f}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <p className="mt-8 text-center text-sm text-muted-foreground">Cancel anytime.</p>
      </div>
    </section>
  );
};

export default PricingSection;
