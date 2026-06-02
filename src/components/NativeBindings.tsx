import { usePushNotifications } from "@/hooks/usePushNotifications";
import { useNativeDeepLinks } from "@/hooks/useNativeDeepLinks";

/**
 * Mounted inside <BrowserRouter> + <AuthProvider> so hooks can use auth + navigate.
 * Activates push notifications (native only) and native deep-link routing.
 * Renders nothing.
 */
const NativeBindings = () => {
  usePushNotifications();
  useNativeDeepLinks();
  return null;
};

export default NativeBindings;
