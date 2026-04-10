import { Link } from "react-router-dom";
import { ArrowRight, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import Seo from "@/components/seo/Seo";
import PublicLayout from "@/components/marketing/PublicLayout";
import { organizationJsonLd, softwareJsonLd, type JsonLd } from "@/lib/site";

type MarketingPageProps = {
  title: string;
  description: string;
  path: string;
  eyebrow: string;
  heading: string;
  intro: string;
  bullets: string[];
  sections: Array<{ title: string; body: string }>;
  ctaLabel?: string;
  ctaTo?: string;
  jsonLd?: JsonLd;
};

const MarketingPage = ({
  title,
  description,
  path,
  eyebrow,
  heading,
  intro,
  bullets,
  sections,
  ctaLabel = "Start your operating audit",
  ctaTo = "/auth",
  jsonLd,
}: MarketingPageProps) => {
  const combinedJsonLd = [organizationJsonLd, softwareJsonLd, ...(Array.isArray(jsonLd) ? jsonLd : jsonLd ? [jsonLd] : [])];

  return (
    <PublicLayout>
      <Seo title={title} description={description} path={path} jsonLd={combinedJsonLd} />
      <section className="relative overflow-hidden pt-32 pb-20">
        <div className="absolute inset-0 bg-gradient-subtle opacity-70" />
        <div className="container relative mx-auto px-4">
          <div className="max-w-5xl mx-auto grid gap-10 lg:grid-cols-[1.2fr_0.8fr] items-start">
            <div>
              <p className="mb-4 text-sm font-semibold uppercase tracking-[0.18em] text-primary">{eyebrow}</p>
              <h1 className="mb-6 font-heading text-4xl font-bold tracking-tight text-foreground md:text-6xl">{heading}</h1>
              <p className="max-w-3xl text-lg leading-relaxed text-muted-foreground md:text-xl">{intro}</p>
              <div className="mt-8 flex flex-col gap-4 sm:flex-row">
                <Button asChild variant="hero" size="lg">
                  <Link to={ctaTo}>
                    {ctaLabel} <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
                <Button asChild variant="hero-outline" size="lg">
                  <Link to="/faq">Read the FAQ</Link>
                </Button>
              </div>
            </div>
            <div className="rounded-2xl border border-border/60 bg-card p-6 shadow-soft">
              <h2 className="mb-5 font-heading text-xl font-bold text-foreground">Why this page exists</h2>
              <ul className="space-y-4">
                {bullets.map((bullet) => (
                  <li key={bullet} className="flex items-start gap-3 text-sm leading-relaxed text-foreground md:text-base">
                    <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                    <span>{bullet}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      <section className="pb-24">
        <div className="container mx-auto px-4">
          <div className="mx-auto grid max-w-5xl gap-6 md:grid-cols-2">
            {sections.map((section) => (
              <article key={section.title} className="rounded-2xl border border-border/60 bg-card p-8 shadow-soft">
                <h2 className="mb-3 font-heading text-2xl font-bold text-foreground">{section.title}</h2>
                <p className="leading-relaxed text-muted-foreground">{section.body}</p>
              </article>
            ))}
          </div>
        </div>
      </section>
    </PublicLayout>
  );
};

export default MarketingPage;
