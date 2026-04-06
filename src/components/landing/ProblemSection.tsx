import { AlertTriangle, Brain, Repeat, Zap } from "lucide-react";

const problems = [
  { icon: Brain, text: "Can think clearly, but overthink at the moment of commitment" },
  { icon: Repeat, text: "Start strong, then drift when stress rises" },
  { icon: AlertTriangle, text: "Stay \"busy\" while avoiding the one move that matters" },
  { icon: Zap, text: "Keep upgrading strategy instead of fixing execution" },
];

const ProblemSection = () => {
  return (
    <section className="py-24 bg-background">
      <div className="container mx-auto px-4">
        <div className="max-w-3xl mx-auto text-center mb-16">
          <h2 className="font-heading text-3xl md:text-4xl font-bold text-foreground mb-4">
            You don't have an information problem
          </h2>
          <p className="text-lg text-muted-foreground">
            You have a consistency, focus, and decision-quality problem under pressure. Northstar OS is built for people who:
          </p>
        </div>
        <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-6">
          {problems.map((item, i) => (
            <div key={i} className="flex items-start gap-4 p-6 rounded-xl bg-card shadow-soft border border-border/50 hover:shadow-medium transition-shadow">
              <div className="shrink-0 p-2.5 rounded-lg bg-accent/10">
                <item.icon className="h-5 w-5 text-accent" />
              </div>
              <p className="text-foreground font-medium">{item.text}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default ProblemSection;
