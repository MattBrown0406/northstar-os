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
  role: "system" | "user";
  text: string;
}

const Audit = () => {
  const [currentQ, setCurrentQ] = useState(0);
  const [responses, setResponses] = useState<Record<string, string>>({});
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [auditId, setAuditId] = useState<string | null>(null);
  const [completed, setCompleted] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!user) return;
    // Check for existing in-progress audit
    const loadAudit = async () => {
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
        // Reconstruct chat messages
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
        // Create new audit
        const { data: newAudit, error } = await supabase
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
    loadAudit();
  }, [user]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || !auditId) return;

    const question = AUDIT_QUESTIONS[currentQ];
    const answer = input.trim();
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
      setMessages((prev) => [
        ...prev,
        { role: "system", text: "✅ Your baseline audit is complete. You answered honestly — that's the hardest part. Let's build your strategic report." },
      ]);
    } else {
      // Show section transition if needed
      if (AUDIT_QUESTIONS[nextQ].sectionIndex !== question.sectionIndex) {
        setMessages((prev) => [
          ...prev,
          { role: "system", text: `Great. Moving on to **${AUDIT_QUESTIONS[nextQ].section}**.` },
        ]);
      }
      setTimeout(() => {
        setMessages((prev) => [...prev, { role: "system", text: AUDIT_QUESTIONS[nextQ].text }]);
        setCurrentQ(nextQ);
      }, 500);
    }
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
            <span className="font-heading text-lg font-bold text-foreground">Baseline Audit</span>
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
                    : "bg-card border border-border text-foreground rounded-bl-md"
                }`}
              >
                <p className="text-sm whitespace-pre-wrap">{msg.text}</p>
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
            <Button variant="hero" className="w-full" onClick={() => navigate("/dashboard")}>
              View your dashboard <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          ) : (
            <div className="flex gap-2">
              {AUDIT_QUESTIONS[currentQ]?.type === "scale" ? (
                <div className="flex-1 flex gap-1">
                  {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
                    <button
                      key={n}
                      onClick={() => {
                        setInput(String(n));
                        setTimeout(() => {
                          const fakeInput = String(n);
                          setInput("");
                          // Directly handle
                          const question = AUDIT_QUESTIONS[currentQ];
                          const newResponses = { ...responses, [question.id]: fakeInput };
                          setMessages((prev) => [...prev, { role: "user", text: fakeInput }]);
                          setResponses(newResponses);
                          const nextQ = currentQ + 1;
                          const isLast = nextQ >= AUDIT_QUESTIONS.length;
                          supabase.from("baseline_audits").update({
                            responses: newResponses as any,
                            current_section: isLast ? AUDIT_SECTIONS.length - 1 : AUDIT_QUESTIONS[nextQ]?.sectionIndex ?? 0,
                            current_question: isLast ? 0 : AUDIT_QUESTIONS[nextQ]?.questionIndex ?? 0,
                            ...(isLast ? { status: "completed" as const, completed_at: new Date().toISOString() } : {}),
                          }).eq("id", auditId!).then(() => {
                            if (isLast) {
                              setCompleted(true);
                              setMessages((prev) => [...prev, { role: "system", text: "✅ Your baseline audit is complete. You answered honestly — that's the hardest part. Let's build your strategic report." }]);
                            } else {
                              if (AUDIT_QUESTIONS[nextQ].sectionIndex !== question.sectionIndex) {
                                setMessages((prev) => [...prev, { role: "system", text: `Great. Moving on to **${AUDIT_QUESTIONS[nextQ].section}**.` }]);
                              }
                              setTimeout(() => {
                                setMessages((prev) => [...prev, { role: "system", text: AUDIT_QUESTIONS[nextQ].text }]);
                                setCurrentQ(nextQ);
                              }, 500);
                            }
                          });
                        }, 0);
                      }}
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
                    placeholder="Type your answer..."
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
