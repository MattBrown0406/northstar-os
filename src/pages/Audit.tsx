import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Compass, Send, ArrowRight } from "lucide-react";
import { AUDIT_QUESTIONS, AUDIT_SECTIONS } from "@/lib/audit-questions";
import { useToast } from "@/hooks/use-toast";

interface ChatMessage {
  role: "system" | "user" | "coach";
  text: string;
  streaming?: boolean;
}

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/audit-coach`;

async function streamCoachResponse({
  responses,
  currentQuestion,
  currentSection,
  coachingTone,
  displayName,
  onDelta,
  onDone,
}: {
  responses: Record<string, string>;
  currentQuestion: string;
  currentSection: string;
  coachingTone: string;
  displayName: string;
  onDelta: (text: string) => void;
  onDone: () => void;
}) {
  const resp = await fetch(CHAT_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
    },
    body: JSON.stringify({
      responses,
      current_question: currentQuestion,
      current_section: currentSection,
      all_questions: AUDIT_QUESTIONS.map((q) => ({ id: q.id, text: q.text, section: q.section })),
      coaching_tone: coachingTone,
      display_name: displayName,
    }),
  });

  if (!resp.ok || !resp.body) {
    onDone();
    return;
  }

  const reader = resp.body.getReader();
  const decoder = new TextDecoder();
  let textBuffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    textBuffer += decoder.decode(value, { stream: true });

    let newlineIndex: number;
    while ((newlineIndex = textBuffer.indexOf("\n")) !== -1) {
      let line = textBuffer.slice(0, newlineIndex);
      textBuffer = textBuffer.slice(newlineIndex + 1);

      if (line.endsWith("\r")) line = line.slice(0, -1);
      if (line.startsWith(":") || line.trim() === "") continue;
      if (!line.startsWith("data: ")) continue;

      const jsonStr = line.slice(6).trim();
      if (jsonStr === "[DONE]") break;

      try {
        const parsed = JSON.parse(jsonStr);
        const content = parsed.choices?.[0]?.delta?.content as string | undefined;
        if (content) onDelta(content);
      } catch {
        textBuffer = line + "\n" + textBuffer;
        break;
      }
    }
  }

  // Flush remaining
  if (textBuffer.trim()) {
    for (let raw of textBuffer.split("\n")) {
      if (!raw) continue;
      if (raw.endsWith("\r")) raw = raw.slice(0, -1);
      if (raw.startsWith(":") || raw.trim() === "") continue;
      if (!raw.startsWith("data: ")) continue;
      const jsonStr = raw.slice(6).trim();
      if (jsonStr === "[DONE]") continue;
      try {
        const parsed = JSON.parse(jsonStr);
        const content = parsed.choices?.[0]?.delta?.content as string | undefined;
        if (content) onDelta(content);
      } catch { /* ignore */ }
    }
  }

  onDone();
}

const Audit = () => {
  const [currentQ, setCurrentQ] = useState(0);
  const [responses, setResponses] = useState<Record<string, string>>({});
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [auditId, setAuditId] = useState<string | null>(null);
  const [completed, setCompleted] = useState(false);
  const [coachStreaming, setCoachStreaming] = useState(false);
  const [profile, setProfile] = useState<{ coaching_tone: string; display_name: string }>({
    coaching_tone: "balanced",
    display_name: "",
  });
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      // Load profile
      const { data: profileData } = await supabase
        .from("profiles")
        .select("coaching_tone, display_name")
        .eq("user_id", user.id)
        .single();
      if (profileData) {
        setProfile({
          coaching_tone: profileData.coaching_tone || "balanced",
          display_name: profileData.display_name || "",
        });
      }

      // Check for existing in-progress audit
      const { data } = await supabase
        .from("baseline_audits")
        .select("*")
        .eq("user_id", user.id)
        .eq("status", "in_progress")
        .order("created_at", { ascending: false })
        .limit(1);

      if (data && data.length > 0) {
        const audit = data[0];
        setAuditId(audit.id);
        const saved = (audit.responses as Record<string, string>) || {};
        setResponses(saved);
        const msgs: ChatMessage[] = [];
        const answeredCount = Object.keys(saved).length;
        for (let i = 0; i < answeredCount && i < AUDIT_QUESTIONS.length; i++) {
          msgs.push({ role: "system", text: AUDIT_QUESTIONS[i].text });
          if (saved[AUDIT_QUESTIONS[i].id]) {
            msgs.push({ role: "user", text: saved[AUDIT_QUESTIONS[i].id] });
          }
        }
        if (answeredCount < AUDIT_QUESTIONS.length) {
          msgs.push({ role: "system", text: AUDIT_QUESTIONS[answeredCount].text });
        }
        setCurrentQ(answeredCount);
        setMessages(msgs);
      } else {
        // Check for completed audit
        const { data: completedAudit } = await supabase
          .from("baseline_audits")
          .select("id")
          .eq("user_id", user.id)
          .eq("status", "completed")
          .limit(1);

        if (completedAudit && completedAudit.length > 0) {
          setCompleted(true);
          setMessages([{ role: "system", text: "✅ Your operating audit is already complete. View your report or start a fresh assessment." }]);
          return;
        }

        // Create new audit
        const { data: newAudit } = await supabase
          .from("baseline_audits")
          .insert({ user_id: user.id })
          .select()
          .single();

        if (newAudit) {
          setAuditId(newAudit.id);
          setMessages([{ role: "system", text: AUDIT_QUESTIONS[0].text }]);
        }
      }
    };
    load();
  }, [user]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const processAnswer = async (answer: string) => {
    if (!auditId) return;

    const question = AUDIT_QUESTIONS[currentQ];
    const newResponses = { ...responses, [question.id]: answer };

    setMessages((prev) => [...prev, { role: "user", text: answer }]);
    setInput("");
    setResponses(newResponses);

    // Save progress
    const nextQ = currentQ + 1;
    const isLast = nextQ >= AUDIT_QUESTIONS.length;

    await supabase
      .from("baseline_audits")
      .update({
        responses: newResponses as any,
        current_section: isLast ? AUDIT_SECTIONS.length - 1 : AUDIT_QUESTIONS[nextQ]?.sectionIndex ?? 0,
        current_question: isLast ? 0 : AUDIT_QUESTIONS[nextQ]?.questionIndex ?? 0,
        ...(isLast ? { status: "completed" as const, completed_at: new Date().toISOString() } : {}),
      })
      .eq("id", auditId);

    if (isLast) {
      setCompleted(true);
      // Get final AI reflection
      setCoachStreaming(true);
      let coachText = "";
      setMessages((prev) => [...prev, { role: "coach", text: "", streaming: true }]);

      try {
        await streamCoachResponse({
          responses: newResponses,
          currentQuestion: question.id,
          currentSection: question.section,
          coachingTone: profile.coaching_tone,
          displayName: profile.display_name,
          onDelta: (chunk) => {
            coachText += chunk;
            setMessages((prev) => {
              const updated = [...prev];
              updated[updated.length - 1] = { role: "coach", text: coachText, streaming: true };
              return updated;
            });
          },
          onDone: () => {
            setMessages((prev) => {
              const updated = [...prev];
              updated[updated.length - 1] = { role: "coach", text: coachText };
              return [...updated, { role: "system", text: "✅ Your operating audit is complete. Let’s build your report." }];
            });
            setCoachStreaming(false);
          },
        });
      } catch {
        setMessages((prev) => [...prev, { role: "system", text: "✅ Your operating audit is complete. Let’s build your report." }]);
        setCoachStreaming(false);
      }
      return;
    }

    // Stream AI coaching response before next question
    setCoachStreaming(true);
    let coachText = "";
    setMessages((prev) => [...prev, { role: "coach", text: "", streaming: true }]);

    try {
      await streamCoachResponse({
        responses: newResponses,
        currentQuestion: question.id,
        currentSection: question.section,
        coachingTone: profile.coaching_tone,
        displayName: profile.display_name,
        onDelta: (chunk) => {
          coachText += chunk;
          setMessages((prev) => {
            const updated = [...prev];
            updated[updated.length - 1] = { role: "coach", text: coachText, streaming: true };
            return updated;
          });
        },
        onDone: () => {
          setMessages((prev) => {
            const updated = [...prev];
            updated[updated.length - 1] = { role: "coach", text: coachText };
            return updated;
          });
          setCoachStreaming(false);

          // Show section transition if needed
          if (AUDIT_QUESTIONS[nextQ].sectionIndex !== question.sectionIndex) {
            setTimeout(() => {
              setMessages((prev) => [
                ...prev,
                { role: "system", text: `Moving on to **${AUDIT_QUESTIONS[nextQ].section}**.` },
              ]);
            }, 600);
          }

          // Show next question after a pause
          setTimeout(() => {
            setMessages((prev) => [...prev, { role: "system", text: AUDIT_QUESTIONS[nextQ].text }]);
            setCurrentQ(nextQ);
          }, AUDIT_QUESTIONS[nextQ].sectionIndex !== question.sectionIndex ? 1200 : 800);
        },
      });
    } catch {
      setCoachStreaming(false);
      // Fallback: just show next question
      if (AUDIT_QUESTIONS[nextQ].sectionIndex !== question.sectionIndex) {
        setMessages((prev) => [
          ...prev,
          { role: "system", text: `Moving on to **${AUDIT_QUESTIONS[nextQ].section}**.` },
        ]);
      }
      setTimeout(() => {
        setMessages((prev) => [...prev, { role: "system", text: AUDIT_QUESTIONS[nextQ].text }]);
        setCurrentQ(nextQ);
      }, 500);
    }
  };

  const handleSend = async () => {
    if (!input.trim() || coachStreaming) return;
    await processAnswer(input.trim());
  };

  const handleScaleClick = async (n: number) => {
    if (coachStreaming) return;
    await processAnswer(String(n));
  };

  const currentSection = currentQ < AUDIT_QUESTIONS.length ? AUDIT_QUESTIONS[currentQ].sectionIndex : AUDIT_SECTIONS.length - 1;
  const progress = (currentQ / AUDIT_QUESTIONS.length) * 100;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <div className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-gradient-primary rounded-lg p-1.5">
              <Compass className="h-4 w-4 text-primary-foreground" />
            </div>
            <span className="font-heading text-lg font-bold text-foreground">Operating Audit</span>
          </div>
          <div className="text-sm text-muted-foreground">
            {AUDIT_SECTIONS[currentSection]}
          </div>
        </div>
        <div className="h-1 bg-border">
          <div className="h-full bg-gradient-primary transition-all duration-500" style={{ width: `${progress}%` }} />
        </div>
      </div>

      {/* Chat area */}
      <div className="flex-1 overflow-y-auto">
        <div className="container mx-auto max-w-2xl px-4 py-6 space-y-4">
          {/* Section pills */}
          <div className="flex gap-2 overflow-x-auto pb-2">
            {AUDIT_SECTIONS.map((s, i) => (
              <span
                key={s}
                className={`whitespace-nowrap text-xs px-3 py-1 rounded-full border ${
                  i === currentSection
                    ? "bg-primary/10 border-primary text-primary"
                    : i < currentSection
                    ? "bg-primary/5 border-primary/20 text-primary/60"
                    : "border-border text-muted-foreground"
                }`}
              >
                {s}
              </span>
            ))}
          </div>

          {/* Messages */}
          {messages.map((msg, i) => (
            <div
              key={i}
              className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                  msg.role === "user"
                    ? "bg-primary text-primary-foreground rounded-br-md"
                    : msg.role === "coach"
                    ? "bg-accent/10 border border-accent/30 text-foreground rounded-bl-md"
                    : "bg-card border border-border text-foreground rounded-bl-md"
                }`}
              >
                {msg.role === "coach" && (
                  <p className="text-[10px] font-semibold text-accent uppercase tracking-wider mb-1">Coach</p>
                )}
                <p className="text-sm whitespace-pre-wrap">
                  {msg.text}
                  {msg.streaming && <span className="inline-block w-1.5 h-4 bg-accent/60 animate-pulse ml-0.5 align-text-bottom" />}
                </p>
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input area */}
      <div className="border-t border-border bg-card/50 backdrop-blur-sm">
        <div className="container mx-auto max-w-2xl px-4 py-4">
          {completed ? (
            <Button variant="hero" className="w-full" onClick={() => navigate("/report")}>
              View your Operating Report <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          ) : coachStreaming ? (
            <div className="flex items-center justify-center py-2">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <div className="flex gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-accent animate-bounce" style={{ animationDelay: "0ms" }} />
                  <span className="w-1.5 h-1.5 rounded-full bg-accent animate-bounce" style={{ animationDelay: "150ms" }} />
                  <span className="w-1.5 h-1.5 rounded-full bg-accent animate-bounce" style={{ animationDelay: "300ms" }} />
                </div>
                Intentus is reflecting…
              </div>
            </div>
          ) : (
            <div className="flex gap-2">
              {AUDIT_QUESTIONS[currentQ]?.type === "scale" ? (
                <div className="flex-1 flex gap-1">
                  {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
                    <button
                      key={n}
                      onClick={() => handleScaleClick(n)}
                      className="flex-1 h-10 rounded-lg border border-border text-sm font-medium hover:bg-primary hover:text-primary-foreground transition-colors text-foreground"
                    >
                      {n}
                    </button>
                  ))}
                </div>
              ) : (
                <>
                  <Input
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSend()}
                    placeholder="Type your response..."
                    className="flex-1"
                  />
                  <Button onClick={handleSend} disabled={!input.trim()} variant="hero" size="icon">
                    <Send className="h-4 w-4" />
                  </Button>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Audit;
