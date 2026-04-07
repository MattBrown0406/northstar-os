import { Button } from "@/components/ui/button";
import { Check } from "lucide-react";

const plans = [
  {
    name: "Free",
    price: "$0",
    desc: "Explore the system and get initial clarity.",
    features: [
      "Baseline Audit (Lite)",
      "Strategic Report (Lite)",
      "1 check-in per week",
      "Last 10 check-ins stored",
    ],
    cta: "Start Free",
    featured: false,
  },
  {
    name: "Pro",
    price: "$29",
    period: "/mo",
    desc: "Execution becomes automatic.",
    features: [
      "Full Baseline Audit",
      "Full printable Strategic Report",
      "Custom check-in cadence",
      "Unlimited history",
      "Drift + adherence trends",
      "Pattern + obstacle dashboards",
      "Export report + data",
    ],
    cta: "Upgrade to Pro",
    featured: true,
  },
  {
    name: "Premium",
    price: "$99",
    period: "/mo",
    desc: "A stricter mirror and faster course correction.",
    features: [
      "Everything in Pro",
      "Mirror Mode (harder call-outs)",
      "Quarterly Re-Audit",
      "Plan Refresh (AI-updated plan)",
    ],
    cta: "Upgrade to Premium",
    featured: false,
  },
  {
    name: "Coach",
    price: "$399",
    period: "/mo",
    desc: "Professional coaches — manage unlimited clients.",
    features: [
      "Everything in Premium",
      "Unlimited client accounts",
      "Assign clients to any tier",
      "View client audits & reports",
      "Edit client 90-day plans",
      "Track client check-in progress",
      "Shareable invite links",
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
            Pick the level of accountability you want
          </h2>
          <p className="text-lg text-muted-foreground">
            Free gets you clarity. Pro gets you consistency. Premium gets you correction under pressure.
          </p>
        </div>
        <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
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
