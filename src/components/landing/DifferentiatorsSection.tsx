import { Filter, Shield, RotateCcw, Target } from "lucide-react";

const items = [
  { icon: Target, text: "Tracks the metrics and behaviors that define real leadership performance" },
  { icon: Filter, text: "Turns vague ambition into concrete operating priorities and decision filters" },
  { icon: Shield, text: "Uses recurring check-ins to catch drift before a quarter gets away from you" },
  { icon: RotateCcw, text: "Can be white-labeled by coaches who want a branded client accountability program" },
];

const DifferentiatorsSection = () => {
  return (
    <section className="py-24 bg-gradient-subtle">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="font-heading text-3xl md:text-4xl font-bold text-foreground mb-4">
              Why leaders choose Intentus
            </h2>
            <p className="text-lg text-muted-foreground">
              Most productivity tools track tasks. Intentus coaches the operator behind the outcomes—and can extend that same rhythm to coach-led client programs.
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
              "You do not need more motivation. You need a more honest operating rhythm."
            </blockquote>
          </div>
        </div>
      </div>
    </section>
  );
};

export default DifferentiatorsSection;
