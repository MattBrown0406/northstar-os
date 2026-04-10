import MarketingPage from "@/components/marketing/MarketingPage";

const OperatingAudit = () => {
  return (
    <MarketingPage
      title="Operating audit software"
      description="Run an evidence-based operating audit for leadership performance, execution gaps, scoreboards, blind spots, and the next 90-day plan."
      path="/operating-audit"
      eyebrow="Use case page"
      heading="Run an honest operating audit before another quarter disappears into noise"
      intro="Intentus starts with a practical operating audit that looks at metrics, habits, priorities, decision-making, and contradictions. The point is not to flatter you. The point is to give you a useful baseline for the next 90 days."
      bullets={[
        "Targets search intent around operating audits and leadership assessment software.",
        "Explains what the audit covers and why it matters before planning.",
        "Supports trust with practical language instead of vague transformation claims.",
      ]}
      sections={[
        {
          title: "A better baseline than self-esteem surveys",
          body: "The audit is grounded in operating behavior and business reality, including scoreboards, consistency, friction, and where you may be rationalizing weak execution.",
        },
        {
          title: "Find contradictions worth fixing",
          body: "Strong leaders usually know the theory. The harder part is seeing where calendar, behavior, and pressure responses are undermining stated priorities.",
        },
        {
          title: "Turn assessment into action quickly",
          body: "The audit feeds a 90-day operating plan with focus areas, measurable targets, and an accountability cadence designed to stick.",
        },
        {
          title: "Useful for individuals or coach-led cohorts",
          body: "You can use the audit privately as a leader or deploy it at the front of a coaching process to create stronger client alignment.",
        },
      ]}
    />
  );
};

export default OperatingAudit;
