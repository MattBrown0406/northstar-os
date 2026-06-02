import { useEffect, useState } from "react";
import { Navigate, useNavigate, useSearchParams } from "react-router-dom";
import { Capacitor } from "@capacitor/core";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { brandLogo as logo } from "@/lib/brand";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import Seo from "@/components/seo/Seo";

const Auth = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [loading, setLoading] = useState(false);
  const [showReset, setShowReset] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const inviteCode = searchParams.get("invite");
  const showAppReviewDemo = Capacitor.isNativePlatform() || searchParams.get("review") === "1";

  useEffect(() => {
    if (inviteCode) setIsLogin(false);
  }, [inviteCode]);

  if (user) return <Navigate to="/onboarding" replace />;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    if (showReset) {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      setLoading(false);
      if (error) {
        toast({ title: "Error", description: error.message, variant: "destructive" });
      } else {
        toast({ title: "Check your email", description: "We sent you a password reset link." });
        setShowReset(false);
      }
      return;
    }

    if (isLogin) {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      setLoading(false);
      if (error) {
        toast({ title: "Login failed", description: error.message, variant: "destructive" });
      } else {
        navigate("/dashboard");
      }
    } else {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { display_name: displayName, invite_code: inviteCode || undefined },
          emailRedirectTo: window.location.origin,
        },
      });
      setLoading(false);
      if (error) {
        toast({ title: "Signup failed", description: error.message, variant: "destructive" });
      } else {
        if (inviteCode && data.user) {
          try {
            await supabase.functions.invoke("process-coach-invite", {
              body: { invite_code: inviteCode, client_user_id: data.user.id },
            });
          } catch (err) {
            console.error("Failed to process coach invite:", err);
            toast({
              title: "Coach link failed",
              description:
                "Your account was created but we could not link your coach. Contact your coach for a new invite link.",
              variant: "destructive",
            });
          }
        }

        toast({
          title: "Check your email",
          description: "We sent you a confirmation link. Please verify your email to continue.",
        });
      }
    }
  };

  return (
    <>
      <Seo
        title={showReset ? "Reset your password" : isLogin ? "Log in" : "Create your account"}
        description="Secure access for Intentus members. Log in, create an account, or request a password reset."
        path="/auth"
        noindex
      />
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="mb-4 flex items-center justify-center">
            <img src={logo} alt="Intentus" className="h-48 w-auto" />
          </div>

          {inviteCode && !isLogin && (
            <div className="mb-4 rounded-xl border border-primary/20 bg-primary/10 p-4 text-center">
              <p className="text-sm font-medium text-primary">You've been invited by a coach. Create your account to get started.</p>
            </div>
          )}

          <div className="rounded-2xl border border-border bg-card p-8 shadow-medium">
            <h2 className="mb-1 text-center font-heading text-xl font-bold text-foreground">
              {showReset ? "Reset password" : isLogin ? "Welcome back" : "Create your Intentus account"}
            </h2>
            <p className="mb-6 text-center text-sm text-muted-foreground">
              {showReset
                ? "Enter your email and we'll send you a reset link"
                : isLogin
                ? "Sign in to review your plan, metrics, and check-ins"
                : "Start your operating audit and build your 90-day plan"}
            </p>

            <form onSubmit={handleSubmit} className="space-y-4">
              {!isLogin && !showReset && (
                <div>
                  <Label htmlFor="name">Display name</Label>
                  <Input id="name" type="text" value={displayName} onChange={(e) => setDisplayName(e.target.value)} placeholder="Your name" required />
                </div>
              )}
              <div>
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" required />
              </div>
              {!showReset && (
                <div>
                  <Label htmlFor="password">Password</Label>
                  <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" required minLength={6} />
                </div>
              )}
              <Button type="submit" variant="hero" className="w-full" disabled={loading}>
                {loading ? "Loading..." : showReset ? "Send reset link" : isLogin ? "Sign in" : "Create account"}
              </Button>
            </form>

            <div className="mt-4 space-y-2 text-center">
              {showAppReviewDemo && !showReset && (
                <Button type="button" variant="outline" className="w-full" onClick={() => navigate("/review-demo")}>
                  Continue with App Review Demo
                </Button>
              )}
              {!showReset && isLogin && (
                <button type="button" onClick={() => setShowReset(true)} className="text-sm text-primary hover:underline">
                  Forgot password?
                </button>
              )}
              <p className="text-sm text-muted-foreground">
                {showReset ? (
                  <button type="button" onClick={() => setShowReset(false)} className="text-primary hover:underline">
                    Back to sign in
                  </button>
                ) : isLogin ? (
                  <>
                    Don't have an account? {" "}
                    <button type="button" onClick={() => setIsLogin(false)} className="text-primary hover:underline">
                      Sign up
                    </button>
                  </>
                ) : (
                  <>
                    Already have an account? {" "}
                    <button type="button" onClick={() => setIsLogin(true)} className="text-primary hover:underline">
                      Sign in
                    </button>
                  </>
                )}
              </p>
            </div>
          </div>

          <p className="mt-6 text-center text-xs text-muted-foreground">
            Intentus provides coaching and self-reflection tools. It is not medical advice or mental health treatment.
          </p>
        </div>
      </div>
    </>
  );
};

export default Auth;
