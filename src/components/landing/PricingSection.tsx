import { Link } from "react-router-dom";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";

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
      "No ongoing AI coach chat",
    ],
    cta: "Start assessment",
    ctaTo: "/auth",
    featured: false,
  },
  {
    name: "Executive",
    price: "$39.99",
    period: "/mo",
    desc: "For operators who want a tighter execution rhythm around the priorities and numbers that matter.",
    features: [
      "Full operating audit",
      "Full strengths, blind spots, and contradictions report",
      "Custom daily or weekly check-ins",
      "AI check-in debriefs",
      "AI Operating Coach chat",
      "Unlimited history",
      "Drift vs adherence tracking",
      "Decision- and metric-focused accountability",
      "Exportable report + plan",
    ],
    cta: "Choose Executive",
    ctaTo: "/subscribe",
    featured: true,
  },
  {
    name: "Premium",
    price: "$79.99",
    period: "/mo",
    desc: "A stricter mirror and faster drift correction for serious operators.",
    features: [
      "Everything in Executive",
      "Mirror Mode (harder call-outs)",
      "Rotating AI coaching signals",
      "Quarterly re-audits",
      "AI plan refreshes",
    ],
    cta: "Choose Premium",
    ctaTo: "/subscribe",
    featured: false,
  },
  {
    name: "Coach",
    price: "$299.99",
    period: "/mo",
    desc: "For professional coaches running a branded accountability layer for clients.",
    features: [
      "Everything in Premium",
      "Unlimited client accounts",
      "Assign clients to any tier",
      "Client AI behavior follows assigned tier",
      "View client audits & reports",
      "Edit client 90-day plans",
      "Track client check-in progress",
      "White-label support + shareable invite links",
    ],
    cta: "Apply for Coach Access",
    ctaTo: "/subscribe",
    featured: false,
  },
];

const PricingSection = () => {
  return (
    <section id="pricing" className="bg-background py-24">
      <div className="container mx-auto px-4">
        <div className="mb-16 text-center">
          <h2 className="mb-4 font-heading text-3xl font-bold text-foreground md:text-4xl">
            Pricing for the level of structure and accountability you want
          </h2>
          <p className="text-lg text-muted-foreground">
            Start with clarity. Upgrade for disciplined follow-through. Scale it for yourself or for client accountability programs.
          </p>
        </div>
        <div className="mx-auto grid max-w-6xl grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
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
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-2.5 text-sm text-foreground">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                    {feature}
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
