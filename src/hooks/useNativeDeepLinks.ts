import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Capacitor } from "@capacitor/core";

/**
 * Listens for native deep-link / push-tap URL events and routes within the SPA.
 * Supports payloads where the URL contains `route=/check-in` (e.g. push notification
 * tap data forwarded as a custom URL) and routes accordingly.
 */
export function useNativeDeepLinks() {
  const navigate = useNavigate();

  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;

    let listener: { remove: () => Promise<void> } | undefined;

    (async () => {
      try {
        const { App: CapApp } = await import("@capacitor/app");
        listener = await CapApp.addListener("appUrlOpen", (event) => {
          try {
            const url = new URL(event.url);
            // Prefer explicit route query param (used by push notification data)
            const explicit = url.searchParams.get("route");
            if (explicit) {
              navigate(explicit);
              return;
            }
            // Fallback: use the path of the deep link if it matches a known route
            if (url.pathname && url.pathname !== "/") navigate(url.pathname + url.search);
          } catch {
            // Some deep links are not parsable URLs — ignore safely
          }
        });
      } catch (e) {
        console.error("useNativeDeepLinks error:", e);
      }
    })();

    return () => {
      listener?.remove().catch(() => undefined);
    };
  }, [navigate]);
}
