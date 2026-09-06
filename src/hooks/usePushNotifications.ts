import { useEffect } from "react";
import { Capacitor } from "@capacitor/core";
import { supabase } from "@/integrations/supabase/client";
import { useAuth, registerSignOutCleanup, bounded } from "@/contexts/AuthContext";

export function usePushNotifications() {
  const { user } = useAuth();
  useEffect(() => {
    if (!user || !Capacitor.isNativePlatform()) return;
    let active = true;
    const listeners: { remove: () => Promise<void> }[] = [];
    const writes = new Set<Promise<void>>();
    const tokens = new Set<string>();
    const storageKey = `intentus:push-token:${user.id}`;
    try { const token = localStorage.getItem(storageKey); if (token) tokens.add(token); } catch { /* memory fallback */ }
    const stopListeners = async () => { await Promise.all(listeners.splice(0).map(l => l.remove())); };
    const removeCleanup = registerSignOutCleanup(async id => {
      if (id !== user.id) return;
      active = false;
      await setup;
      await stopListeners();
      await Promise.all([...writes]);
      for (const token of tokens) {
        const { error } = await bounded(supabase.from("push_tokens").delete().eq("user_id", id).eq("token", token));
        if (error) throw error;
      }
      tokens.clear();
      try { localStorage.removeItem(storageKey); } catch { /* already revoked */ }
    });
    const setup = (async () => {
      try {
        const { PushNotifications } = await import("@capacitor/push-notifications");
        if (!active) return;
        let { receive } = await PushNotifications.checkPermissions();
        if (receive === "prompt" || receive === "prompt-with-rationale") ({ receive } = await PushNotifications.requestPermissions());
        if (!active || receive !== "granted") return;
        const listener = await PushNotifications.addListener("registration", token => {
          if (!active) return;
          tokens.add(token.value);
          try { localStorage.setItem(storageKey, token.value); } catch { /* memory fallback */ }
          const write = (async () => {
            const { error } = await bounded(supabase.from("push_tokens").upsert({ user_id: user.id, token: token.value, platform: Capacitor.getPlatform() }, { onConflict: "user_id,token" }));
            if (error) console.error("Push token persistence failed");
          })().catch(() => { console.error("Push token persistence failed"); });
          writes.add(write); void write.finally(() => writes.delete(write));
        });
        if (!active) { await listener.remove(); return; }
        listeners.push(listener);
        const errors = await PushNotifications.addListener("registrationError", () => console.error("Push registration failed"));
        if (!active) { await errors.remove(); return; }
        listeners.push(errors);
        await PushNotifications.register();
      } catch { console.error("Push initialization failed"); }
    })();
    return () => {
      active = false;
      // Keep cleanup registered until outstanding callbacks settle. The
      // pre-signout path above is authoritative; this is listener teardown.
      void setup.then(stopListeners).finally(removeCleanup).catch(() => undefined);
    };
  }, [user?.id]);
}
