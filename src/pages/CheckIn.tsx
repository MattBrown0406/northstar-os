import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Compass, Plus, X, ArrowRight, CheckCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

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
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const addItem = (setter: typeof setWins) => {
    if (inputVal.trim()) {
      setter((prev) => [...prev, inputVal.trim()]);
      setInputVal("");
    }
  };

  const removeItem = (setter: typeof setWins, index: number) => {
    setter((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (!user) return;
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
    }
  };

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

  const ListInput = ({ label, items, setter, placeholder }: {
    label: string; items: string[]; setter: typeof setWins; placeholder: string;
  }) => (
    <div className="space-y-4">
      <h3 className="font-heading text-lg font-bold text-foreground">{label}</h3>
      <div className="flex gap-2">
        <Input value={inputVal} onChange={(e) => setInputVal(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && addItem(setter)} placeholder={placeholder} className="flex-1" />
        <Button variant="outline" size="icon" onClick={() => addItem(setter)}><Plus className="h-4 w-4" /></Button>
      </div>
      <ul className="space-y-2">
        {items.map((item, i) => (
          <li key={i} className="flex items-center gap-2 bg-card border border-border rounded-lg px-3 py-2 text-sm text-foreground">
            <span className="flex-1">{item}</span>
            <button onClick={() => removeItem(setter, i)}><X className="h-4 w-4 text-muted-foreground hover:text-destructive" /></button>
          </li>
        ))}
      </ul>
    </div>
  );

  if (done) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="text-center space-y-6 max-w-md">
          <div className="inline-flex bg-primary/10 rounded-2xl p-4">
            <CheckCircle className="h-12 w-12 text-primary" />
          </div>
          <h2 className="font-heading text-2xl font-bold text-foreground">Check-in complete</h2>
          <p className="text-muted-foreground">
            {mood <= 4
              ? "Your self-rating shows some drift. Useful signal — reset the next move before a soft week turns into a lost one."
              : "You’re on track. Keep the operating rhythm tight and the momentum moving."}
          </p>
          <Button variant="hero" onClick={() => navigate("/dashboard")}>
            Back to dashboard <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </div>
    );
  }

  const steps = [
    <ScaleSelector key="mood" value={mood} onChange={setMood} label="How focused and steady are you right now?"
      emoji={["😔 Off your game", "😐 Mixed", "😊 Locked in"]} />,
    <ScaleSelector key="energy" value={energy} onChange={setEnergy} label="What’s your execution energy level?"
      emoji={["🔋 Running on empty", "⚡ Moderate energy", "🚀 Fully charged"]} />,
    <ListInput key="wins" label="What moved forward since your last check-in?" items={wins} setter={setWins} placeholder="Add a win..." />,
    <ListInput key="blockers" label="Where are you hitting resistance or friction?" items={blockers} setter={setBlockers} placeholder="Add a blocker..." />,
    <ListInput key="commitments" label="What commitments will you keep before the next check-in?" items={commitments} setter={setCommitments} placeholder="Add a commitment..." />,
  ];

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <div className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-gradient-primary rounded-lg p-1.5">
              <Compass className="h-4 w-4 text-primary-foreground" />
            </div>
            <span className="font-heading text-lg font-bold text-foreground">Check-in</span>
          </div>
          <span className="text-sm text-muted-foreground">{step + 1} of {steps.length}</span>
        </div>
        <div className="h-1 bg-border">
          <div className="h-full bg-gradient-primary transition-all duration-500" style={{ width: `${((step + 1) / steps.length) * 100}%` }} />
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-lg">{steps[step]}</div>
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
