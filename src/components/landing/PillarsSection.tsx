import { ClipboardCheck, FileText, MessageCircle } from "lucide-react";

const pillars = [
  {
    icon: ClipboardCheck,
    title: "Baseline Audit",
    subtitle: "High-truth, one question at a time",
    description: "A guided interview that forces specifics: last 7–30 days, numbers, time, money, decisions. If you give the polished version, it calls it out.",
  },
  {
    icon: FileText,
    title: "Strategic Report",
    subtitle: "Printable & actionable",
    description: "Uncomfortable truth, trajectory, contradictions, pattern engine, forced choice, and a 90-day execution plan you can actually use.",
  },
  {
    icon: MessageCircle,
    title: "Coaching Check-ins",
    subtitle: "Stay aligned, catch drift early",
    description: "Pick your cadence. Each check-in references your baseline + plan + history to tighten commitments and keep the next 24 hours obvious.",
  },
];

const PillarsSection = () => {
  return (
    <section id="features" className="py-24 bg-gradient-subtle">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="font-heading text-3xl md:text-4xl font-bold text-foreground mb-4">
            Three pillars. One operating system.
          </h2>
          <p className="text-lg text-muted-foreground max-w-xl mx-auto">
            Less reflection. More traction. Turn insight into a 90-day plan—and stay on it.
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
