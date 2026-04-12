import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import AppBreadcrumb from "@/components/AppBreadcrumb";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Save, Settings as SettingsIcon, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const TIMEZONES = [
  "America/New_York",
  "America/Chicago",
  "America/Denver",
  "America/Los_Angeles",
  "Europe/London",
  "Europe/Paris",
  "Europe/Berlin",
  "Asia/Tokyo",
  "Asia/Singapore",
  "Australia/Sydney",
  "Pacific/Auckland",
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
}

const Settings = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [displayName, setDisplayName] = useState("");
  const [tone, setTone] = useState<"direct" | "supportive" | "balanced">("balanced");
  const [cadence, setCadence] = useState<"daily" | "every_other_day" | "weekly">("daily");
  const [timezone, setTimezone] = useState("America/New_York");

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("display_name, coaching_tone, check_in_cadence, timezone")
        .eq("user_id", user.id)
        .single();

      if (!error && data) {
        const profile = data as ProfileData;
        setDisplayName(profile.display_name ?? "");
        setTone(profile.coaching_tone ?? "balanced");
        setCadence(profile.check_in_cadence ?? "daily");
        setTimezone(profile.timezone ?? "America/New_York");
      }
      setLoading(false);
    };
    load();
  }, [user]);

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
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate("/dashboard")}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div className="flex items-center gap-2">
              <SettingsIcon className="h-4 w-4 text-muted-foreground" />
              <span className="font-heading text-xl font-extrabold tracking-tight text-foreground uppercase">
                Intentus
              </span>
            </div>
          </div>
          <Button variant="hero" size="sm" onClick={handleSave} disabled={saving}>
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 mr-1 animate-spin" /> Saving…
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-1" /> Save changes
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
