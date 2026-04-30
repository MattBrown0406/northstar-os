import { Link } from "react-router-dom";
import { Lock, Mail, ShieldCheck } from "lucide-react";
import PublicLayout from "@/components/marketing/PublicLayout";
import Seo from "@/components/seo/Seo";
import { organizationJsonLd, softwareJsonLd } from "@/lib/site";

const sections = [
  {
    title: "Information we collect",
    body: "Intentus collects the information you provide when you create an account and use the app, including your email address, display name, onboarding preferences, operating audit responses, reports, check-ins, commitments, subscription status, and related coaching history.",
  },
  {
    title: "How we use information",
    body: "We use your information to provide the Intentus experience, including account access, operating audits, AI-generated coaching, check-ins, commitment tracking, plan features, subscription access, support, safety, and product improvement.",
  },
  {
    title: "AI coaching data",
    body: "Intentus uses your audit responses, check-ins, commitments, reports, and profile preferences to generate coaching and self-reflection outputs. Intentus is not therapy, medical care, legal advice, financial advice, crisis support, or a substitute for qualified professional help.",
  },
  {
    title: "Subscriptions and payments",
    body: "Payments for iOS subscriptions are handled by Apple. Intentus uses RevenueCat to manage subscription status and unlock the correct app features. We do not receive or store your full Apple payment card information.",
  },
  {
    title: "Service providers",
    body: "We use trusted service providers to operate the app, including hosting, authentication, database services, AI processing, analytics, support, and subscription management. These providers process information only as needed to support the app.",
  },
  {
    title: "Data retention",
    body: "We keep account and app data for as long as needed to provide Intentus, comply with legal obligations, resolve disputes, maintain security, and improve the service. You can request or initiate account deletion as described below.",
  },
  {
    title: "Account deletion",
    body: "You can initiate account deletion inside the app from Dashboard > Settings > Delete account. Deleting your account removes your profile and associated app data according to the in-app deletion flow. Active Apple subscriptions must be cancelled separately through your Apple ID subscription settings.",
  },
  {
    title: "Your choices",
    body: "You can update profile settings in the app, manage iOS subscriptions through Apple, restore purchases from the subscription screen, and contact support with privacy or account questions.",
  },
  {
    title: "Security",
    body: "We use reasonable technical and organizational safeguards designed to protect account and app data. No internet service can guarantee absolute security, but we work to keep the app and its data handling responsible.",
  },
  {
    title: "Children",
    body: "Intentus is intended for adults and is not directed to children under 13. If you believe a child has provided personal information, contact us so we can review and delete it where appropriate.",
  },
  {
    title: "Changes to this policy",
    body: "We may update this Privacy Policy from time to time. When we make material changes, we will update the effective date and provide notice where appropriate.",
  },
];

const PrivacyPage = () => {
  return (
    <PublicLayout>
      <Seo
        title="Privacy Policy"
        description="Privacy Policy for Intentus, including account data, AI coaching data, subscriptions, account deletion, and support."
        path="/privacy"
        jsonLd={[organizationJsonLd, softwareJsonLd]}
      />

      <section className="relative overflow-hidden pt-32 pb-16">
        <div className="absolute inset-0 bg-gradient-subtle opacity-70" />
        <div className="container relative mx-auto px-4">
          <div className="mx-auto max-w-4xl text-center">
            <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <Lock className="h-7 w-7" />
            </div>
            <p className="mb-4 text-sm font-semibold uppercase tracking-[0.18em] text-primary">Privacy Policy</p>
            <h1 className="font-heading text-4xl font-bold tracking-tight text-foreground md:text-6xl">How Intentus handles your information</h1>
            <p className="mx-auto mt-6 max-w-3xl text-lg leading-relaxed text-muted-foreground md:text-xl">
              Intentus is built around honest operating reflection. This policy explains what we collect, how we use it, and how you can manage your account.
            </p>
            <p className="mt-4 text-sm text-muted-foreground">Effective date: April 29, 2026</p>
          </div>
        </div>
      </section>

      <section className="pb-24">
        <div className="container mx-auto px-4">
          <div className="mx-auto max-w-4xl rounded-2xl border border-border/60 bg-card p-6 shadow-soft md:p-8">
            <div className="flex items-start gap-3">
              <ShieldCheck className="mt-1 h-5 w-5 shrink-0 text-primary" />
              <p className="text-sm leading-relaxed text-muted-foreground">
                This Privacy Policy applies to Intentus websites and apps. By using Intentus, you agree to the collection and use of information described here.
              </p>
            </div>
          </div>

          <div className="mx-auto mt-6 max-w-4xl space-y-4">
            {sections.map((section) => (
              <article key={section.title} className="rounded-2xl border border-border/60 bg-card p-6 shadow-soft md:p-8">
                <h2 className="font-heading text-2xl font-bold text-foreground">{section.title}</h2>
                <p className="mt-3 leading-relaxed text-muted-foreground">{section.body}</p>
              </article>
            ))}
          </div>

          <div className="mx-auto mt-10 max-w-4xl rounded-3xl border border-border/60 bg-gradient-subtle p-8 shadow-soft">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <h2 className="font-heading text-2xl font-bold text-foreground">Questions about privacy?</h2>
                <p className="mt-2 text-muted-foreground">Contact support and include the email address associated with your account.</p>
              </div>
              <a href="mailto:support@intentus.ai" className="inline-flex items-center gap-2 text-sm font-semibold text-primary hover:underline">
                <Mail className="h-4 w-4" /> support@intentus.ai
              </a>
            </div>
          </div>

          <div className="mx-auto mt-6 max-w-4xl text-center text-sm text-muted-foreground">
            Need product help? Visit <Link to="/support" className="text-primary hover:underline">Support</Link>.
          </div>
        </div>
      </section>
    </PublicLayout>
  );
};

export default PrivacyPage;
