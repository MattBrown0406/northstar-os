import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, X, ArrowRight, CheckCircle, MessageSquare, Loader2, RefreshCw, Wind } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { formatLensLabel, getBlockerPrompt, getCommitmentPrompt, getFocusPrompt, type IntentProfile } from "@/lib/intentus-architecture";

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

const CheckIn = () => {
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
    if (hasThinCheckIn()) {
      setShowCenteringGuide(true);
      return;
    }
    setLoading(true);
    const { error } = await supabase.from("check_ins").insert({
      user_id: user.id,
      mood_score: mood,
      energy_score: energy,
      wins,
      blockers,
      commitments,
      drift_detected: mood <= 4 || energy <= 4,
    });
    setLoading(false);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      setDone(true);
      streamDebrief();
    }
  };

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

  const steps = [
    <ScaleSelector key="mood" value={mood} onChange={setMood} label="How focused and steady are you right now?"
      emoji={["😔 Off your game", "😐 Mixed", "😊 Locked in"]} />,
    <ScaleSelector key="energy" value={energy} onChange={setEnergy} label="What's your disciplined execution energy level?"
      emoji={["🔋 Running on empty", "⚡ Moderate energy", "🚀 Fully charged"]} />,
    <ListInput key="wins" label={getFocusPrompt(intentProfile)} items={wins}
      onAdd={() => addItem(setWins)} onRemove={(i) => removeItem(setWins, i)}
      inputVal={inputVal} setInputVal={setInputVal} placeholder="Add a win..." />,
    <ListInput key="blockers" label={getBlockerPrompt(intentProfile)} items={blockers}
      onAdd={() => addItem(setBlockers)} onRemove={(i) => removeItem(setBlockers, i)}
      inputVal={inputVal} setInputVal={setInputVal} placeholder="Add a blocker..." />,
    <ListInput key="commitments" label={getCommitmentPrompt(intentProfile)} items={commitments}
      onAdd={() => addItem(setCommitments)} onRemove={(i) => removeItem(setCommitments, i)}
      inputVal={inputVal} setInputVal={setInputVal} placeholder="Add a commitment..." />,
  ];

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <div className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="font-heading text-xl font-extrabold tracking-tight text-foreground uppercase">Intentus</span>
            <span className="font-heading text-lg font-bold text-foreground">Check-in</span>
          </div>
          <span className="text-sm text-muted-foreground">{step + 1} of {steps.length}</span>
        </div>
        <div className="h-1 bg-border">
          <div className="h-full bg-gradient-primary transition-all duration-500" style={{ width: `${((step + 1) / steps.length) * 100}%` }} />
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-lg space-y-4">
          <div className="rounded-2xl border border-primary/20 bg-primary/5 px-4 py-3 text-sm text-foreground space-y-1">
            <p>Do this check-in when you can be honest and undistracted. If you are multitasking, rushing, or half-present, wait.</p>
            {intentProfile?.primaryLens && (
              <p className="text-xs text-muted-foreground">This check-in is currently weighted toward {formatLensLabel(intentProfile.primaryLens).toLowerCase()}.</p>
            )}
          </div>
          {steps[step]}
        </div>
      </div>

      <div className="border-t border-border bg-card/50 backdrop-blur-sm p-4">
        <div className="container mx-auto max-w-lg flex gap-3">
          {step > 0 && (
            <Button variant="outline" className="flex-1" onClick={() => setStep(step - 1)}>Back</Button>
          )}
          {step < steps.length - 1 ? (
            <Button variant="hero" className="flex-1" onClick={() => { setInputVal(""); setStep(step + 1); }}>
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
