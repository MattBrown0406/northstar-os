import { ClipboardCheck, FileText, MessageCircle } from "lucide-react";

const pillars = [
  {
    icon: ClipboardCheck,
    title: "Operating Audit",
    subtitle: "Reality, patterns, decision clarity",
    description: "A guided assessment that digs into recent performance, key business numbers, decision quality, relationships, and operating systems. It is built to surface signal, not flattering narratives.",
  },
  {
    icon: FileText,
    title: "90-Day Operating Plan",
    subtitle: "Honest, prioritized, usable",
    description: "Get a practical report with strengths, weaknesses, blind spots, contradictions, a forced choice, a current priority, and a 90-day plan you can actually run.",
  },
  {
    icon: MessageCircle,
    title: "Accountability Check-ins",
    subtitle: "Daily or weekly drift correction",
    description: "Intentus uses check-ins to catch drift versus adherence, thin self-reporting, vague language, and rationalization before another week disappears.",
  },
];

const PillarsSection = () => {
  return (
    <section id="features" className="py-24 bg-gradient-subtle">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <div className="mx-auto mb-4 h-px w-16 bg-gradient-gold rounded-full" />
          <h2 className="font-heading text-3xl md:text-4xl font-bold text-foreground mb-4">
            Audit. Align. Execute.
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            One platform for seeing where you stand, deciding what matters now, and staying disciplined long enough for results to compound.
          </p>
        </div>
        <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
          {pillars.map((pillar, i) => (
            <div key={i} className="group p-8 rounded-2xl bg-card shadow-soft border border-border/50 hover:shadow-glow transition-all duration-300 hover:-translate-y-1">
              <div className="inline-flex p-3 rounded-xl bg-gradient-primary mb-6">
                <pillar.icon className="h-6 w-6 text-primary-foreground" />
              </div>
              <h3 className="font-heading text-xl font-bold text-foreground mb-1">{pillar.title}</h3>
              <p className="text-sm text-primary font-medium mb-3">{pillar.subtitle}</p>
              <p className="text-muted-foreground leading-relaxed">{pillar.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default PillarsSection;
