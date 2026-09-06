import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Capacitor } from "@capacitor/core";
import { supabase } from "@/integrations/supabase/client";
import { bounded, safeDestination } from "@/contexts/AuthContext";

let recoveryUser: string | null = null;
export function recoveryReadyFor(id: string | undefined) { return !!id && recoveryUser === id; }
export function clearRecovery() { recoveryUser = null; }
export function markRecovery(id: string) { recoveryUser = id; }

export function useNativeDeepLinks() {
  const navigate = useNavigate();
  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;
    let active = true;
    let listener: { remove: () => Promise<void> } | undefined;
    const handled = new Set<string>();
    const route = async (event: { url: string }) => {
      if (!active || handled.has(event.url)) return;
      try {
        if (event.url.includes("\\")) return;
        const url = new URL(event.url);
        const owned = (url.protocol === "intentus:" && url.hostname === "app") ||
          (url.protocol === "https:" && url.hostname === "intentusai.com" && !url.port);
        if (!owned || url.username || url.password) return;
        const target = safeDestination(url.searchParams.get("route") ?? (url.pathname + url.search + url.hash), "");
        if (!target) return;
        handled.add(event.url);
        const params = new URLSearchParams(url.hash.slice(1));
        const code = url.searchParams.get("code");
        const access = params.get("access_token"), refresh = params.get("refresh_token");
        const callback = url.pathname === "/reset-password" || url.pathname === "/auth";
        if (callback && (code || access || refresh || params.has("error") || url.searchParams.has("error"))) {
          clearRecovery();
          if (params.has("error") || url.searchParams.has("error") || (!code && (!access || !refresh))) throw new Error("Invalid callback");
          const { data, error } = await bounded(code ? supabase.auth.exchangeCodeForSession(code) : supabase.auth.setSession({ access_token: access!, refresh_token: refresh! }));
          if (error || !data.session) throw error || new Error("Expired callback");
          if (!active) return;
          if (url.pathname === "/reset-password") markRecovery(data.session.user.id);
          navigate(url.pathname, { replace: true });
        } else if (target !== "/") navigate(target);
      } catch {
        if (active) navigate("/reset-password?error=expired", { replace: true });
      }
    };
    void (async () => {
      try {
        const { App } = await import("@capacitor/app");
        if (!active) return;
        listener = await App.addListener("appUrlOpen", route);
        if (!active) { await listener.remove(); return; }
        const launch = await App.getLaunchUrl();
        if (launch) await route(launch);
      } catch { console.error("Native deep-link initialization failed"); }
    })();
    return () => { active = false; listener?.remove().catch(() => undefined); };
  }, [navigate]);
}
