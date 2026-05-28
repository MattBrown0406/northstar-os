import { Link } from "react-router-dom";
import { FileText } from "lucide-react";
import PublicLayout from "@/components/marketing/PublicLayout";
import Seo from "@/components/seo/Seo";

const sections = [
  {
    title: "Acceptance of Terms",
    body: "By downloading, installing, or using Intentus, you agree to be bound by these Terms of Use. If you do not agree, do not use the app.",
  },
  {
    title: "Description of Service",
    body: "Intentus is an AI-assisted operating coaching and self-reflection tool for founders, executives, and leaders. It is not therapy, medical care, mental health treatment, legal advice, financial advice, or crisis support. Intentus does not replace qualified professional advisors.",
  },
  {
    title: "Subscriptions and Auto-Renewal",
    body: "Intentus offers auto-renewing subscriptions managed by Apple through In-App Purchase. When you purchase a subscription, payment will be charged to your Apple ID account. Subscriptions automatically renew unless cancelled at least 24 hours before the end of the current period. You can manage and cancel subscriptions in your Apple ID account settings at any time. No refunds are provided for partial subscription periods.",
  },
  {
    title: "Subscription Plans",
    body: "Executive: $39.99/month — AI operating coach chat, AI check-in debriefs, drift tracking, and accountability history. Premium: $79.99/month — Everything in Executive plus Mirror Mode, rotating coaching signals, and quarterly plan refreshes. Coach: $299.99/month — Everything in Premium plus coach/client workflows and unlimited client accounts. Prices are in USD and may vary by region. Current pricing is shown on the subscription screen before purchase.",
  },
  {
    title: "Free Tier",
    body: "Intentus offers a free Starter tier with limited audit and reflection functionality. Paid features require an active subscription.",
  },
  {
    title: "User Accounts",
    body: "You must create an account to use Intentus. You are responsible for maintaining the confidentiality of your account credentials and for all activity under your account. You must be at least 13 years old to create an account.",
  },
  {
    title: "Acceptable Use",
    body: "You agree to use Intentus only for lawful purposes and in accordance with these Terms. You may not use Intentus to violate any applicable law, infringe on the rights of others, transmit harmful or offensive content, or attempt to interfere with the operation of the service.",
  },
  {
    title: "Intellectual Property",
    body: "Intentus and its content, features, and functionality are owned by Intentus and are protected by applicable intellectual property laws. You may not copy, modify, distribute, or create derivative works without express written permission.",
  },
  {
    title: "Disclaimers",
    body: "Intentus is provided on an \"as is\" and \"as available\" basis without warranties of any kind. We do not warrant that the service will be uninterrupted, error-free, or completely secure. AI-generated coaching content is for self-reflection purposes only and does not constitute professional advice of any kind.",
  },
  {
    title: "Limitation of Liability",
    body: "To the maximum extent permitted by applicable law, Intentus shall not be liable for any indirect, incidental, special, consequential, or punitive damages arising from your use of or inability to use the service.",
  },
  {
    title: "Account Deletion",
    body: "You may delete your account at any time from Dashboard > Settings > Delete account. Deleting your account removes your profile and associated app data. Active subscriptions must be cancelled separately through your Apple ID subscription settings.",
  },
  {
    title: "Changes to Terms",
    body: "We may update these Terms of Use from time to time. Continued use of Intentus after changes constitutes acceptance of the updated Terms. We will provide notice of material changes where appropriate.",
  },
  {
    title: "Governing Law",
    body: "These Terms are governed by the laws of the state of Oregon, United States, without regard to conflict of law principles.",
  },
  {
    title: "Contact",
    body: "Questions about these Terms? Contact us at support@intentusai.com.",
  },
];

const TermsPage = () => {
  return (
    <PublicLayout>
      <Seo
        title="Terms of Use"
        description="Terms of Use for Intentus, including subscription terms, auto-renewal policy, acceptable use, and account deletion."
        path="/terms"
      />

      <section className="relative overflow-hidden pt-32 pb-16">
        <div className="absolute inset-0 bg-gradient-subtle opacity-70" />
        <div className="container relative mx-auto px-4">
          <div className="mx-auto max-w-4xl text-center">
            <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <FileText className="h-7 w-7" />
            </div>
            <p className="mb-4 text-sm font-semibold uppercase tracking-[0.18em] text-primary">Terms of Use</p>
            <h1 className="font-heading text-4xl font-bold tracking-tight text-foreground md:text-6xl">Intentus Terms of Use</h1>
            <p className="mx-auto mt-6 max-w-3xl text-lg leading-relaxed text-muted-foreground md:text-xl">
              Please read these terms carefully before using Intentus.
            </p>
            <p className="mt-4 text-sm text-muted-foreground">Effective date: May 28, 2026</p>
          </div>
        </div>
      </section>

      <section className="container mx-auto max-w-4xl px-4 pb-24">
        <div className="space-y-10">
          {sections.map((section) => (
            <div key={section.title}>
              <h2 className="font-heading text-xl font-bold text-foreground">{section.title}</h2>
              <p className="mt-3 leading-relaxed text-muted-foreground">{section.body}</p>
            </div>
          ))}
        </div>
        <div className="mt-12 flex flex-wrap gap-4 text-sm text-muted-foreground">
          <Link to="/privacy" className="underline hover:text-foreground transition-colors">Privacy Policy</Link>
          <Link to="/support" className="underline hover:text-foreground transition-colors">Support</Link>
        </div>
      </section>
    </PublicLayout>
  );
};

export default TermsPage;
