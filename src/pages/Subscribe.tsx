import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, Check, Loader2, RefreshCw, ShieldCheck, Sparkles } from "lucide-react";
import { Purchases, type PurchasesPackage } from "@revenuecat/purchases-capacitor";
import AppBreadcrumb from "@/components/AppBreadcrumb";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { brandLogo as logo } from "@/lib/brand";
import { getTierCapability, normalizePlanTier, type PlanTier } from "@/lib/tier-policy";
import {
  configureRevenueCat,
  isNativeRevenueCatAvailable,
  REVENUECAT_PRODUCT_IDS,
  syncSupabasePlanTierFromCustomerInfo,
} from "@/lib/revenuecat";

type Plan = {
  tier: Exclude<PlanTier, "free">;
  name: string;
  productId: string;
  fallbackPrice: string;
  summary: string;
  featured?: boolean;
  features: string[];
};

const plans: Plan[] = [
  {
    tier: "pro",
    name: "Executive",
    productId: REVENUECAT_PRODUCT_IDS.pro,
    fallbackPrice: "$29.99",
    summary: "Full AI operating coach for execution rhythm.",
    featured: true,
    features: [
      "Full operating audit and report",
      "AI check-in debriefs",
      "AI Operating Coach chat",
      "Drift tracking and accountability history",
    ],
  },
  {
    tier: "premium",
    name: "Premium",
    productId: REVENUECAT_PRODUCT_IDS.premium,
    fallbackPrice: "$99.99",
    summary: "Sharper Mirror Mode and plan refresh support.",
    features: [
      "Everything in Executive",
      "Mirror Mode call-outs",
      "Rotating AI coaching signals",
      "Quarterly re-audits and AI plan refreshes",
    ],
  },
  {
    tier: "coach",
    name: "Coach",
    productId: REVENUECAT_PRODUCT_IDS.coach,
    fallbackPrice: "$399.99",
    summary: "Premium AI plus client accountability workflows.",
    features: [
      "Everything in Premium",
      "Unlimited client accounts",
      "Assign clients to tiers",
      "Review client reports, audits, and check-ins",
    ],
  },
];

