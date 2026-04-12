import MarketingPage from "@/components/marketing/MarketingPage";

const ForExecutives = () => {
  return (
    <MarketingPage
      title="For founders and executives"
      description="Intentus helps founders, executives, and operators run a sharper operating cadence with an honest audit, a focused 90-day plan, and AI accountability check-ins."
      path="/for-executives"
      heading="Accountability software for founders, executives, and operators who need a tighter operating rhythm"
      intro="Intentus is built for leaders carrying real responsibility, not people collecting productivity hacks. Start with an operating audit, translate the truth into a concrete 90-day plan, and keep your commitments visible enough to stop drift early."
      sections={[
        {
          title: "See where execution is actually breaking",
          body: "The audit looks at pressure, priorities, metrics, behavior, and contradictions. That gives leaders a more honest baseline than task lists or gut feel alone.",
        },
        {
          title: "Choose the few numbers and behaviors that matter",
          body: "Intentus narrows attention to the scoreboards and habits that define the next quarter, so teams are not reacting to every fire with equal urgency.",
        },
        {
          title: "Keep commitments alive after the planning session",
          body: "Daily or weekly check-ins create a tighter feedback loop around commitments kept, misses, drift, and next actions.",
        },
        {
          title: "Use it with or without an external coach",
          body: "Some leaders use Intentus as a private operating discipline tool. Others pair it with an executive coach or EOS-style meeting rhythm for stronger follow-through.",
        },
      ]}
    />
  );
};

export default ForExecutives;
