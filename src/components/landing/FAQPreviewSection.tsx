import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { faqItems } from "@/lib/site";

const FAQPreviewSection = () => {
  return (
    <section className="bg-gradient-subtle py-24">
      <div className="container mx-auto px-4">
        <div className="mx-auto max-w-4xl">
          <div className="mb-12 text-center">
            <h2 className="mb-4 font-heading text-3xl font-bold text-foreground md:text-4xl">Common questions from serious operators</h2>
            <p className="text-lg text-muted-foreground">
              Clear answers about fit, privacy, and how the audit-to-accountability flow works.
            </p>
          </div>
          <div className="space-y-4">
            {faqItems.slice(0, 3).map((item) => (
              <div key={item.question} className="rounded-2xl border border-border/60 bg-card p-6 shadow-soft">
                <h3 className="font-heading text-xl font-bold text-foreground">{item.question}</h3>
                <p className="mt-3 leading-relaxed text-muted-foreground">{item.answer}</p>
              </div>
            ))}
          </div>
          <div className="mt-8 text-center">
            <Link to="/faq" className="inline-flex items-center gap-2 text-sm font-semibold text-primary hover:text-primary/80">
              Read all FAQs <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
};

export default FAQPreviewSection;
