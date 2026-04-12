import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import Seo from "@/components/seo/Seo";
import PublicLayout from "@/components/marketing/PublicLayout";
import { organizationJsonLd, softwareJsonLd, type JsonLd } from "@/lib/site";

type MarketingPageProps = {
  title: string;
  description: string;
  path: string;
  heading: string;
  intro: string;
  sections: Array<{ title: string; body: string }>;
  ctaLabel?: string;
  ctaTo?: string;
  jsonLd?: JsonLd;
};

const MarketingPage = ({
  title,
  description,
  path,
  heading,
  intro,
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
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="mb-6 font-heading text-4xl font-bold tracking-tight text-foreground md:text-6xl">{heading}</h1>
            <p className="max-w-3xl mx-auto text-lg leading-relaxed text-muted-foreground md:text-xl">{intro}</p>
            <div className="mt-8 flex flex-col gap-4 sm:flex-row justify-center">
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
