import { useEffect } from "react";
import { Capacitor } from "@capacitor/core";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

/**
 * Registers the device for push notifications on native iOS/Android and
 * upserts the resulting token to `push_tokens` for the signed-in user.
 * Safe no-op in the browser / web build.
 */
export function usePushNotifications() {
  const { user } = useAuth();

  useEffect(() => {
    if (!user) return;
    if (!Capacitor.isNativePlatform()) return;

    let registrationListener: { remove: () => Promise<void> } | undefined;
    let errorListener: { remove: () => Promise<void> } | undefined;

    const register = async () => {
      try {
        const { PushNotifications } = await import("@capacitor/push-notifications");

        const perm = await PushNotifications.checkPermissions();
        let status = perm.receive;
        if (status === "prompt" || status === "prompt-with-rationale") {
          const req = await PushNotifications.requestPermissions();
          status = req.receive;
        }
        if (status !== "granted") return;

        registrationListener = await PushNotifications.addListener("registration", async (token) => {
          try {
            const platform = Capacitor.getPlatform(); // 'ios' | 'android' | 'web'
            await supabase
              .from("push_tokens")
              .upsert(
                { user_id: user.id, token: token.value, platform },
                { onConflict: "user_id,token" },
              );
          } catch (e) {
            console.error("Failed to save push token:", e);
          }
        });

        errorListener = await PushNotifications.addListener("registrationError", (err) => {
          console.error("Push registration error:", err);
        });

        await PushNotifications.register();
      } catch (e) {
        console.error("usePushNotifications error:", e);
      }
    };

    register();

    return () => {
      registrationListener?.remove().catch(() => undefined);
      errorListener?.remove().catch(() => undefined);
    };
  }, [user]);
}