const Subscribe = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [currentTier, setCurrentTier] = useState<PlanTier>("free");
  const [packages, setPackages] = useState<PurchasesPackage[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionProductId, setActionProductId] = useState<string | null>(null);
  const [restoreLoading, setRestoreLoading] = useState(false);
  const nativeAvailable = isNativeRevenueCatAvailable();

  useEffect(() => {
    if (!user) return;

    const load = async () => {
      setLoading(true);
      try {
        const { data } = await supabase
          .from("profiles")
          .select("plan_tier")
          .eq("user_id", user.id)
          .single();
        setCurrentTier(normalizePlanTier(data?.plan_tier));

        if (nativeAvailable) {
          await configureRevenueCat(user.id);
          const offerings = await Purchases.getOfferings();
          setPackages(offerings.current?.availablePackages ?? []);
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : "Unable to load subscription options.";
        toast({ title: "Subscription setup issue", description: message, variant: "destructive" });
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [nativeAvailable, toast, user]);

  const packageByProductId = useMemo(() => {
    return new Map(packages.map((pkg) => [pkg.product.identifier, pkg]));
  }, [packages]);

  const handlePurchase = async (plan: Plan) => {
    if (!user) return;
    if (!nativeAvailable) {
      toast({
        title: "Open Intentus on iPhone",
        description: "Apple in-app purchases are available in the iOS app.",
      });
      return;
    }

    const selectedPackage = packageByProductId.get(plan.productId);
    if (!selectedPackage) {
      toast({
        title: "Subscription unavailable",
        description: "This product is not available from RevenueCat yet. Check the offering configuration and try again.",
        variant: "destructive",
      });
      return;
    }

    setActionProductId(plan.productId);
    try {
      const result = await Purchases.purchasePackage({ aPackage: selectedPackage });
      const newTier = await syncSupabasePlanTierFromCustomerInfo(user.id, result.customerInfo);
      if (newTier) {
        setCurrentTier(newTier);
        toast({ title: "Subscription active", description: `${getTierCapability(newTier).label} is now active.` });
        navigate("/dashboard");
      } else {
        toast({ title: "Purchase complete", description: "RevenueCat did not report an active entitlement yet. Try Restore Purchases in a moment." });
      }
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
    if (!user) return;
    if (!nativeAvailable) {
      toast({ title: "Open Intentus on iPhone", description: "Restore Purchases is available in the iOS app." });
      return;
    }

    setRestoreLoading(true);
    try {
      await configureRevenueCat(user.id);
      const { customerInfo } = await Purchases.restorePurchases();
      const restoredTier = await syncSupabasePlanTierFromCustomerInfo(user.id, customerInfo);
      if (restoredTier) {
        setCurrentTier(restoredTier);
        toast({ title: "Purchases restored", description: `${getTierCapability(restoredTier).label} is now active.` });
      } else {
        toast({ title: "No active subscription found", description: "We did not find an active Intentus subscription for this Apple ID." });
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Restore Purchases failed.";
      toast({ title: "Restore failed", description: message, variant: "destructive" });
    } finally {
      setRestoreLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <nav className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto flex h-14 items-center justify-between px-4">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <Link to="/dashboard" className="flex items-center">
              <img src={logo} alt="Intentus" className="h-8 w-auto object-contain" />
            </Link>
          </div>
          <Button variant="ghost" size="sm" onClick={handleRestore} disabled={restoreLoading || loading}>
            {restoreLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
            Restore
          </Button>
        </div>
      </nav>

      <AppBreadcrumb />

      <main className="container mx-auto px-4 py-10">
        <div className="mx-auto max-w-3xl text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <Sparkles className="h-7 w-7" />
          </div>
          <h1 className="font-heading text-3xl font-bold text-foreground md:text-5xl">Choose your Intentus plan</h1>
          <p className="mx-auto mt-4 max-w-2xl text-muted-foreground">
            Upgrade from the Starter snapshot to ongoing AI coaching, sharper drift detection, and a tighter operating rhythm.
          </p>
          <div className="mt-4 flex justify-center">
            <Badge variant="outline">Current plan: {getTierCapability(currentTier).label}</Badge>
          </div>
        </div>

        {!nativeAvailable && (
          <div className="mx-auto mt-8 max-w-3xl rounded-2xl border border-primary/20 bg-primary/5 p-4 text-sm text-foreground">
            Apple in-app purchases are available in the iOS app. Open Intentus on your iPhone or iPad to subscribe or restore purchases.
          </div>
        )}

        {loading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <div className="mx-auto mt-10 grid max-w-6xl gap-6 md:grid-cols-3">
            {plans.map((plan) => {
              const rcPackage = packageByProductId.get(plan.productId);
              const price = rcPackage?.product.priceString ?? plan.fallbackPrice;
              const active = currentTier === plan.tier;
              return (
                <article
                  key={plan.tier}
                  className={`rounded-2xl border bg-card p-6 shadow-soft ${plan.featured ? "border-primary/40 ring-1 ring-primary/20" : "border-border/60"}`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h2 className="font-heading text-2xl font-bold text-foreground">{plan.name}</h2>
                      <p className="mt-2 text-sm text-muted-foreground">{plan.summary}</p>
                    </div>
                    {plan.featured && <Badge>Popular</Badge>}
                  </div>
                  <div className="mt-6">
                    <span className="font-heading text-4xl font-bold text-foreground">{price}</span>
                    <span className="text-muted-foreground">/mo</span>
                  </div>
                  <Button
                    variant={plan.featured ? "hero" : "hero-outline"}
                    className="mt-6 w-full"
                    disabled={active || actionProductId !== null || loading}
                    onClick={() => handlePurchase(plan)}
                  >
                    {actionProductId === plan.productId ? (
                      <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Purchasing...</>
                    ) : active ? (
                      "Current plan"
                    ) : (
                      `Choose ${plan.name}`
                    )}
                  </Button>
                  <ul className="mt-6 space-y-3">
                    {plan.features.map((feature) => (
                      <li key={feature} className="flex items-start gap-2.5 text-sm text-foreground">
                        <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                </article>
              );
            })}
          </div>
        )}

        <div className="mx-auto mt-8 flex max-w-3xl items-start gap-3 rounded-2xl border border-border bg-card p-4 text-sm text-muted-foreground">
          <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
          <p>
            Payment is handled by Apple. Manage or cancel subscriptions in your Apple ID subscription settings.
            Intentus provides coaching and self-reflection tools, not medical, legal, financial, or crisis advice.
          </p>
        </div>
      </main>
    </div>
  );
};

export default Subscribe;
