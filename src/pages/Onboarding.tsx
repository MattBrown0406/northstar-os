import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Compass, ArrowRight, Clock, MessageCircle, Calendar, CheckCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const TIMEZONES = [
  "America/New_York", "America/Chicago", "America/Denver", "America/Los_Angeles",
  "Europe/London", "Europe/Paris", "Europe/Berlin", "Asia/Tokyo", "Asia/Singapore",
  "Australia/Sydney", "Pacific/Auckland",
];

const TONES = [
  { value: "direct" as const, label: "Direct", desc: "No fluff. Call the issue clearly and fast.", icon: "🎯" },
  { value: "supportive" as const, label: "Supportive", desc: "Encouraging, grounded, and still honest.", icon: "🤝" },
  { value: "balanced" as const, label: "Balanced", desc: "Straightforward coaching with context-aware pressure.", icon: "⚖️" },
];

const CADENCES = [
  { value: "daily" as const, label: "Daily", desc: "Best for aggressive execution and fast correction" },
  { value: "every_other_day" as const, label: "Every other day", desc: "A steady accountability rhythm" },
  { value: "weekly" as const, label: "Weekly", desc: "Best for strategic reviews and leadership resets" },
];

const Onboarding = () => {
  const [step, setStep] = useState(0);
  const [timezone, setTimezone] = useState("America/New_York");
  const [tone, setTone] = useState<"direct" | "supportive" | "balanced">("balanced");
  const [cadence, setCadence] = useState<"daily" | "every_other_day" | "weekly">("daily");
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleComplete = async () => {
    if (!user) return;
    setLoading(true);
    const { error } = await supabase
      .from("profiles")
      .update({
        timezone,
        coaching_tone: tone,
        check_in_cadence: cadence,
        onboarding_completed: true,
      })
      .eq("user_id", user.id);
    setLoading(false);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      navigate("/audit");
    }
  };

  const steps = [
    <div key="welcome" className="text-center space-y-6">
      <div className="inline-flex bg-gradient-primary rounded-2xl p-4">
        <Compass className="h-12 w-12 text-primary-foreground" />
      </div>
      <h1 className="font-heading text-3xl font-bold text-foreground">Welcome to Intentus</h1>
      <p className="text-muted-foreground max-w-md mx-auto">
        You are about to audit how you actually operate, identify the metrics that matter most, and set up the coaching rhythm that keeps your 90-day plan from slipping.
      </p>
      <p className="text-xs text-muted-foreground max-w-sm mx-auto">
        ⚠️ Intentus provides coaching and self-reflection tools. It is not medical advice or mental health treatment.
        If you are in crisis, contact local emergency services.
      </p>
      <Button variant="hero" size="lg" onClick={() => setStep(1)}>
        Let's go <ArrowRight className="ml-2 h-4 w-4" />
      </Button>
    </div>,

    <div key="timezone" className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="bg-primary/10 rounded-xl p-3"><Clock className="h-6 w-6 text-primary" /></div>
        <div>
          <h2 className="font-heading text-xl font-bold text-foreground">Your timezone</h2>
          <p className="text-sm text-muted-foreground">So your accountability cadence lands when it can actually help</p>
        </div>
      </div>
      <div className="grid gap-2">
        {TIMEZONES.map((tz) => (
          <button
            key={tz}
            onClick={() => setTimezone(tz)}
            className={`text-left px-4 py-3 rounded-xl border transition-all ${
              timezone === tz
                ? "border-primary bg-primary/5 text-foreground"
                : "border-border text-muted-foreground hover:border-primary/50"
            }`}
          >
            {tz.replace(/_/g, " ")}
          </button>
        ))}
      </div>
      <Button variant="hero" className="w-full" onClick={() => setStep(2)}>
        Continue <ArrowRight className="ml-2 h-4 w-4" />
      </Button>
    </div>,

    <div key="tone" className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="bg-primary/10 rounded-xl p-3"><MessageCircle className="h-6 w-6 text-primary" /></div>
        <div>
          <h2 className="font-heading text-xl font-bold text-foreground">Coaching style</h2>
          <p className="text-sm text-muted-foreground">How should Intentus deliver feedback when you are off track?</p>
        </div>
      </div>
      <div className="grid gap-3">
        {TONES.map((t) => (
          <button
            key={t.value}
            onClick={() => setTone(t.value)}
            className={`text-left p-4 rounded-xl border transition-all ${
              tone === t.value
                ? "border-primary bg-primary/5"
                : "border-border hover:border-primary/50"
            }`}
          >
            <div className="flex items-center gap-3">
              <span className="text-2xl">{t.icon}</span>
              <div>
                <p className="font-semibold text-foreground">{t.label}</p>
                <p className="text-sm text-muted-foreground">{t.desc}</p>
              </div>
            </div>
          </button>
        ))}
      </div>
      <Button variant="hero" className="w-full" onClick={() => setStep(3)}>
        Continue <ArrowRight className="ml-2 h-4 w-4" />
      </Button>
    </div>,

    <div key="cadence" className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="bg-primary/10 rounded-xl p-3"><Calendar className="h-6 w-6 text-primary" /></div>
        <div>
          <h2 className="font-heading text-xl font-bold text-foreground">Check-in cadence</h2>
          <p className="text-sm text-muted-foreground">Choose the rhythm for reviewing adherence, drift, and key metrics</p>
        </div>
      </div>
      <div className="grid gap-3">
        {CADENCES.map((c) => (
          <button
            key={c.value}
            onClick={() => setCadence(c.value)}
            className={`text-left p-4 rounded-xl border transition-all ${
              cadence === c.value
                ? "border-primary bg-primary/5"
                : "border-border hover:border-primary/50"
            }`}
          >
            <p className="font-semibold text-foreground">{c.label}</p>
            <p className="text-sm text-muted-foreground">{c.desc}</p>
          </button>
        ))}
      </div>
      <Button variant="hero" className="w-full" onClick={handleComplete} disabled={loading}>
        {loading ? "Saving..." : <>
          Start my assessment <CheckCircle className="ml-2 h-4 w-4" />
        </>}
      </Button>
    </div>,
  ];

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        {step > 0 && (
          <div className="flex gap-1 mb-8">
            {[1, 2, 3].map((s) => (
              <div
                key={s}
                className={`h-1 flex-1 rounded-full transition-all ${
                  s <= step ? "bg-primary" : "bg-border"
                }`}
              />
            ))}
          </div>
        )}
        {steps[step]}
      </div>
    </div>
  );
};

export default Onboarding;
