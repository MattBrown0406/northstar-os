import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import PublicLayout from "@/components/marketing/PublicLayout";
import Seo from "@/components/seo/Seo";
import { faqItems, faqJsonLd, organizationJsonLd, softwareJsonLd } from "@/lib/site";

const FaqPage = () => {
  return (
    <PublicLayout>
      <Seo
        title="FAQ"
        description="Answers to common questions about Intentus, including who it is for, how the operating audit works, privacy, pricing, and coach use cases."
        path="/faq"
        jsonLd={[organizationJsonLd, softwareJsonLd, faqJsonLd]}
      />

      <section className="relative overflow-hidden pt-32 pb-16">
        <div className="absolute inset-0 bg-gradient-subtle opacity-70" />
        <div className="container relative mx-auto px-4">
          <div className="mx-auto max-w-4xl text-center">
            <p className="mb-4 text-sm font-semibold uppercase tracking-[0.18em] text-primary">FAQ</p>
            <h1 className="font-heading text-4xl font-bold tracking-tight text-foreground md:text-6xl">Questions thoughtful operators ask before they trust a new system</h1>
            <p className="mx-auto mt-6 max-w-3xl text-lg leading-relaxed text-muted-foreground md:text-xl">
              Straight answers about fit, privacy, coaching use cases, pricing, and what Intentus actually helps you do.
            </p>
          </div>
        </div>
      </section>

      <section className="pb-24">
        <div className="container mx-auto px-4">
          <div className="mx-auto max-w-4xl space-y-4">
            {faqItems.map((item) => (
              <article key={item.question} className="rounded-2xl border border-border/60 bg-card p-6 shadow-soft md:p-8">
                <h2 className="font-heading text-2xl font-bold text-foreground">{item.question}</h2>
                <p className="mt-3 leading-relaxed text-muted-foreground">{item.answer}</p>
              </article>
            ))}

            <article className="rounded-2xl border border-border/60 bg-card p-6 shadow-soft md:p-8">
              <h2 className="font-heading text-2xl font-bold text-foreground">What does privacy mean in practice?</h2>
              <p className="mt-3 leading-relaxed text-muted-foreground">
                The product is positioned for honest internal reflection on goals, execution, contradictions, and weak spots. That means privacy matters. Intentus is not pitched as a social feed or public community, and the public site now makes that expectation explicit.
              </p>
            </article>
          </div>

          <div className="mx-auto mt-10 flex max-w-4xl flex-col gap-4 rounded-3xl border border-border/60 bg-gradient-subtle p-8 text-center shadow-soft md:flex-row md:items-center md:justify-between md:text-left">
            <div>
              <h2 className="font-heading text-2xl font-bold text-foreground">Want to see the operating audit for yourself?</h2>
              <p className="mt-2 text-muted-foreground">Start with the assessment, then decide whether you want a tighter accountability cadence.</p>
            </div>
            <Button asChild variant="hero" size="lg">
              <Link to="/auth">
                Start audit <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </section>
    </PublicLayout>
  );
};

export default FaqPage;
