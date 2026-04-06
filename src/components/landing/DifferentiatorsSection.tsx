import { Filter, Shield, RotateCcw, Target } from "lucide-react";

const items = [
  { icon: Target, text: "Tracks your operating system—not just habits" },
  { icon: Filter, text: "Decision filters: what to say yes/no to" },
  { icon: Shield, text: "Constraints that prevent self-sabotage" },
  { icon: RotateCcw, text: "Relapse prevention for old defaults under stress" },
];

const DifferentiatorsSection = () => {
  return (
    <section className="py-24 bg-gradient-subtle">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="font-heading text-3xl md:text-4xl font-bold text-foreground mb-4">
              Why founders choose Northstar
            </h2>
            <p className="text-lg text-muted-foreground">
              Most tools track habits. We track your operating system.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {items.map((item, i) => (
              <div key={i} className="flex items-center gap-4 p-5 rounded-xl bg-card shadow-soft border border-border/50">
                <item.icon className="h-5 w-5 shrink-0 text-primary" />
                <span className="text-foreground font-medium">{item.text}</span>
              </div>
            ))}
          </div>
          <div className="mt-12 text-center">
            <blockquote className="text-xl md:text-2xl font-heading font-semibold text-gradient-primary italic">
              "Strategy isn't your bottleneck. Drift is."
            </blockquote>
          </div>
        </div>
      </div>
    </section>
  );
};

export default DifferentiatorsSection;
