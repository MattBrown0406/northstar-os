import { Link } from "react-router-dom";
import { ArrowRight, LifeBuoy, Mail, Receipt, ShieldCheck, UserX } from "lucide-react";
import { Button } from "@/components/ui/button";
import PublicLayout from "@/components/marketing/PublicLayout";
import Seo from "@/components/seo/Seo";
import { organizationJsonLd, softwareJsonLd } from "@/lib/site";

const supportItems = [
  {
    icon: Mail,
    title: "Contact support",
    body: "For app access, account, or product questions, email support@intentus.ai. Include the email address on your account and a short description of what happened.",
  },
  {
    icon: Receipt,
    title: "Subscriptions and billing",
    body: "iOS subscriptions are managed through your Apple ID. Open iOS Settings, tap your name, then Subscriptions to view, change, or cancel an active subscription.",
  },
  {
    icon: UserX,
    title: "Account deletion",
    body: "You can initiate account deletion from inside Intentus in Settings. Deleting your account removes your profile and associated app data according to the in-app flow.",
  },
  {
    icon: ShieldCheck,
    title: "Safety boundary",
    body: "Intentus provides coaching and self-reflection tools. It is not therapy, medical care, legal advice, financial advice, crisis support, or a substitute for qualified professional help.",
  },
];

const SupportPage = () => {
  return (
    <PublicLayout>
      <Seo
        title="Support"
        description="Get support for Intentus, including account help, subscriptions, billing, account deletion, and product questions."
        path="/support"
        jsonLd={[organizationJsonLd, softwareJsonLd]}
      />

      <section className="relative overflow-hidden pt-32 pb-16">
        <div className="absolute inset-0 bg-gradient-subtle opacity-70" />
        <div className="container relative mx-auto px-4">
          <div className="mx-auto max-w-4xl text-center">
            <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <LifeBuoy className="h-7 w-7" />
            </div>
            <p className="mb-4 text-sm font-semibold uppercase tracking-[0.18em] text-primary">Support</p>
            <h1 className="font-heading text-4xl font-bold tracking-tight text-foreground md:text-6xl">How can we help?</h1>
            <p className="mx-auto mt-6 max-w-3xl text-lg leading-relaxed text-muted-foreground md:text-xl">
              Find help with your Intentus account, subscription, account deletion, and product questions.
            </p>
          </div>
        </div>
      </section>

      <section className="pb-24">
        <div className="container mx-auto px-4">
          <div className="mx-auto grid max-w-5xl gap-5 md:grid-cols-2">
            {supportItems.map((item) => {
              const Icon = item.icon;
              return (
                <article key={item.title} className="rounded-2xl border border-border/60 bg-card p-6 shadow-soft">
                  <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <Icon className="h-5 w-5" />
                  </div>
                  <h2 className="font-heading text-xl font-bold text-foreground">{item.title}</h2>
                  <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{item.body}</p>
                </article>
              );
            })}
          </div>

          <div className="mx-auto mt-10 flex max-w-5xl flex-col gap-4 rounded-3xl border border-border/60 bg-gradient-subtle p-8 text-center shadow-soft md:flex-row md:items-center md:justify-between md:text-left">
            <div>
              <h2 className="font-heading text-2xl font-bold text-foreground">Need help using Intentus?</h2>
              <p className="mt-2 text-muted-foreground">Send us the issue and the account email so we can look in the right place.</p>
            </div>
            <Button asChild variant="hero" size="lg">
              <a href="mailto:support@intentus.ai">
                Email support <ArrowRight className="h-4 w-4" />
              </a>
            </Button>
          </div>

          <div className="mx-auto mt-6 max-w-5xl text-center text-sm text-muted-foreground">
            Looking for general product questions? Visit the <Link to="/faq" className="text-primary hover:underline">FAQ</Link>.
          </div>
        </div>
      </section>
    </PublicLayout>
  );
};

export default SupportPage;
