import { AlertTriangle, Brain, Repeat, Zap } from "lucide-react";

const problems = [
  { icon: Brain, text: "Know what matters, but still avoid the highest-leverage decision because clarity would force action" },
  { icon: Repeat, text: "Start with intention, then drift when pressure, comfort, and noise pile up" },
  { icon: AlertTriangle, text: "Track a lot of activity, but lack one honest operating scoreboard" },
  { icon: Zap, text: "Need sharper feedback on strengths, weaknesses, blind spots, and self-protection" },
];

const ProblemSection = () => {
  return (
    <section className="py-24 bg-background">
      <div className="container mx-auto px-4">
        <div className="max-w-3xl mx-auto text-center mb-16">
          <h2 className="font-heading text-3xl md:text-4xl font-bold text-foreground mb-4">
            High performers rarely need more motivation
          </h2>
          <p className="text-lg text-muted-foreground">
            They need a clearer mirror, better operating discipline, and a tighter link between what they say matters and what their calendar, metrics, and habits prove. Intentus is built for leaders who:
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
