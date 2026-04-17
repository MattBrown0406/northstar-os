import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import AppBreadcrumb from "@/components/AppBreadcrumb";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Plus, X, ArrowRight, CheckCircle, MessageSquare, Loader2, RefreshCw, Wind } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { formatLensLabel, getBlockerPrompt, getCommitmentPrompt, getFocusPrompt, type IntentProfile } from "@/lib/intentus-architecture";
import { brandLogo as logo } from "@/lib/brand";
import {
  type WeeklyCommitment,
  getPreviousWeekCommitment,
  setWeeklyCommitment,
  recordCommitmentOutcome,
} from "@/lib/commitments";

const ScaleSelector = ({ value, onChange, label, emoji }: {
  value: number; onChange: (n: number) => void; label: string; emoji: string[];
}) => (
  <div className="space-y-4">
    <h3 className="font-heading text-lg font-bold text-foreground">{label}</h3>
    <div className="flex gap-1">
      {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
        <button
          key={n}
          onClick={() => onChange(n)}
          className={`flex-1 h-12 rounded-lg border text-sm font-medium transition-all ${
            n === value
              ? "bg-primary text-primary-foreground border-primary scale-110"
              : n <= value
              ? "bg-primary/10 border-primary/30 text-primary"
              : "border-border text-muted-foreground hover:border-primary/50"
          }`}
        >
          {n}
        </button>
      ))}
    </div>
    <p className="text-sm text-muted-foreground text-center">{emoji[Math.min(Math.floor(value / 3), 2)]}</p>
  </div>
);

