import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Purchases } from "@revenuecat/purchases-capacitor";
import AppBreadcrumb from "@/components/AppBreadcrumb";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Save, Settings as SettingsIcon, Loader2, ExternalLink, Trash2, AlertTriangle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { configureRevenueCat, isNativeRevenueCatAvailable } from "@/lib/revenuecat";
import { TIMEZONE_GROUPS, formatTimezoneLabel } from "@/lib/timezones";

type Gender = "male" | "female" | "non_binary" | "prefer_not_to_say";

const GENDER_OPTIONS: { value: Gender; label: string }[] = [
  { value: "male", label: "He/him" },
  { value: "female", label: "She/her" },
  { value: "non_binary", label: "They/them" },
  { value: "prefer_not_to_say", label: "Prefer not to say" },
];

const TONES: { value: "direct" | "supportive" | "balanced"; label: string; desc: string; icon: string }[] = [
  {
    value: "direct",
    label: "Direct",
    desc: "Clear, firm, and willing to name avoidance without dressing it up.",
    icon: "🎯",
  },
  {
    value: "supportive",
    label: "Supportive",
    desc: "Warm, grounded, emotionally intelligent, and still unwilling to let drift slide.",
    icon: "🤝",
  },
  {
    value: "balanced",
    label: "Balanced",
    desc: "Direct because the outcome matters, warm because you matter.",
    icon: "⚖️",
  },
];

const CADENCES: { value: "daily" | "every_other_day" | "weekly"; label: string; desc: string }[] = [
  {
    value: "daily",
    label: "Daily",
    desc: "Best for disciplined execution and fast drift correction",
  },
  {
    value: "every_other_day",
    label: "Every other day",
    desc: "A steady operating rhythm with room to adjust",
  },
  {
    value: "weekly",
    label: "Weekly",
    desc: "Best for strategic review, honest reflection, and resets",
  },
];

interface ProfileData {
  display_name: string | null;
  coaching_tone: "direct" | "supportive" | "balanced" | null;
  check_in_cadence: "daily" | "every_other_day" | "weekly" | null;
  timezone: string | null;
  gender: Gender | null;
}

