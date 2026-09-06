import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { brandLogo as logo } from "@/lib/brand";
import { useToast } from "@/hooks/use-toast";
import { bounded, useAuth } from "@/contexts/AuthContext";
import { recoveryReadyFor, markRecovery, clearRecovery } from "@/hooks/useNativeDeepLinks";
import Seo from "@/components/seo/Seo";

const ResetPassword = () => {
  const { user } = useAuth();
  const [ready, setReady] = useState(false);
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    let active = true;
    setReady(recoveryReadyFor(user?.id) && !window.location.search.includes("error="));
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "PASSWORD_RECOVERY" && session && active) { markRecovery(session.user.id); setReady(true); }
      if (event === "SIGNED_OUT" && active) { clearRecovery(); setReady(false); }
    });
    return () => { active = false; subscription.unsubscribe(); };
  }, [user?.id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ready || loading || !recoveryReadyFor(user?.id)) return;
    setLoading(true);
    try {
    const { error } = await bounded(supabase.auth.updateUser({ password }));
    setLoading(false);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Password updated", description: "You can now sign in with your new password." });
      clearRecovery();
      navigate("/dashboard");
    }
    } catch (error) { toast({ title: "Password update failed", description: error instanceof Error ? error.message : "Try a new recovery link.", variant: "destructive" }); }
    finally { setLoading(false); }
  };

  return (
    <>
      <Seo
        title="Reset your password"
        description="Set a new password for your Intentus account."
        path="/reset-password"
        noindex
      />
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="w-full max-w-md">
        <div className="flex items-center justify-center mb-8">
          <img src={logo} alt="Intentus" className="h-16 w-auto" />
        </div>
          <div className="bg-card rounded-2xl shadow-medium p-8 border border-border">
            <h2 className="font-heading text-xl font-bold text-foreground mb-4 text-center">Set new password</h2>
            {!ready && <p role="alert">Recovery link is missing, expired, or still being verified. Request a new link from sign in.</p>}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="password">New password</Label>
                <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" required minLength={6} />
              </div>
              <Button type="submit" variant="hero" className="w-full" disabled={loading || !ready}>
                {loading ? "Updating..." : "Update password"}
              </Button>
            </form>
          </div>
        </div>
      </div>
    </>
  );
};

export default ResetPassword;