const ListInput = ({ label, items, onAdd, onRemove, inputVal, setInputVal, placeholder }: {
  label: string; items: string[]; onAdd: () => void; onRemove: (index: number) => void;
  inputVal: string; setInputVal: (v: string) => void; placeholder: string;
}) => (
  <div className="space-y-4">
    <h3 className="font-heading text-lg font-bold text-foreground">{label}</h3>
    <div className="flex gap-2">
      <Input value={inputVal} onChange={(e) => setInputVal(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && onAdd()} placeholder={placeholder} className="flex-1" />
      <Button variant="outline" size="icon" onClick={onAdd}><Plus className="h-4 w-4" /></Button>
    </div>
    <ul className="space-y-2">
      {items.map((item, i) => (
        <li key={i} className="flex items-center gap-2 bg-card border border-border rounded-lg px-3 py-2 text-sm text-foreground">
          <span className="flex-1">{item}</span>
          <button onClick={() => onRemove(i)}><X className="h-4 w-4 text-muted-foreground hover:text-destructive" /></button>
        </li>
      ))}
    </ul>
  </div>
);

// ── Step 0: Commitment Callback ──────────────────────────────────────────────
const CommitmentCallbackStep = ({
  previousCommitment,
  callbackOutcome,
  setCallbackOutcome,
  callbackReflection,
  setCallbackReflection,
}: {
  previousCommitment: WeeklyCommitment;
  callbackOutcome: "yes" | "partially" | "no" | null;
  setCallbackOutcome: (v: "yes" | "partially" | "no") => void;
  callbackReflection: string;
  setCallbackReflection: (v: string) => void;
}) => (
  <div className="space-y-6">
    <div>
      <h3 className="font-heading text-lg font-bold text-foreground mb-1">Last week you committed to:</h3>
      <blockquote className="border-l-4 border-primary pl-4 py-2 bg-primary/5 rounded-r-lg text-foreground text-base italic">
        "{previousCommitment.commitment}"
      </blockquote>
    </div>

    <div className="space-y-3">
      <p className="text-sm font-medium text-foreground">Did this happen?</p>
      <div className="grid grid-cols-3 gap-3">
        {(["yes", "partially", "no"] as const).map((option) => (
          <button
            key={option}
            onClick={() => setCallbackOutcome(option)}
            className={`py-4 rounded-xl border-2 text-sm font-semibold capitalize transition-all ${
              callbackOutcome === option
                ? option === "yes"
                  ? "border-green-500 bg-green-500/10 text-green-700 dark:text-green-400"
                  : option === "partially"
                  ? "border-yellow-500 bg-yellow-500/10 text-yellow-700 dark:text-yellow-400"
                  : "border-destructive bg-destructive/10 text-destructive"
                : "border-border text-muted-foreground hover:border-primary/50"
            }`}
          >
            {option === "yes" ? "Yes" : option === "partially" ? "Partially" : "No"}
          </button>
        ))}
      </div>
    </div>

    {callbackOutcome && (
      <div className="space-y-2">
        <label className="text-sm text-muted-foreground">
          Anything worth noting? <span className="text-xs">(optional)</span>
        </label>
        <Input
          value={callbackReflection}
          onChange={(e) => setCallbackReflection(e.target.value)}
          placeholder="One line reflection..."
          className="text-sm"
        />
      </div>
    )}
  </div>
);

// ── Final Step: Set "The One Thing" ─────────────────────────────────────────
const OneThingStep = ({
  oneThing,
  setOneThing,
}: {
  oneThing: string;
  setOneThing: (v: string) => void;
}) => (
  <div className="space-y-4">
    <div>
      <h3 className="font-heading text-lg font-bold text-foreground">What's the one thing this week?</h3>
      <p className="text-sm text-muted-foreground mt-1">
        If you actually did this — and nothing else — it would make the most difference.
      </p>
    </div>
    <Textarea
      value={oneThing}
      onChange={(e) => setOneThing(e.target.value)}
      placeholder="This week I will..."
      className="min-h-[120px] text-sm resize-none"
    />
  </div>
);

// ── Main Component ───────────────────────────────────────────────────────────
const CheckIn = () => {
  // Step index: 0 = commitment callback (or skipped), 1–5 = original steps, 6 = one-thing
  const [step, setStep] = useState(0);
  const [mood, setMood] = useState(5);
  const [energy, setEnergy] = useState(5);
  const [wins, setWins] = useState<string[]>([]);
  const [blockers, setBlockers] = useState<string[]>([]);
  const [commitments, setCommitments] = useState<string[]>([]);
  const [inputVal, setInputVal] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [intentProfile, setIntentProfile] = useState<IntentProfile | null>(null);
  const [aiDebrief, setAiDebrief] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [showCenteringGuide, setShowCenteringGuide] = useState(false);
  const [showThinPrompt, setShowThinPrompt] = useState(false);

  // Commitment callback state
  const [previousCommitment, setPreviousCommitment] = useState<WeeklyCommitment | null>(null);
  const [callbackOutcome, setCallbackOutcome] = useState<"yes" | "partially" | "no" | null>(null);
  const [callbackReflection, setCallbackReflection] = useState("");
  const [hasPreviousCommitment, setHasPreviousCommitment] = useState<boolean | null>(null); // null = loading

  // One-thing state
  const [oneThing, setOneThing] = useState("");

  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    if (!user) return;
    const loadProfile = async () => {
      const { data } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", user.id)
        .single();
      if ((data as any)?.intent_profile) setIntentProfile((data as any).intent_profile as IntentProfile);
    };
    loadProfile();
  }, [user]);

  useEffect(() => {
    if (!user) return;
    const checkPrevious = async () => {
      const prev = await getPreviousWeekCommitment(user.id);
      if (prev) {
        setPreviousCommitment(prev);
        setHasPreviousCommitment(true);
      } else {
        setHasPreviousCommitment(false);
        // Skip step 0 — jump to step 1
        setStep(1);
      }
    };
    checkPrevious();
  }, [user]);

  const hasThinCheckIn = () => {
    const totalItems = wins.length + blockers.length + commitments.length;
    const totalWords = [...wins, ...blockers, ...commitments]
      .join(" ")
      .trim()
      .split(/\s+/)
      .filter(Boolean).length;
    return totalItems < 3 || totalWords < 12;
  };

  const addItem = (setter: typeof setWins) => {
    if (inputVal.trim()) {
      setter((prev) => [...prev, inputVal.trim()]);
      setInputVal("");
    }
  };

  const removeItem = (setter: typeof setWins, index: number) => {
    setter((prev) => prev.filter((_, i) => i !== index));
  };

  const streamDebrief = async () => {
    setAiLoading(true);
    try {
      const session = await supabase.auth.getSession();
      const token = session.data.session?.access_token;
      const resp = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/coaching-chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
          apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
        },
        body: JSON.stringify({ mode: "check-in-debrief", messages: [] }),
      });

      if (!resp.ok || !resp.body) {
        setAiLoading(false);
        return;
      }

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let fullText = "";

      while (true) {
        const { done: streamDone, value } = await reader.read();
        if (streamDone) break;
        buffer += decoder.decode(value, { stream: true });

        let newlineIndex: number;
        while ((newlineIndex = buffer.indexOf("\n")) !== -1) {
          let line = buffer.slice(0, newlineIndex);
          buffer = buffer.slice(newlineIndex + 1);
          if (line.endsWith("\r")) line = line.slice(0, -1);
          if (!line.startsWith("data: ")) continue;
          const jsonStr = line.slice(6).trim();
          if (jsonStr === "[DONE]") break;
          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content;
            if (content) {
              fullText += content;
              setAiDebrief(fullText);
            }
          } catch {}
        }
      }
    } catch (e) {
      console.error("Debrief error:", e);
    }
    setAiLoading(false);
  };

  const handleSubmit = async () => {
    if (!user) return;
    if (hasThinCheckIn() && !showThinPrompt) {
      setShowThinPrompt(true);
      return;
    }
    setShowThinPrompt(false);
    setLoading(true);

    // 1. Insert check-in
    const { data: checkInData, error } = await supabase.from("check_ins").insert({
      user_id: user.id,
      mood_score: mood,
      energy_score: energy,
      wins,
      blockers,
      commitments,
      drift_detected: mood <= 4 || energy <= 4,
    }).select().single();

    if (error) {
      setLoading(false);
      toast({ title: "Error", description: error.message, variant: "destructive" });
      return;
    }

    // 2. Record commitment callback if we had a previous commitment + outcome
    if (previousCommitment && callbackOutcome && checkInData) {
      try {
        // Update the commitment record with the outcome
        await recordCommitmentOutcome(previousCommitment.id, callbackOutcome, callbackReflection || undefined);

        // Also insert a commitment_callback record linking the check-in
        await supabase.from("commitment_callbacks").insert({
          user_id: user.id,
          check_in_id: checkInData.id,
          previous_commitment_id: previousCommitment.id,
          previous_commitment_text: previousCommitment.commitment,
          outcome: callbackOutcome,
        });
      } catch (cbErr) {
        console.error("Commitment callback error:", cbErr);
        // Non-fatal: proceed
      }
    }

    // 3. Save "one thing" commitment for this week
    if (oneThing.trim()) {
      try {
        await setWeeklyCommitment(user.id, oneThing.trim());
      } catch (otErr) {
        console.error("One thing save error:", otErr);
        // Non-fatal: proceed
      }
    }

    setLoading(false);
    setDone(true);
    streamDebrief();
  };

  const resetAndRetry = () => {
    setWins([]);
    setBlockers([]);
    setCommitments([]);
    setInputVal("");
    setMood(5);
    setEnergy(5);
    setStep(hasPreviousCommitment ? 0 : 1);
    setShowCenteringGuide(false);
  };

  // ── Loading state while checking previous commitment ──────────────────────
  if (hasPreviousCommitment === null) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (showCenteringGuide) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="w-full max-w-lg space-y-6">
          <div className="text-center space-y-3">
            <div className="inline-flex bg-primary/10 rounded-2xl p-4">
              <Wind className="h-12 w-12 text-primary" />
            </div>
            <h2 className="font-heading text-2xl font-bold text-foreground">Let's get you centered first</h2>
            <p className="text-sm text-muted-foreground">
              Your check-in felt a bit rushed — and that's okay. The best coaching happens when you're present and honest with yourself.
            </p>
          </div>

          <div className="bg-card rounded-2xl border border-border p-6 space-y-4">
            <h3 className="font-heading font-bold text-foreground text-sm">Try this 5-minute reset:</h3>
            <ol className="space-y-3 text-sm text-foreground">
              <li className="flex gap-3">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold">1</span>
                <span><strong>Close everything else.</strong> Tabs, Slack, your phone — give yourself just these five minutes.</span>
              </li>
              <li className="flex gap-3">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold">2</span>
                <span><strong>Take three slow breaths.</strong> Inhale for 4 counts, hold for 4, exhale for 6. Let your nervous system settle.</span>
              </li>
              <li className="flex gap-3">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold">3</span>
                <span><strong>Ask yourself one question:</strong> "What's actually true about my week right now?" — not what you wish were true, not what sounds good. What's real.</span>
              </li>
              <li className="flex gap-3">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold">4</span>
                <span><strong>When you feel ready,</strong> come back and check in from that place. Your coaching is only as good as the signal you give it.</span>
              </li>
            </ol>
          </div>

          <Button variant="hero" className="w-full" onClick={resetAndRetry}>
            <RefreshCw className="mr-2 h-4 w-4" /> I'm ready — let me try again
          </Button>
        </div>
      </div>
    );
  }

  if (done) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="w-full max-w-lg space-y-6">
          <div className="text-center space-y-3">
            <div className="inline-flex bg-primary/10 rounded-2xl p-4">
              <CheckCircle className="h-12 w-12 text-primary" />
            </div>
            <h2 className="font-heading text-2xl font-bold text-foreground">Check-in complete</h2>
            <p className="text-sm text-muted-foreground">Clear signal in, clear coaching back.</p>
            {intentProfile?.primaryLens && (
              <p className="text-xs text-muted-foreground">Adaptive lens: {formatLensLabel(intentProfile.primaryLens)}</p>
            )}
          </div>

          {/* AI Debrief */}
          <div className="bg-card rounded-2xl border border-border p-6">
            <div className="flex items-center gap-2 mb-4">
              <div className="bg-primary/10 rounded-lg p-1.5">
                <MessageSquare className="h-4 w-4 text-primary" />
              </div>
              <h3 className="font-heading font-bold text-foreground text-sm">Your Executive Operating Coach</h3>
            </div>
            {aiLoading && !aiDebrief ? (
              <div className="flex items-center gap-2 text-muted-foreground text-sm">
                <Loader2 className="h-4 w-4 animate-spin" />
                Reviewing your check-in for drift, clarity, and follow-through...
              </div>
            ) : aiDebrief ? (
              <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">{aiDebrief}</p>
            ) : (
              <p className="text-sm text-muted-foreground">
                {mood <= 4
                  ? "Your self-rating shows drift. Useful signal — reset the next move before a vague week turns into avoidable damage."
                  : "You're on track. Keep the operating rhythm tight and the next move decisive."}
              </p>
            )}
          </div>

          <div className="flex gap-3">
            <Button variant="outline" className="flex-1" onClick={() => navigate("/coaching")}>
              <MessageSquare className="mr-2 h-4 w-4" /> Continue coaching
            </Button>
            <Button variant="hero" className="flex-1" onClick={() => navigate("/dashboard")}>
              Dashboard <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // ── Steps definition ─────────────────────────────────────────────────────
  // step 0 = commitment callback (only shown if hasPreviousCommitment)
  // step 1 = mood, step 2 = energy, step 3 = wins, step 4 = blockers
  // step 5 = commitments (existing), step 6 = one thing (new)
  const LAST_STEP = 6;

  const renderStep = () => {
    switch (step) {
      case 0:
        return previousCommitment ? (
          <CommitmentCallbackStep
            previousCommitment={previousCommitment}
            callbackOutcome={callbackOutcome}
            setCallbackOutcome={setCallbackOutcome}
            callbackReflection={callbackReflection}
            setCallbackReflection={setCallbackReflection}
          />
        ) : null;
      case 1:
        return <ScaleSelector value={mood} onChange={setMood} label="How focused and steady are you right now?"
          emoji={["😔 Off your game", "😐 Mixed", "😊 Locked in"]} />;
      case 2:
        return <ScaleSelector value={energy} onChange={setEnergy} label="What's your disciplined execution energy level?"
          emoji={["🔋 Running on empty", "⚡ Moderate energy", "🚀 Fully charged"]} />;
      case 3:
        return <ListInput label={getFocusPrompt(intentProfile)} items={wins}
          onAdd={() => addItem(setWins)} onRemove={(i) => removeItem(setWins, i)}
          inputVal={inputVal} setInputVal={setInputVal} placeholder="Add a win..." />;
      case 4:
        return <ListInput label={getBlockerPrompt(intentProfile)} items={blockers}
          onAdd={() => addItem(setBlockers)} onRemove={(i) => removeItem(setBlockers, i)}
          inputVal={inputVal} setInputVal={setInputVal} placeholder="Add a blocker..." />;
      case 5:
        return <ListInput label={getCommitmentPrompt(intentProfile)} items={commitments}
          onAdd={() => addItem(setCommitments)} onRemove={(i) => removeItem(setCommitments, i)}
          inputVal={inputVal} setInputVal={setInputVal} placeholder="Add a commitment..." />;
      case 6:
        return <OneThingStep oneThing={oneThing} setOneThing={setOneThing} />;
      default:
        return null;
    }
  };

  // Total steps shown in progress bar: if hasPreviousCommitment → 7 steps (0–6), else 6 (1–6)
  const firstStep = hasPreviousCommitment ? 0 : 1;
  const totalSteps = LAST_STEP - firstStep + 1;
  const displayStep = step - firstStep + 1;

  const canAdvanceStep0 = step !== 0 || callbackOutcome !== null;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <div className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Link to="/" className="flex items-center">
              <img src={logo} alt="Intentus" className="h-7 w-auto object-contain cursor-pointer" />
            </Link>
            <span className="font-heading text-lg font-bold text-foreground">Check-in</span>
          </div>
          <span className="text-sm text-muted-foreground">{displayStep} of {totalSteps}</span>
        </div>
        <div className="h-1 bg-border">
          <div className="h-full bg-gradient-primary transition-all duration-500" style={{ width: `${(displayStep / totalSteps) * 100}%` }} />
        </div>
      </div>

      <AppBreadcrumb />

      <div className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-lg space-y-4">
          {step >= 1 && (
            <div className="rounded-2xl border border-primary/20 bg-primary/5 px-4 py-3 text-sm text-foreground space-y-1">
              <p>Do this check-in when you can be honest and undistracted. If you are multitasking, rushing, or half-present, wait.</p>
              {intentProfile?.primaryLens && (
                <p className="text-xs text-muted-foreground">This check-in is currently weighted toward {formatLensLabel(intentProfile.primaryLens).toLowerCase()}.</p>
              )}
            </div>
          )}
          {renderStep()}
        </div>
      </div>

      <div className="border-t border-border bg-card/50 backdrop-blur-sm p-4">
        <div className="container mx-auto max-w-lg flex gap-3">
          {step > firstStep && (
            <Button variant="outline" className="flex-1" onClick={() => { setInputVal(""); setStep(step - 1); }}>Back</Button>
          )}
          {step < LAST_STEP ? (
            <Button
              variant="hero"
              className="flex-1"
              disabled={!canAdvanceStep0}
              onClick={() => { setInputVal(""); setStep(step + 1); }}
            >
              Continue <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          ) : (
            <Button variant="hero" className="flex-1" onClick={handleSubmit} disabled={loading}>
              {loading ? "Saving..." : "Complete check-in"}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default CheckIn;
