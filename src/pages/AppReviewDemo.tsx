import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Capacitor } from "@capacitor/core";
import { Purchases, type PurchasesPackage } from "@revenuecat/purchases-capacitor";
import { ArrowLeft, CheckCircle2, Loader2, RefreshCw, ShieldCheck, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { brandLogo as logo } from "@/lib/brand";
import { configureRevenueCat, REVENUECAT_PRODUCT_IDS } from "@/lib/revenuecat";
import Seo from "@/components/seo/Seo";

type ReviewPlan = {
  name: string;
  productId: string;
  fallbackPrice: string;
  description: string;
};

const REVIEW_APP_USER_ID_STORAGE_KEY = "intentus:app-review-demo-user-id";

function getReviewAppUserId() {
  if (typeof window === "undefined") return "app-review-demo-server";

  const existing = window.localStorage.getItem(REVIEW_APP_USER_ID_STORAGE_KEY);
  if (existing) return existing;

  const generated = `app-review-demo-${crypto.randomUUID()}`;
  window.localStorage.setItem(REVIEW_APP_USER_ID_STORAGE_KEY, generated);
  return generated;
}

const reviewPlans: ReviewPlan[] = [
  {
    name: "Executive",
    productId: REVENUECAT_PRODUCT_IDS.pro,
    fallbackPrice: "$29.99/mo",
    description: "AI operating coach chat, AI check-in debriefs, drift tracking, and accountability history.",
  },
  {
    name: "Premium",
    productId: REVENUECAT_PRODUCT_IDS.premium,
    fallbackPrice: "$99.99/mo",
    description: "Everything in Executive plus Mirror Mode, rotating coaching signals, and quarterly plan refreshes.",
  },
  {
    name: "Coach",
    productId: REVENUECAT_PRODUCT_IDS.coach,
    fallbackPrice: "$399.99/mo",
    description: "Premium AI plus coach/client accountability workflows and client tier assignment.",
  },
];

const sampleFeatures = [
  "Baseline operating audit with structured reflection prompts",
  "Strategic report showing patterns, contradictions, forced choice, and a 90-day plan",
  "Dashboard with weekly commitments, drift detection, check-ins, and report access",
  "AI Operating Coach for leaders who purchase Executive, Premium, or Coach",
  "Coach workspace for client accountability when Coach access is active",
];

const sampleAiDisclosure = [
  "AI service: Lovable AI Gateway using Google Gemini 2.5 Pro for report generation and coaching responses.",
  "Data processed: audit answers, onboarding preferences, check-in answers, weekly commitments, and previous report context entered by the user.",
  "Personal data processed: account identifier from Supabase, optional display name, self-reflection text, coaching preferences, and app activity needed to generate coaching context.",
];

const AppReviewDemo = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const nativeAvailable = Capacitor.isNativePlatform();
  const reviewAppUserId = useMemo(() => getReviewAppUserId(), []);
  const [loadingOfferings, setLoadingOfferings] = useState(false);
  const [packages, setPackages] = useState<PurchasesPackage[]>([]);
  const [actionProductId, setActionProductId] = useState<string | null>(null);
  const [restoreLoading, setRestoreLoading] = useState(false);

  const packageByProductId = useMemo(() => new Map(packages.map((pkg) => [pkg.product.identifier, pkg])), [packages]);

  const loadOfferings = async () => {
    if (!nativeAvailable) {
      toast({ title: "Open the iOS build", description: "The StoreKit purchase sheet is only available inside the iOS app." });
      return;
    }

    setLoadingOfferings(true);
    try {
      await configureRevenueCat(reviewAppUserId);
      const offerings = await Purchases.getOfferings();
      setPackages(offerings.current?.availablePackages ?? []);
      toast({ title: "Subscription products loaded", description: "Choose a plan below to open Apple's sandbox purchase flow." });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to load subscription products.";
      toast({ title: "Subscription setup issue", description: message, variant: "destructive" });
    } finally {
      setLoadingOfferings(false);
    }
  };

  const handlePurchase = async (plan: ReviewPlan) => {
    if (!nativeAvailable) {
      toast({ title: "Open the iOS build", description: "Apple in-app purchases are available inside the iOS app." });
      return;
    }

    let selectedPackage = packageByProductId.get(plan.productId);
    setActionProductId(plan.productId);
    try {
      await configureRevenueCat(reviewAppUserId);
      if (!selectedPackage) {
        const offerings = await Purchases.getOfferings();
        const availablePackages = offerings.current?.availablePackages ?? [];
        setPackages(availablePackages);
        selectedPackage = availablePackages.find((pkg) => pkg.product.identifier === plan.productId);
      }

      if (!selectedPackage) {
        toast({
          title: "Subscription unavailable",
          description: "RevenueCat did not return this App Store product. Confirm the App Store Connect products are attached to the current RevenueCat offering.",
          variant: "destructive",
        });
        return;
      }

      await Purchases.purchasePackage({ aPackage: selectedPackage });
      toast({ title: "Purchase flow completed", description: "Apple returned control to Intentus after the sandbox purchase flow." });
    } catch (error) {
      const message = error instanceof Error ? error.message : "The purchase could not be completed.";
      if (!message.toLowerCase().includes("cancel")) {
        toast({ title: "Purchase failed", description: message, variant: "destructive" });
      }
    } finally {
      setActionProductId(null);
    }
  };

  const handleRestore = async () => {
    if (!nativeAvailable) {
      toast({ title: "Open the iOS build", description: "Restore Purchases is available inside the iOS app." });
      return;
    }

    setRestoreLoading(true);
    try {
      await configureRevenueCat(reviewAppUserId);
      await Purchases.restorePurchases();
      toast({ title: "Restore checked", description: "Intentus checked Apple's subscription receipt for the App Review demo user." });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Restore Purchases failed.";
      toast({ title: "Restore failed", description: message, variant: "destructive" });
    } finally {
      setRestoreLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Seo title="App Review Demo" description="Read-only App Review demonstration mode for Intentus." path="/review-demo" noindex />
      <nav className="sticky top-0 z-10 border-b border-border bg-card/80 backdrop-blur-sm">
        <div className="container mx-auto flex h-14 items-center justify-between px-4">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate(-1)} aria-label="Go back">
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <Link to="/" className="flex items-center gap-2">
              <img src={logo} alt="Intentus" className="h-8 w-auto object-contain" />
              <span className="text-sm font-semibold text-foreground">App Review Demo</span>
            </Link>
          </div>
          <Badge variant="outline">Expired subscription demo</Badge>
        </div>
      </nav>

      <main className="container mx-auto px-4 py-10">
        <section className="mx-auto max-w-4xl text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <ShieldCheck className="h-7 w-7" />
          </div>
          <h1 className="font-heading text-3xl font-bold text-foreground md:text-5xl">Intentus App Review Demo Mode</h1>
          <p className="mx-auto mt-4 max-w-2xl text-muted-foreground">
            This read-only mode gives App Review access to the app's core functionality without depending on production account state. It also starts from an unsubscribed / expired-subscription state so reviewers can inspect the Apple in-app purchase and restore flow.
          </p>
        </section>

        <section className="mx-auto mt-10 grid max-w-5xl gap-6 md:grid-cols-2">
          <article className="rounded-2xl border border-border bg-card p-6 shadow-soft">
            <h2 className="font-heading text-2xl font-bold text-foreground">Features available in the app</h2>
            <ul className="mt-5 space-y-3">
              {sampleFeatures.map((feature) => (
                <li key={feature} className="flex gap-3 text-sm text-foreground">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                  <span>{feature}</span>
                </li>
              ))}
            </ul>
          </article>

          <article className="rounded-2xl border border-border bg-card p-6 shadow-soft">
            <h2 className="font-heading text-2xl font-bold text-foreground">AI and privacy disclosure</h2>
            <ul className="mt-5 space-y-3">
              {sampleAiDisclosure.map((item) => (
                <li key={item} className="flex gap-3 text-sm text-foreground">
                  <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </article>
        </section>

        <section className="mx-auto mt-8 max-w-5xl rounded-2xl border border-primary/20 bg-primary/5 p-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="font-heading text-2xl font-bold text-foreground">Subscription purchase flow</h2>
              <p className="mt-2 text-sm text-muted-foreground">
                Demo state: no active entitlement on first launch. Purchases in this mode are associated with a local App Review demo RevenueCat user ID, not a signed-in Supabase account. Use these buttons to open Apple's sandbox purchase sheet for the current RevenueCat offering, or restore purchases for the demo user.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" onClick={loadOfferings} disabled={loadingOfferings}>
                {loadingOfferings ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Load products
              </Button>
              <Button variant="outline" onClick={handleRestore} disabled={restoreLoading}>
                {restoreLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
                Restore Purchases
              </Button>
            </div>
          </div>

          {!nativeAvailable && (
            <div className="mt-5 rounded-xl border border-border bg-card p-4 text-sm text-muted-foreground">
              StoreKit is not available in this web preview. Open the iOS app build on iPhone or iPad to review the purchase sheet.
            </div>
          )}

          <div className="mt-6 grid gap-4 md:grid-cols-3">
            {reviewPlans.map((plan) => {
              const rcPackage = packageByProductId.get(plan.productId);
              const price = rcPackage?.product.priceString ?? plan.fallbackPrice;
              return (
                <article key={plan.productId} className="rounded-2xl border border-border bg-card p-5">
                  <h3 className="font-heading text-xl font-bold text-foreground">{plan.name}</h3>
                  <p className="mt-2 text-sm text-muted-foreground">{plan.description}</p>
                  <p className="mt-5 font-heading text-3xl font-bold text-foreground">{price}</p>
                  <Button className="mt-5 w-full" variant="hero" onClick={() => handlePurchase(plan)} disabled={actionProductId !== null}>
                    {actionProductId === plan.productId ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Opening Apple…</> : `Review ${plan.name} Purchase`}
                  </Button>
                </article>
              );
            })}
          </div>
        </section>
      </main>
    </div>
  );
};

export default AppReviewDemo;
