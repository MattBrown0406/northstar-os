import { ClipboardCheck, FileText, MessageCircle } from "lucide-react";

const pillars = [
  {
    icon: ClipboardCheck,
    title: "Operating Audit",
    subtitle: "Metrics, habits, pressure points, reality",
    description: "A guided assessment that digs into recent performance, key business numbers, decision quality, relationships, and execution systems. It is designed to surface signal, not flattering narratives.",
  },
  {
    icon: FileText,
    title: "90-Day Operating Plan",
    subtitle: "Honest, specific, usable",
    description: "Get a practical report with strengths, weaknesses, blind spots, contradictions, a priority focus, and a 90-day plan you can actually run with measurable targets.",
  },
  {
    icon: MessageCircle,
    title: "Accountability Check-ins",
    subtitle: "Daily or weekly feedback against your plan",
    description: "Intentus checks for drift versus adherence, tracks progress against your chosen scoreboard metrics, and tightens your next commitments before another week disappears.",
  },
];

const PillarsSection = () => {
  return (
    <section id="features" className="py-24 bg-gradient-subtle">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="font-heading text-3xl md:text-4xl font-bold text-foreground mb-4">
            Audit. Align. Execute.
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            One platform for seeing where you stand, deciding what matters next, and staying accountable long enough for results to compound.
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