const Settings = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [displayName, setDisplayName] = useState("");
  const [tone, setTone] = useState<"direct" | "supportive" | "balanced">("balanced");
  const [cadence, setCadence] = useState<"daily" | "every_other_day" | "weekly">("daily");
  const [timezone, setTimezone] = useState("America/New_York");
  const [gender, setGender] = useState<Gender>("prefer_not_to_say");
  const [deleting, setDeleting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("display_name, coaching_tone, check_in_cadence, timezone, gender")
        .eq("user_id", user.id)
        .single();

      if (!error && data) {
        const profile = data as ProfileData;
        setDisplayName(profile.display_name ?? "");
        setTone(profile.coaching_tone ?? "balanced");
        setCadence(profile.check_in_cadence ?? "daily");
        setTimezone(profile.timezone ?? "America/New_York");
        setGender(profile.gender ?? "prefer_not_to_say");
      }
      setLoading(false);
    };
    load();
  }, [user]);

  useEffect(() => {
    if (!user || loading) return;
    const checkReminder = async () => {
      const { data: lastCheckin } = await supabase
        .from('check_ins')
        .select('created_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();
      if (!lastCheckin) return;
      const lastDate = new Date(lastCheckin.created_at);
      const now = new Date();
      const daysDiff = Math.floor((now.getTime() - lastDate.getTime()) / 86400000);
      const threshold = cadence === 'weekly' ? 7 : cadence === 'every_other_day' ? 2 : 1;
      if (daysDiff >= threshold) {
        toast({
          title: 'Check-in reminder',
          description: `You're due for a check-in. Your last one was ${daysDiff} day${daysDiff !== 1 ? 's' : ''} ago.`,
        });
      }
    };
    checkReminder();
  }, [user, loading]);

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    const { error } = await supabase
      .from("profiles")
      .update({
        display_name: displayName.trim() || null,
        coaching_tone: tone,
        check_in_cadence: cadence,
        timezone,
      })
      .eq("user_id", user.id);

    setSaving(false);

    if (error) {
      toast({ title: "Error saving settings", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Settings saved", description: "Your profile has been updated." });
    }
  };

  const handleManageSubscription = async () => {
    let managementUrl = "https://apps.apple.com/account/subscriptions";

    if (user && isNativeRevenueCatAvailable()) {
      try {
        await configureRevenueCat(user.id);
        const { customerInfo } = await Purchases.getCustomerInfo();
        managementUrl = customerInfo.managementURL || managementUrl;
      } catch {
        // Fall back to Apple's subscription management URL.
      }
    }

    window.open(managementUrl, "_blank", "noopener,noreferrer");
  };

  const handleDeleteAccount = async () => {
    if (!user || !confirmDelete) return;
    setDeleting(true);
    try {
      const { error } = await supabase.functions.invoke("delete-account", { body: {} });
      if (error) throw error;
      await signOut();
      toast({ title: "Account deleted", description: "Your Intentus account has been deleted." });
      navigate("/", { replace: true });
    } catch (error) {
      const message = error instanceof Error ? error.message : "We could not delete your account. Please try again.";
      toast({ title: "Account deletion failed", description: message, variant: "destructive" });
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Nav */}
      <nav className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto flex items-center justify-between h-14 px-4">
          <div className="flex items-center gap-2 sm:gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate("/dashboard")}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div className="flex items-center gap-2">
              <SettingsIcon className="h-4 w-4 text-muted-foreground" />
              <span className="font-heading text-lg font-extrabold tracking-tight text-foreground uppercase sm:text-xl">
                Intentus
              </span>
            </div>
          </div>
          <Button variant="hero" size="sm" onClick={handleSave} disabled={saving} className="px-3 text-xs sm:text-sm sm:px-4">
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 mr-1 animate-spin" /> <span className="hidden sm:inline">Saving…</span>
              </>
            ) : (
              <>
                <Save className="h-4 w-4 sm:mr-1" /> <span className="hidden sm:inline">Save changes</span>
              </>
            )}
          </Button>
        </div>
      </nav>

      <AppBreadcrumb />

      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <div className="mb-8">
          <h1 className="font-heading text-2xl font-bold text-foreground">Settings</h1>
          <p className="text-muted-foreground">
            Update how Intentus addresses you and calibrate your operating rhythm.
          </p>
        </div>

        <div className="space-y-8">
          {/* Display Name */}
          <div className="bg-card rounded-2xl border border-border p-6 space-y-4">
            <div>
              <h2 className="font-heading font-bold text-foreground mb-1">Display name</h2>
              <p className="text-sm text-muted-foreground">
                This is the name your AI coach uses when addressing you during check-ins and coaching sessions.
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="display-name">Name</Label>
              <Input
                id="display-name"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="e.g. Alex"
                className="max-w-xs"
              />
            </div>
          </div>

          {/* Coaching Tone */}
          <div className="bg-card rounded-2xl border border-border p-6 space-y-4">
            <div>
              <h2 className="font-heading font-bold text-foreground mb-1">Coaching tone</h2>
              <p className="text-sm text-muted-foreground">
                How you want your AI coach to communicate during check-ins and accountability sessions.
              </p>
            </div>
            <div className="space-y-3">
              {TONES.map((t) => (
                <button
                  key={t.value}
                  type="button"
                  onClick={() => setTone(t.value)}
                  className={`w-full flex items-start gap-4 rounded-xl border px-5 py-4 text-left transition-all ${
                    tone === t.value
                      ? "border-primary bg-primary/5"
                      : "border-border bg-background hover:border-primary/30"
                  }`}
                >
                  <span className="text-2xl shrink-0 mt-0.5">{t.icon}</span>
                  <div>
                    <p className="font-semibold text-foreground">{t.label}</p>
                    <p className="text-sm text-muted-foreground mt-0.5">{t.desc}</p>
                  </div>
                  {tone === t.value && (
                    <span className="ml-auto shrink-0 w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                      <span className="w-2 h-2 rounded-full bg-primary-foreground" />
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Check-in Cadence */}
          <div className="bg-card rounded-2xl border border-border p-6 space-y-4">
            <div>
              <h2 className="font-heading font-bold text-foreground mb-1">Check-in cadence</h2>
              <p className="text-sm text-muted-foreground">
                How often you want to check in. Tighter loops catch drift faster; looser loops allow deeper reflection.
              </p>
            </div>
            <div className="space-y-3">
              {CADENCES.map((c) => (
                <button
                  key={c.value}
                  type="button"
                  onClick={() => setCadence(c.value)}
                  className={`w-full flex items-center justify-between rounded-xl border px-5 py-4 text-left transition-all ${
                    cadence === c.value
                      ? "border-primary bg-primary/5"
                      : "border-border bg-background hover:border-primary/30"
                  }`}
                >
                  <div>
                    <p className="font-semibold text-foreground">{c.label}</p>
                    <p className="text-sm text-muted-foreground mt-0.5">{c.desc}</p>
                  </div>
                  {cadence === c.value && (
                    <span className="ml-4 shrink-0 w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                      <span className="w-2 h-2 rounded-full bg-primary-foreground" />
                    </span>
                  )}
                </button>
              ))}
            </div>
            <p className="text-xs text-muted-foreground">
              Intentus checks your cadence each time you open Settings and reminds you when you're overdue.
            </p>
          </div>

          {/* Timezone */}
          <div className="bg-card rounded-2xl border border-border p-6 space-y-4">
            <div>
              <h2 className="font-heading font-bold text-foreground mb-1">Timezone</h2>
              <p className="text-sm text-muted-foreground">
                Used to schedule check-in reminders and timestamp your operating history accurately.
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="timezone">Timezone</Label>
              <select
                id="timezone"
                value={timezone}
                onChange={(e) => setTimezone(e.target.value)}
                className="flex h-10 w-full max-w-xs rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              >
                {TIMEZONES.map((tz) => (
                  <option key={tz} value={tz}>
                    {tz.replace("_", " ")}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Subscription */}
          <div className="bg-card rounded-2xl border border-border p-6 space-y-4">
            <div>
              <h2 className="font-heading font-bold text-foreground mb-1">Subscription</h2>
              <p className="text-sm text-muted-foreground">
                Manage or cancel your Apple subscription through your Apple ID subscription settings.
              </p>
            </div>
            <Button variant="outline" onClick={handleManageSubscription}>
              <ExternalLink className="h-4 w-4 mr-2" /> Manage subscription
            </Button>
          </div>

          {/* Account deletion */}
          <div className="bg-card rounded-2xl border border-destructive/30 p-6 space-y-4">
            <div className="flex items-start gap-3">
              <div className="mt-0.5 rounded-lg bg-destructive/10 p-2 text-destructive">
                <AlertTriangle className="h-4 w-4" />
              </div>
              <div>
                <h2 className="font-heading font-bold text-foreground mb-1">Delete account</h2>
                <p className="text-sm text-muted-foreground">
                  Permanently delete your Intentus account and associated app data. This cannot be undone. Active subscriptions must still be cancelled through your Apple ID subscription settings.
                </p>
              </div>
            </div>
            <label className="flex items-start gap-3 rounded-xl border border-border bg-background p-4 text-sm text-foreground">
              <input
                type="checkbox"
                checked={confirmDelete}
                onChange={(e) => setConfirmDelete(e.target.checked)}
                className="mt-1"
              />
              <span>I understand this will permanently delete my Intentus account and app data.</span>
            </label>
            <Button variant="destructive" onClick={handleDeleteAccount} disabled={!confirmDelete || deleting}>
              {deleting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" /> Deleting account...
                </>
              ) : (
                <>
                  <Trash2 className="h-4 w-4 mr-2" /> Delete account
                </>
              )}
            </Button>
          </div>

          {/* Save button (bottom) */}
          <div className="flex justify-end pb-8">
            <Button variant="hero" size="lg" onClick={handleSave} disabled={saving}>
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" /> Saving…
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" /> Save changes
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
