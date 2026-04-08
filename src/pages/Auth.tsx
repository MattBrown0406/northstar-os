import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Compass } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { Navigate } from "react-router-dom";

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

  // If there's an invite code, default to signup mode
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
        // If invite code is present and user is confirmed (auto-confirm), process the link
        if (inviteCode && data.user) {
          try {
            await supabase.functions.invoke("process-coach-invite", {
              body: { invite_code: inviteCode, client_user_id: data.user.id },
            });
          } catch (e) {
            console.error("Failed to process coach invite:", e);
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
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="flex items-center justify-center gap-2 mb-8">
          <div className="bg-gradient-primary rounded-lg p-2">
            <Compass className="h-6 w-6 text-primary-foreground" />
          </div>
          <span className="font-heading text-2xl font-bold text-foreground">Intentus</span>
        </div>

        {inviteCode && !isLogin && (
          <div className="bg-primary/10 border border-primary/20 rounded-xl p-4 mb-4 text-center">
            <p className="text-sm text-primary font-medium">You've been invited by a coach! Create your account to get started.</p>
          </div>
        )}

        <div className="bg-card rounded-2xl shadow-medium p-8 border border-border">
          <h2 className="font-heading text-xl font-bold text-foreground mb-1 text-center">
            {showReset ? "Reset password" : isLogin ? "Welcome back" : "Create your Intentus account"}
          </h2>
          <p className="text-sm text-muted-foreground text-center mb-6">
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
                <Input
                  id="name"
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="Your name"
                  required
                />
              </div>
            )}
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
              />
            </div>
            {!showReset && (
              <div>
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  minLength={6}
                />
              </div>
            )}
            <Button type="submit" variant="hero" className="w-full" disabled={loading}>
              {loading
                ? "Loading..."
                : showReset
                ? "Send reset link"
                : isLogin
                ? "Sign in"
                : "Create account"}
            </Button>
          </form>

          <div className="mt-4 text-center space-y-2">
            {!showReset && isLogin && (
              <button
                onClick={() => setShowReset(true)}
                className="text-sm text-primary hover:underline"
              >
                Forgot password?
              </button>
            )}
            <p className="text-sm text-muted-foreground">
              {showReset ? (
                <button onClick={() => setShowReset(false)} className="text-primary hover:underline">
                  Back to sign in
                </button>
              ) : isLogin ? (
                <>
                  Don't have an account?{" "}
                  <button onClick={() => setIsLogin(false)} className="text-primary hover:underline">
                    Sign up
                  </button>
                </>
              ) : (
                <>
                  Already have an account?{" "}
                  <button onClick={() => setIsLogin(true)} className="text-primary hover:underline">
                    Sign in
                  </button>
                </>
              )}
            </p>
          </div>
        </div>

        <p className="text-xs text-muted-foreground text-center mt-6">
          Intentus provides coaching and self-reflection tools. It is not medical advice or mental health treatment.
        </p>
      </div>
    </div>
  );
};

export default Auth;
