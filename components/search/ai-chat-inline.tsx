"use client";

import { useState, useRef, useEffect, useCallback, useLayoutEffect } from "react";
import { Send, ArrowLeft, ArrowDown, Loader2, Bot, Sparkles, Plane } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import TripPlanCard, { type TripPlan } from "./trip-plan-card";

type Message = {
  role: "user" | "assistant";
  content: string;
};

type AiChatInlineProps = {
  onClose: () => void;
  initialQuery?: string;
};

export default function AiChatInline({ onClose, initialQuery }: AiChatInlineProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showScrollButton, setShowScrollButton] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [tripPlan, setTripPlan] = useState<TripPlan | null>(null);
  const [isPlanLoading, setIsPlanLoading] = useState(false);
  const [planError, setPlanError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const initialQuerySent = useRef(false);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  const [visitorId, setVisitorId] = useState("");

  // Scroll locking and initialization
  useLayoutEffect(() => {
    // Immediate scroll to top
    window.scrollTo({ top: 0, behavior: "instant" });

    // Lock body scroll to prevent background scrolling
    document.body.style.overflow = "hidden";

    // Set active state for CSS transitions (nav/footer hiding)
    document.body.setAttribute("data-chat-active", "true");

    let id = localStorage.getItem("ai_visitor_id");
    if (!id) {
      id = Math.random().toString(36).substring(2) + Date.now().toString(36);
      localStorage.setItem("ai_visitor_id", id);
    }
    setVisitorId(id);

    return () => {
      // Cleanup
      document.body.style.overflow = "";
      document.body.removeAttribute("data-chat-active");
    };
  }, []);

  // Mount animation
  useEffect(() => {
    requestAnimationFrame(() => setMounted(true));
    return () => setMounted(false);
  }, []);

  // Scroll tracking
  useEffect(() => {
    const container = messagesContainerRef.current;
    if (!container) return;
    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = container;
      setShowScrollButton(scrollHeight - scrollTop - clientHeight > 100);
    };
    container.addEventListener("scroll", handleScroll);
    return () => container.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => { scrollToBottom(); }, [messages, scrollToBottom]);

  useEffect(() => {
    if (inputRef.current) setTimeout(() => inputRef.current?.focus(), 400);
  }, []);

  // Send initial query
  useEffect(() => {
    if (initialQuery && !initialQuerySent.current && messages.length === 0) {
      initialQuerySent.current = true;
      sendMessage(initialQuery);
    }
  }, [initialQuery]);

  const sendMessage = async (text?: string) => {
    const messageText = text || input.trim();
    if (!messageText || isLoading) return;

    const userMessage: Message = { role: "user", content: messageText };
    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setInput("");
    setIsLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: updatedMessages, visitorId }),
      });
      if (!res.ok) throw new Error("Failed");
      const data = await res.json();
      setMessages((prev) => [...prev, { role: "assistant", content: data.message }]);
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "Вибачте, сталася помилка. Спробуйте ще раз або зв'яжіться з нами через сторінку контактів." },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  };

  const generateTripPlan = async () => {
    if (messages.length < 2 || isPlanLoading) return;
    setIsPlanLoading(true);
    setPlanError(null);
    setTripPlan(null);

    try {
      const res = await fetch("/api/chat/trip-plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages }),
      });

      if (!res.ok) {
        const data = await res.json();
        if (data.error === "not_enough_info") {
          setPlanError("Поки недостатньо деталей для плану. Розкажіть більше про вашу подорож!");
        } else if (res.status === 429) {
          setPlanError("Ви досягли ліміту запитів на сьогодні. Зверніться до менеджера через сторінку контактів.");
        } else {
          setPlanError("Не вдалося сформувати план. Спробуйте ще раз.");
        }
        return;
      }

      const data = await res.json();
      setTripPlan(data.plan);
      setTimeout(scrollToBottom, 100);
    } catch {
      setPlanError("Помилка з'єднання. Спробуйте ще раз.");
    } finally {
      setIsPlanLoading(false);
    }
  };

  // Show "Generate Plan" button after 4+ messages (at least 2 exchanges)
  const showPlanButton = messages.length >= 4 && !tripPlan;

  const quickQuestions = [
    { emoji: "🧳", text: "Спланувати подорож" },
    { emoji: "🏖️", text: "Куди поїхати на пляж?" },
    { emoji: "🔥", text: "Гарячі тури" },
    { emoji: "✈️", text: "Найкращі напрямки" },
    { emoji: "💰", text: "Бюджетний відпочинок" },
    { emoji: "👨‍👩‍👧‍👦", text: "Відпочинок з дітьми" },
  ];

  return (
    <div className={`fixed inset-0 z-100 w-full h-dvh bg-black flex justify-center transition-all duration-700 ${mounted ? "opacity-100" : "opacity-0 translate-y-8"}`}>
      {/* Subtle background glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-accent/4 rounded-full blur-[120px] pointer-events-none" />

      <div className="w-full max-w-3xl flex flex-col h-full relative px-4 sm:px-6">

      {/* Header */}
      <div className="flex items-center gap-3 py-4 sticky top-0 z-10 bg-black/80 backdrop-blur-xl border-b border-white/5">
        <button
          onClick={onClose}
          className="group flex items-center gap-2 text-white/60 hover:text-white transition-colors bg-white/5 hover:bg-white/10 px-3 py-2 rounded-xl border border-white/8 hover:border-white/15 text-sm font-medium"
        >
            <ArrowLeft className="w-4 h-4" />
            <span>Назад</span>
        </button>
        <div className="flex items-center gap-2.5 flex-1">
          <div className="relative">
            <div className="w-9 h-9 rounded-xl bg-accent/10 border border-accent/20 flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-accent" />
            </div>
            <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-400 rounded-full border-2 border-black animate-pulse" />
          </div>
          <div className="leading-tight">
            <span className="text-white text-sm font-semibold">RestAL AI</span>
            <span className="text-white/30 text-xs block">онлайн</span>
          </div>
        </div>
      </div>

      {/* Messages area */}
      <div
        ref={messagesContainerRef}
        className="flex-1 overflow-y-auto space-y-3 relative"
        style={{ scrollbarWidth: "none" }}
      >
        {messages.length === 0 && !isLoading ? (
          <div className={`flex flex-col items-center justify-center h-full gap-8 transition-all duration-500 delay-200 ${mounted ? "opacity-100 scale-100" : "opacity-0 scale-95"}`}>
            {/* Glowing orb */}
            <div className="relative">
              <div className="absolute inset-0 w-24 h-24 -m-2 rounded-full bg-accent/15 blur-3xl animate-pulse" />
              <div className="relative w-20 h-20 rounded-2xl bg-accent/10 border border-accent/20 flex items-center justify-center shadow-lg shadow-accent/10">
                <Sparkles className="w-8 h-8 text-accent" />
              </div>
            </div>

            <div className="text-center space-y-3 max-w-md">
              <h3 className="text-white text-2xl font-bold">Чим можу допомогти?</h3>
              <p className="text-white/40 text-sm leading-relaxed">
                Запитайте мене про будь-що пов&apos;язане з подорожами — напрямки, погоду, візи, найкращий час для поїздки.
              </p>
            </div>

            {/* Quick questions grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 w-full max-w-lg">
              {quickQuestions.map((q, i) => (
                <button
                  key={q.text}
                  onClick={() => sendMessage(`${q.emoji} ${q.text}`)}
                  className={`group relative px-4 py-3.5 text-sm text-white/60 hover:text-white bg-white/3 hover:bg-accent/10 border border-white/8 hover:border-accent/30 rounded-2xl transition-all duration-300 text-left overflow-hidden hover:shadow-lg hover:shadow-accent/5 ${mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}
                  style={{ transitionDelay: `${300 + i * 80}ms` }}
                >
                  <span className="text-lg">{q.emoji}</span>
                  <span className="block text-xs mt-1.5 leading-snug font-medium">{q.text}</span>
                  <div className="absolute inset-0 bg-linear-to-r from-accent/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl" />
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="py-4 space-y-5">
            {messages.map((msg, i) => (
              <div
                key={i}
                className={`flex gap-3 animate-in fade-in slide-in-from-bottom-2 duration-300 ${msg.role === "user" ? "justify-end" : "justify-start"}`}
              >
                {msg.role === "assistant" && (
                  <div className="w-8 h-8 rounded-xl bg-accent/10 border border-accent/20 flex items-center justify-center shrink-0 mt-1">
                    <Bot className="w-4 h-4 text-accent" />
                  </div>
                )}
                <div
                  className={`max-w-[85%] sm:max-w-[75%] px-4 py-3 text-sm leading-relaxed ${
                    msg.role === "user"
                      ? "bg-accent text-white rounded-2xl rounded-br-md shadow-lg shadow-accent/15"
                      : "bg-white/4 text-white/90 rounded-2xl rounded-bl-md border border-white/8"
                  }`}
                >
                  {msg.role === "user" ? (
                    msg.content
                  ) : (
                    <div className="prose prose-invert prose-sm max-w-none prose-p:leading-relaxed prose-pre:bg-white/10 prose-pre:p-3 prose-pre:rounded-xl">
                       <ReactMarkdown remarkPlugins={[remarkGfm]}>
                        {msg.content}
                      </ReactMarkdown>
                    </div>
                  )}
                </div>
              </div>
            ))}

            {isLoading && (
              <div className="flex gap-3 justify-start animate-in fade-in duration-300">
                <div className="w-8 h-8 rounded-xl bg-accent/10 border border-accent/20 flex items-center justify-center shrink-0">
                  <Bot className="w-4 h-4 text-accent" />
                </div>
                <div className="bg-white/4 border border-white/8 rounded-2xl rounded-bl-md px-5 py-4">
                  <div className="flex gap-1.5">
                    <span className="w-2 h-2 bg-accent/40 rounded-full animate-bounce [animation-delay:0ms]" />
                    <span className="w-2 h-2 bg-accent/40 rounded-full animate-bounce [animation-delay:150ms]" />
                    <span className="w-2 h-2 bg-accent/40 rounded-full animate-bounce [animation-delay:300ms]" />
                  </div>
                </div>
              </div>
            )}

            {/* Trip Plan: generate button */}
            {showPlanButton && !isLoading && (
              <div className="flex justify-center py-3 animate-in fade-in slide-in-from-bottom-2 duration-500">
                <button
                  onClick={generateTripPlan}
                  disabled={isPlanLoading}
                  className="group flex items-center gap-2.5 px-5 py-3 bg-linear-to-r from-accent/15 to-accent/10 hover:from-accent hover:to-accent/90 border border-accent/25 hover:border-accent rounded-2xl text-accent hover:text-white text-sm font-semibold transition-all duration-300 shadow-lg shadow-accent/10 hover:shadow-accent/25 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50"
                >
                  {isPlanLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Формую план...
                    </>
                  ) : (
                    <>
                      <Plane className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                      ✨ Сформувати план подорожі
                    </>
                  )}
                </button>
              </div>
            )}

            {/* Trip Plan: error message */}
            {planError && (
              <div className="flex justify-center py-2 animate-in fade-in duration-300">
                <p className="text-orange-400/80 text-xs text-center max-w-sm">{planError}</p>
              </div>
            )}

            {/* Trip Plan: visual card */}
            {tripPlan && (
              <div className="py-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <TripPlanCard
                  plan={tripPlan}
                  onClose={() => setTripPlan(null)}
                />
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Scroll to bottom */}
      {showScrollButton && (
        <div className="flex justify-center -mt-12 mb-2 relative z-10">
          <button
            onClick={scrollToBottom}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white/50 hover:text-white transition-all border border-white/10 backdrop-blur-sm shadow-lg"
          >
            <ArrowDown className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Input area — always at the bottom */}
      <div className={`py-4 transition-all duration-500 delay-300 border-t border-white/5 ${mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}>
        <div className="relative">
          <div className="flex items-center gap-2.5 bg-white/4 border border-white/10 focus-within:border-accent/40 rounded-2xl px-4 py-1 transition-all duration-300 focus-within:bg-white/6 focus-within:shadow-[0_0_40px_rgba(15,164,230,0.08)]">
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Напишіть повідомлення..."
              disabled={isLoading}
              className="flex-1 bg-transparent text-white text-sm placeholder-white/25 outline-none py-3.5 disabled:opacity-50"
            />
            <button
              onClick={() => sendMessage()}
              disabled={!input.trim() || isLoading}
              className="w-10 h-10 rounded-xl bg-accent/15 hover:bg-accent text-accent hover:text-white flex items-center justify-center transition-all duration-200 disabled:opacity-20 disabled:hover:bg-accent/15 disabled:hover:text-accent shrink-0"
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
            </button>
          </div>
        </div>
        <p className="text-[10px] text-white/20 text-center mt-2.5 tracking-wide">
          ШІ може помилятися
        </p>
      </div>
      </div>
    </div>
  );
}
