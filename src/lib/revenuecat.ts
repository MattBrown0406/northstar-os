import { Capacitor } from "@capacitor/core";
import { Purchases, LOG_LEVEL, type CustomerInfo } from "@revenuecat/purchases-capacitor";
import { supabase } from "@/integrations/supabase/client";
import type { PlanTier } from "@/lib/tier-policy";

export const REVENUECAT_PRODUCT_IDS = {
  exec: "intentus_executive_monthly",
  premium: "intentus_premium_monthly",
  coach: "intentus_coach_monthly",
} as const;

export const REVENUECAT_ENTITLEMENTS = {
  exec: "exec",
  premium: "premium",
  coach: "coach",
} as const;

let configuredUserId: string | null = null;

export function isNativeRevenueCatAvailable() {
  return Capacitor.isNativePlatform();
}

export async function configureRevenueCat(userId: string) {
  if (!isNativeRevenueCatAvailable()) return false;
  if (configuredUserId === userId) return true;

  const apiKey = import.meta.env.VITE_REVENUECAT_IOS_API_KEY as string | undefined;
  if (!apiKey) {
    throw new Error("RevenueCat iOS API key is not configured.");
  }

  await Purchases.setLogLevel({ level: import.meta.env.DEV ? LOG_LEVEL.DEBUG : LOG_LEVEL.INFO });
  await Purchases.configure({ apiKey, appUserID: userId });
  configuredUserId = userId;
  return true;
}

export function getPlanTierFromCustomerInfo(customerInfo: CustomerInfo): PlanTier | null {
  const active = customerInfo.entitlements.active;
  if (active[REVENUECAT_ENTITLEMENTS.coach]?.isActive) return "coach";
  if (active[REVENUECAT_ENTITLEMENTS.premium]?.isActive) return "premium";
  // Accept legacy "pro" entitlement as well (maps to "exec")
  if (active[REVENUECAT_ENTITLEMENTS.exec]?.isActive || active["pro"]?.isActive) return "exec";
  return null;
}

export async function syncSupabasePlanTierFromCustomerInfo(userId: string, customerInfo: CustomerInfo) {
  const planTier = getPlanTierFromCustomerInfo(customerInfo);
  if (!planTier) return null;

  const { error } = await supabase
    .from("profiles")
    .update({ plan_tier: planTier })
    .eq("user_id", userId);

  if (error) throw error;
  return planTier;
}
