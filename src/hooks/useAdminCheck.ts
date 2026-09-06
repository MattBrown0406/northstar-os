import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export function useAdminCheck() {
  const { user } = useAuth();
  const userId = user?.id;
  const [result, setResult] = useState<{ userId?: string; isAdmin: boolean; loading: boolean }>({ isAdmin: false, loading: true });
  useEffect(() => {
    let active = true;
    setResult({ userId, isAdmin: false, loading: !!userId });
    if (!userId) return;
    const check = async () => {
      try {
        const { data, error } = await supabase.from("user_roles").select("role").eq("user_id", userId).eq("role", "admin").maybeSingle();
        if (active) setResult({ userId, isAdmin: !error && !!data, loading: false });
      } catch {
        if (active) setResult({ userId, isAdmin: false, loading: false });
      }
    };
    void check();
    return () => { active = false; };
  }, [userId]);
  return result.userId === userId ? { isAdmin: result.isAdmin, loading: result.loading } : { isAdmin: false, loading: !!userId };
}
