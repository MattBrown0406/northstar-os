import MarketingPage from "@/components/marketing/MarketingPage";

const ForCoaches = () => {
  return (
    <MarketingPage
      title="For coaches and advisory firms"
      description="Intentus gives coaches a white-label-ready accountability layer with audits, 90-day plans, and structured client check-ins."
      path="/for-coaches"
      eyebrow="Secondary use case"
      heading="Give coaching clients a structured accountability system between sessions"
      intro="If you run leadership coaching, advisory, or accountability programs, Intentus adds a consistent operating cadence your clients can actually follow. Use the audit to establish truth, then reinforce execution with branded check-ins and quarterly resets."
      bullets={[
        "Captures coach-specific search intent without diluting the homepage for executives.",
        "Explains white-label and client accountability benefits in one focused page.",
        "Creates a natural internal-link target from the homepage, pricing, and footer.",
      ]}
      sections={[
        {
          title: "Start each engagement from the same baseline",
          body: "The operating audit gives every client a common structure for discussing performance, blind spots, commitments, and operating discipline.",
        },
        {
          title: "Keep momentum between live sessions",
          body: "Clients get daily or weekly check-ins that reinforce commitments, surface drift, and make your next conversation more specific.",
        },
        {
          title: "Extend your method without adding admin overhead",
          body: "Instead of chasing notes and follow-ups manually, coaches can use Intentus to standardize accountability across multiple clients.",
        },
        {
          title: "Stay close to the operating truth",
          body: "Structured reports and plan refreshes make it easier to see which clients are progressing, rationalizing, or quietly sliding off track.",
        },
      ]}
    />
  );
};

export default ForCoaches;
