import MarketingPage from "@/components/marketing/MarketingPage";

const ForExecutives = () => {
  return (
    <MarketingPage
      title="For leaders and ambitious operators"
      description="Intentus helps founders, leaders, operators, and anyone with serious growth goals run a sharper operating cadence with an honest audit, a focused 90-day plan, and AI accountability check-ins."
      path="/for-leaders"
      heading="Accountability software for leaders and anyone serious about growth"
      intro="Intentus is built for people carrying real responsibility — for a company, a team, a craft, or their own life — not for collectors of productivity hacks. Start with an honest audit, translate the truth into a concrete 90-day plan, and keep your commitments visible enough to stop drift early."
      sections={[
        {
          title: "See where execution is actually breaking",
          body: "The audit looks at pressure, priorities, metrics, behavior, and contradictions. That gives any serious operator a more honest baseline than task lists or gut feel alone.",
        },
        {
          title: "Choose the few numbers and behaviors that matter",
          body: "Intentus narrows attention to the scoreboards and habits that define the next quarter, so you're not reacting to every fire with equal urgency.",
        },
        {
          title: "Keep commitments alive after the planning session",
          body: "Daily or weekly check-ins create a tighter feedback loop around commitments kept, misses, drift, and next actions.",
        },
        {
          title: "Use it solo or with a coach",
          body: "Some people use Intentus as a private operating discipline tool. Others pair it with a coach, mentor, or accountability partner for stronger follow-through.",
        },
      ]}
    />
  );
};

export default ForExecutives;
