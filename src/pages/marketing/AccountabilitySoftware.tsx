import MarketingPage from "@/components/marketing/MarketingPage";

const AccountabilitySoftware = () => {
  return (
    <MarketingPage
      title="Accountability software for leaders"
      description="Intentus is accountability software for founders, leaders, and ambitious operators who want better follow-through on the metrics, decisions, and commitments that matter most."
      path="/accountability-software"
      heading="Accountability software that pushes past motivation and into operating discipline"
      intro="Most accountability tools stop at reminders, habits, or generic goal tracking. Intentus is different. It starts with what matters strategically, ties commitments to scoreboards, and uses ongoing check-ins to catch drift before it compounds."
      sections={[
        {
          title: "Focus on operating outcomes, not streaks",
          body: "Intentus is built around the leadership behaviors and business numbers that define execution quality, rather than generic habit gamification.",
        },
        {
          title: "Create pressure in the right places",
          body: "Check-ins work best when they are tied to real priorities. Intentus keeps the spotlight on commitments, misses, and the few metrics that prove progress.",
        },
        {
          title: "Use daily or weekly cadence",
          body: "Some leaders want a tight daily loop. Others want a weekly operating review. Intentus supports both without losing continuity across the quarter.",
        },
        {
          title: "Shareable reports when needed",
          body: "Leaders can keep the process private or export reports and plans to align with a coach, cofounder, board member, or leadership team.",
        },
      ]}
    />
  );
};

export default AccountabilitySoftware;
