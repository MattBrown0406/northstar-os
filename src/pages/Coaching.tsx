import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Compass, Send, ArrowLeft, Loader2, MessageSquare,
  TrendingUp, AlertTriangle, Target, Sparkles
} from "lucide-react";
import { formatLensLabel } from "@/lib/intentus-architecture";

interface Message {
  role: "user" | "assistant";
  content: string;
}

const quickPrompts = [
  { icon: <TrendingUp className="h-4 w-4" />, label: "How am I trending?", prompt: "Based on my recent check-ins, how am I trending? Where is my operating rhythm tightening or slipping?" },
  { icon: <AlertTriangle className="h-4 w-4" />, label: "Am I drifting?", prompt: "Am I drifting from my operating focus and 90-day plan? Be direct and use evidence." },
  { icon: <Target className="h-4 w-4" />, label: "What should I focus on?", prompt: "What's the single highest-priority move I should focus on this week based on everything you know about me?" },
  { icon: <Sparkles className="h-4 w-4" />, label: "Challenge me", prompt: "Challenge my assumptions. What contradiction, self-protection, or blind spot should I confront right now?" },
];

const Coaching = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [activeLens, setActiveLens] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) return;
    const loadLens = async () => {
      const [reportRes, profileRes] = await Promise.all([
        supabase.from("strategic_reports").select("intent_model").eq("user_id", user.id).order("created_at", { ascending: false }).limit(1),
        supabase.from("profiles").select("intent_profile").eq("user_id", user.id).single(),
      ]);

      const lens = (reportRes.data?.[0] as any)?.intent_model?.primary_lens || (profileRes.data as any)?.intent_profile?.primaryLens || null;
      setActiveLens(lens);
    };
    loadLens();
  }, [user]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async (text: string) => {
    if (!text.trim() || isStreaming) return;

    const userMsg: Message = { role: "user", content: text.trim() };
    const updatedMessages = [...messages, userMsg];
    setMessages(updatedMessages);
    setInput("");
    setIsStreaming(true);

    let assistantText = "";

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
        body: JSON.stringify({
          mode: "chat",
          messages: updatedMessages.map(m => ({ role: m.role, content: m.content })),
        }),
      });

      if (!resp.ok || !resp.body) {
        const errData = resp.ok ? null : await resp.json().catch(() => null);
        setMessages(prev => [...prev, {
          role: "assistant",
          content: errData?.error || "Sorry, I couldn't process that right now. Please try again.",
        }]);
        setIsStreaming(false);
        return;
      }

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
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
              assistantText += content;
              setMessages(prev => {
                const last = prev[prev.length - 1];
                if (last?.role === "assistant") {
                  return prev.map((m, i) => i === prev.length - 1 ? { ...m, content: assistantText } : m);
                }
                return [...prev, { role: "assistant", content: assistantText }];
              });
            }
          } catch {}
        }
      }
    } catch (e) {
      console.error("Chat error:", e);
      if (!assistantText) {
        setMessages(prev => [...prev, {
          role: "assistant",
          content: "Something went wrong. Please try again.",
        }]);
      }
    }
    setIsStreaming(false);
    inputRef.current?.focus();
  };

  return (
    <div className="min-h-screen bg-background flex flex-col h-screen">
      {/* Header */}
      <nav className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto flex items-center justify-between h-14 px-4">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate("/dashboard")}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div className="flex items-center gap-2">
              <div className="bg-gradient-primary rounded-lg p-1.5">
                <Compass className="h-4 w-4 text-primary-foreground" />
              </div>
              <span className="font-heading text-lg font-bold text-foreground">AI Coach</span>
            </div>
          </div>
          <p className="text-xs text-muted-foreground">Operating coach · Direct, warm, not therapy{activeLens ? ` · ${formatLensLabel(activeLens as any)}` : ""}</p>
        </div>
      </nav>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto">
        <div className="container mx-auto max-w-2xl px-4 py-6 space-y-4">
          {messages.length === 0 && (
            <div className="space-y-6">
              <div className="text-center space-y-2 pt-8">
                <div className="inline-flex bg-primary/10 rounded-2xl p-4">
                  <MessageSquare className="h-8 w-8 text-primary" />
                </div>
                <h2 className="font-heading text-xl font-bold text-foreground">Your AI Operating Coach</h2>
                <p className="text-sm text-muted-foreground max-w-md mx-auto">
                  I have access to your audit, strategic report, and all your check-ins.
                  Ask me about your progress, drift, decision clarity, blind spots, or what the next move should be.
                </p>
                {activeLens && (
                  <p className="text-xs text-primary font-medium">Currently weighted toward {formatLensLabel(activeLens).toLowerCase()}.</p>
                )}
              </div>
              <div className="grid grid-cols-2 gap-3">
                {quickPrompts.map((qp, i) => (
                  <button
                    key={i}
                    onClick={() => sendMessage(qp.prompt)}
                    className="flex items-center gap-2 p-3 rounded-xl border border-border bg-card hover:bg-accent/5 hover:border-primary/30 transition-all text-left text-sm"
                  >
                    <div className="text-primary shrink-0">{qp.icon}</div>
                    <span className="text-foreground font-medium">{qp.label}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map((msg, i) => (
            <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                msg.role === "user"
                  ? "bg-primary text-primary-foreground"
                  : "bg-card border border-border text-foreground"
              }`}>
                <p className="whitespace-pre-wrap">{msg.content}</p>
                {msg.role === "assistant" && i === messages.length - 1 && isStreaming && (
                  <span className="inline-block w-1.5 h-4 bg-primary/60 animate-pulse ml-0.5 align-middle" />
                )}
              </div>
            </div>
          ))}

          {isStreaming && messages[messages.length - 1]?.role !== "assistant" && (
            <div className="flex justify-start">
              <div className="bg-card border border-border rounded-2xl px-4 py-3">
                <Loader2 className="h-4 w-4 animate-spin text-primary" />
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input */}
      <div className="border-t border-border bg-card/50 backdrop-blur-sm p-4">
        <div className="container mx-auto max-w-2xl">
          <form
            onSubmit={(e) => { e.preventDefault(); sendMessage(input); }}
            className="flex gap-2"
          >
            <Input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask for clarity, challenge, or the next priority..."
              disabled={isStreaming}
              className="flex-1"
            />
            <Button type="submit" variant="hero" size="icon" disabled={isStreaming || !input.trim()}>
              <Send className="h-4 w-4" />
            </Button>
          </form>
          <p className="text-xs text-muted-foreground text-center mt-2">
            Coaching and self-reflection tools, not medical advice.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Coaching;
